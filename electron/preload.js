const { contextBridge, ipcRenderer } = require('electron');

// Tek React'la çalıştığından emin olmak için global window nesnesine bir kontrol ekleyelim
window._reactLoaded = true;

// API'leri window nesnesine güvenli bir şekilde ekleyin
contextBridge.exposeInMainWorld('electronAPI', {
    getGitConfig: () => ipcRenderer.invoke('get-git-config'),
    getActiveProfile: () => ipcRenderer.invoke('get-active-profile'),
    updateProfile: (profile) => ipcRenderer.invoke('update-profile', profile),
    saveProfiles: (profiles) => ipcRenderer.invoke('save-profiles', profiles),
    getProfiles: () => ipcRenderer.invoke('get-profiles'),

    // SSH dosya seçici
    selectSSHKeyFile: () => ipcRenderer.invoke('select-ssh-key-file'),

    // Olay dinleyicileri
    onGitConfigChanged: (callback) => {
        ipcRenderer.on('git-config-changed', (_event, value) => callback(value));
        return () => {
            ipcRenderer.removeAllListeners('git-config-changed');
        };
    }
});
