// Git config değişikliklerini izleme
function startConfigWatcher() {
    // Her 10 saniyede bir kontrol et
    configWatcherInterval = setInterval(async () => {
        try {
            // Git config'i al
            const currentConfig = await getGitConfigValues();

            // Değişiklik kontrolü
            if (lastKnownConfig.name !== currentConfig.name || lastKnownConfig.email !== currentConfig.email) {
                // Değişiklik varsa son bilinen config'i güncelle
                lastKnownConfig = currentConfig;

                // Ana pencere açıksa değişikliği bildir
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('git-config-changed', currentConfig);
                }
            }
        } catch (err) {
            console.error('Git config izleme hatası:', err);
        }
    }, 10000); // 10 saniye
}

// İzlemeyi durdur
function stopConfigWatcher() {
    if (configWatcherInterval) {
        clearInterval(configWatcherInterval);
    }
}

// Git config değerlerini al
async function getGitConfigValues() {
    return new Promise((resolve, reject) => {
        exec('git config --global user.name', (err, stdout) => {
            const userName = err ? '' : stdout.trim();

            exec('git config --global user.email', (err2, stdout2) => {
                const userEmail = err2 ? '' : stdout2.trim();
                resolve({ name: userName, email: userEmail });
            });
        });
    });
}

// İlk çalıştırmada profil oluştur
async function checkAndCreateInitialProfile() {
    try {
        // Git config'ten mevcut değerleri al
        const currentConfig = await getGitConfigValues();
        lastKnownConfig = currentConfig;

        // Profiller dosyasını kontrol et
        if (!fs.existsSync(profilesPath)) {
            // Dosya yoksa ve geçerli git config bilgileri varsa ilk profili oluştur
            if (currentConfig.name && currentConfig.email) {
                const initialProfile = {
                    id: Date.now().toString(),
                    name: currentConfig.name,
                    email: currentConfig.email,
                    description: 'Otomatik oluşturulan profil'
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
}// Git config izleme timer'ı
let configWatcherInterval;
// Son bilinen git config durumu
let lastKnownConfig = {
    name: '',
    email: ''
};// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

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
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`
    );

    // Pencere başlamadan önce düzgün yüklenmesini sağla
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    if (isDev) {
        mainWindow.webContents.openDevTools();

        // Geliştirme ortamında React için daha gevşek CSP kuralları
        mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"]
                }
            });
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    createWindow();

    // İlk çalıştırmada aktif git config bilgilerini alıp ilk kez çalıştırılıyorsa kaydet
    checkAndCreateInitialProfile();

    // Git config değişikliklerini izleme başlat
    startConfigWatcher();
});

app.on('window-all-closed', () => {
    // Config watcher'ı durdur
    stopConfigWatcher();

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Git config işlemleri
const gitConfigPath = path.join(os.homedir(), '.gitconfig');

// Mevcut git config'i oku
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

// Aktif profili getir
ipcMain.handle('get-active-profile', async () => {
    return new Promise((resolve, reject) => {
        exec('git config --global user.name', (err, stdout) => {
            if (err) {
                reject(err);
                return;
            }
            const userName = stdout.trim();

            exec('git config --global user.email', (err2, stdout2) => {
                if (err2) {
                    reject(err2);
                    return;
                }
                const userEmail = stdout2.trim();
                resolve({ name: userName, email: userEmail });
            });
        });
    });
});

// Profili güncelle
ipcMain.handle('update-profile', async (event, profile) => {
    return new Promise((resolve, reject) => {
        exec(`git config --global user.name "${profile.name}"`, (err) => {
            if (err) {
                reject(err);
                return;
            }

            exec(`git config --global user.email "${profile.email}"`, (err2) => {
                if (err2) {
                    reject(err2);
                    return;
                }

                resolve({ success: true });
            });
        });
    });
});

// Profilleri kaydet/oku
const profilesPath = path.join(app.getPath('userData'), 'profiles.json');

ipcMain.handle('save-profiles', async (event, profiles) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(profilesPath, JSON.stringify(profiles), 'utf8', (err) => {
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
