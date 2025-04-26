// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

// Uygulama durumu bayrağı - aktivasyon döngüsünü önlemek için
let applicationState = {
    isProcessing: false,
    processingTimeout: null,
    lastKnownConfig: {
        name: '',
        email: ''
    }
};

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 680,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        },
        icon: path.join(__dirname, '../assets/icon.png'),
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    mainWindow.loadURL(startUrl);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    if (isDev) {
        mainWindow.webContents.openDevTools();

        mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"]
                }
            });
        });
    }
}

app.on('ready', () => {
    createWindow();
    checkAndCreateInitialProfile();
    // Config watcher'ı KALDIRILDI - gereksiz performans tüketimi ve döngü sorunları
});

app.on('window-all-closed', () => {
    clearApplicationState();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Uygulama durumunu temizle
function clearApplicationState() {
    if (applicationState.processingTimeout) {
        clearTimeout(applicationState.processingTimeout);
    }
    applicationState.isProcessing = false;
}

// Git config değerlerini al - daha verimli synchronous versiyon
function getGitConfigValues() {
    try {
        const profile = {};

        try {
            profile.name = execSync('git config --global user.name').toString().trim();
        } catch (e) {
            profile.name = '';
        }

        try {
            profile.email = execSync('git config --global user.email').toString().trim();
        } catch (e) {
            profile.email = '';
        }

        return profile;
    } catch (err) {
        console.error('Error getting git config values:', err);
        return { name: '', email: '' };
    }
}

// Profil dosya yolu
const getProfilesPath = () => {
    return path.join(app.getPath('userData'), 'profiles.json');
};

// Git config dosyası yolu
const gitConfigPath = path.join(os.homedir(), '.gitconfig');

// İlk çalıştırmada profil oluştur
async function checkAndCreateInitialProfile() {
    try {
        // Git config'ten mevcut değerleri al
        const currentConfig = getGitConfigValues();
        applicationState.lastKnownConfig = currentConfig;

        const profilesPath = getProfilesPath();

        // Profiller dosyasını kontrol et
        if (!fs.existsSync(profilesPath)) {
            // Dosya yoksa ve geçerli git config bilgileri varsa ilk profili oluştur
            if (currentConfig.name && currentConfig.email) {
                const initialProfile = {
                    id: Date.now().toString(),
                    name: currentConfig.name,
                    email: currentConfig.email,
                    description: 'Automatically created profile'
                };

                // Profiller dizinini oluştur (yoksa)
                const profilesDir = path.dirname(profilesPath);
                if (!fs.existsSync(profilesDir)) {
                    fs.mkdirSync(profilesDir, { recursive: true });
                }

                // İlk profili kaydet
                fs.writeFileSync(profilesPath, JSON.stringify([initialProfile]), 'utf8');
            }
        }
    } catch (err) {
        console.error('İlk profil oluşturma hatası:', err);
    }
}

// Git config dosyasını oku
ipcMain.handle('get-git-config', async () => {
    return new Promise((resolve, reject) => {
        fs.readFile(gitConfigPath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
});

// Aktif profili getir - tüm konfigürasyon ayarlarını synchronous şekilde oku
ipcMain.handle('get-active-profile', async () => {
    // İşlem yapılırken profil okumayı engelle
    if (applicationState.isProcessing) {
        console.log('Skipping profile retrieval during processing');
        return { processingInProgress: true };
    }

    try {
        const profile = {};

        try { profile.name = execSync('git config --global user.name').toString().trim(); } catch (e) { profile.name = ''; }
        try { profile.email = execSync('git config --global user.email').toString().trim(); } catch (e) { profile.email = ''; }
        try { profile.editor = execSync('git config --global core.editor').toString().trim(); } catch (e) { profile.editor = ''; }
        try { profile.pullRebase = execSync('git config --global pull.rebase').toString().trim() === 'true'; } catch (e) { profile.pullRebase = false; }
        try { profile.autocrlf = execSync('git config --global core.autocrlf').toString().trim(); } catch (e) { profile.autocrlf = 'input'; }
        try { profile.defaultBranch = execSync('git config --global init.defaultBranch').toString().trim(); } catch (e) { profile.defaultBranch = 'main'; }
        try { profile.pushDefault = execSync('git config --global push.default').toString().trim(); } catch (e) { profile.pushDefault = ''; }
        try { profile.colorUI = execSync('git config --global color.ui').toString().trim(); } catch (e) { profile.colorUI = 'auto'; }

        try {
            const sshCommand = execSync('git config --global core.sshCommand').toString().trim();
            const sshCmdMatch = sshCommand.match(/-i\s+([^\s]+)/);
            profile.sshKey = sshCmdMatch && sshCmdMatch[1] ? sshCmdMatch[1].trim() : '';
        } catch (e) {
            profile.sshKey = '';
        }

        // Son bilinen değerleri güncelle
        applicationState.lastKnownConfig = {
            name: profile.name,
            email: profile.email
        };

        return profile;
    } catch (err) {
        console.error('Error getting active profile:', err);
        return { error: true, message: 'Could not retrieve profile information' };
    }
});

// Profili güncelle - tamamıyla yenilenmiş versiyon
ipcMain.handle('update-profile', async (event, profile) => {
    return new Promise((resolve, reject) => {
        // İşlem zaten yapılıyor mu kontrol et
        if (applicationState.isProcessing) {
            console.log('Processing already in progress, ignoring request');
            resolve({ success: false, error: 'Another operation is in progress' });
            return;
        }

        // İşlem başlıyor - bayrağı ayarla
        applicationState.isProcessing = true;
        console.log('Starting profile activation for:', profile.name);

        // Zamanlayıcı varsa temizle
        if (applicationState.processingTimeout) {
            clearTimeout(applicationState.processingTimeout);
        }

        try {
            // Temel config ayarları - senkron olarak çalıştır
            try {
                execSync(`git config --global user.name "${profile.name}"`);
                execSync(`git config --global user.email "${profile.email}"`);
            } catch (err) {
                applicationState.isProcessing = false;
                reject(err);
                return;
            }

            // Gelişmiş ayarlar - senkron olarak çalıştır
            try {
                // Editor ayarı
                if (profile.editor) {
                    execSync(`git config --global core.editor "${profile.editor}"`);
                }

                // Pull rebase ayarı
                const rebaseValue = profile.pullRebase ? 'true' : 'false';
                execSync(`git config --global pull.rebase ${rebaseValue}`);

                // Autocrlf ayarı
                if (profile.autocrlf) {
                    execSync(`git config --global core.autocrlf ${profile.autocrlf}`);
                }

                // Default branch ayarı
                if (profile.defaultBranch) {
                    execSync(`git config --global init.defaultBranch ${profile.defaultBranch}`);
                }

                // Push default ayarı
                if (profile.pushDefault) {
                    execSync(`git config --global push.default ${profile.pushDefault}`);
                }

                // Color UI ayarı
                if (profile.colorUI) {
                    execSync(`git config --global color.ui ${profile.colorUI}`);
                }

                // SSH anahtarı ayarı
                if (profile.sshKey && profile.sshKey.trim() !== '') {
                    const sshCommand = `ssh -i ${profile.sshKey}`;
                    execSync(`git config --global core.sshCommand "${sshCommand}"`);
                } else {
                    // SSH ayarını kaldır
                    try {
                        execSync(`git config --global --unset core.sshCommand`);
                    } catch (e) {
                        // Key olmadığı için hata olabilir, sorun değil
                    }
                }

                // Son bilinen config değerlerini güncelle
                applicationState.lastKnownConfig = {
                    name: profile.name,
                    email: profile.email
                };

                // 2 saniye sonra işlem bayrağını kaldır
                applicationState.processingTimeout = setTimeout(() => {
                    applicationState.isProcessing = false;
                    console.log('Profile activation completed and processing flag cleared');
                }, 2000);

                // Başarılı
                resolve({ success: true });
            } catch (configErr) {
                console.error('Error setting advanced git config:', configErr);

                // İşlem bayrağını kaldır
                applicationState.isProcessing = false;

                // Bazı ayarlar başarısız olmuş olabilir ama ana profil ayarlandı
                resolve({
                    success: true,
                    warning: 'Some advanced settings may not have been applied'
                });
            }
        } catch (outerErr) {
            console.error('Unexpected error during profile update:', outerErr);
            applicationState.isProcessing = false;
            reject(outerErr);
        }
    });
});

// SSH anahtarı dosyası seçici
ipcMain.handle('select-ssh-key-file', async () => {
    return new Promise((resolve, reject) => {
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            title: 'Select SSH Key File',
            defaultPath: os.homedir(),
            buttonLabel: 'Select Key',
            filters: [
                { name: 'SSH Keys', extensions: ['', 'pem', 'ppk', 'key'] }
            ]
        }).then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                resolve(result.filePaths[0]);
            } else {
                resolve(null);
            }
        }).catch(err => {
            reject(err);
        });
    });
});

// Profilleri kaydet/oku
ipcMain.handle('save-profiles', async (event, profiles) => {
    return new Promise((resolve, reject) => {
        const profilesPath = getProfilesPath();
        fs.writeFile(profilesPath, JSON.stringify(profiles, null, 2), 'utf8', (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({ success: true });
        });
    });
});

ipcMain.handle('get-profiles', async () => {
    return new Promise((resolve, reject) => {
        const profilesPath = getProfilesPath();
        fs.readFile(profilesPath, 'utf8', (err, data) => {
            if (err) {
                // Dosya yoksa boş bir dizi döndür
                if (err.code === 'ENOENT') {
                    resolve([]);
                    return;
                }
                reject(err);
                return;
            }
            try {
                const profiles = JSON.parse(data);
                resolve(profiles);
            } catch (parseErr) {
                reject(parseErr);
            }
        });
    });
});
