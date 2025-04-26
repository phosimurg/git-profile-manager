import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import ProfileList from './components/ProfileList';
import ProfileForm from './components/ProfileForm';
import ActiveProfile from './components/ActiveProfile';
import ToastContainer from './components/ToastContainer';

// Electron API'sini kontrol ediyoruz
const electronAPI = window.electronAPI || null;

function App() {
    // State tanımlamaları
    const [profiles, setProfiles] = useState([]);
    const [activeProfile, setActiveProfile] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [externalChangeDetected, setExternalChangeDetected] = useState(false);
    const [externalProfile, setExternalProfile] = useState(null);

    // Yükleme durumu için state
    const [isLoading, setIsLoading] = useState(false);

    // Aktivasyon durumunu ref olarak tut (render döngülerini azaltmak için)
    const isActivatingRef = useRef(false);
    const refreshTimeoutRef = useRef(null);

    // Toast bildirimleri için state
    const [toasts, setToasts] = useState([]);

    // Toast bildirimi ekleme fonksiyonu
    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    }, []);

    // Toast bildirimini kaldırma fonksiyonu
    const removeToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    // Profilleri yükle
    const loadProfiles = useCallback(async () => {
        if (!electronAPI) {
            setProfiles([
                { id: '1', name: 'Test User', email: 'test@example.com', description: 'Test profile' }
            ]);
            return;
        }

        try {
            const loadedProfiles = await electronAPI.getProfiles();
            setProfiles(loadedProfiles || []);
        } catch (err) {
            console.error('Failed to load profiles:', err);
            setProfiles([]);
            addToast('Error loading profiles', 'error');
        }
    }, [addToast]);

    // Aktif profili yükle - optimize edilmiş
    const loadActiveProfile = useCallback(async () => {
        if (!electronAPI) {
            setActiveProfile({ name: 'Test User', email: 'test@example.com' });
            return;
        }

        // Aktivasyon işlemi sırasında yenilemeyi engelle
        if (isActivatingRef.current) {
            console.log('Skipping profile refresh during activation');
            return;
        }

        setIsLoading(true);

        try {
            const active = await electronAPI.getActiveProfile();

            // İşlem devam ederken gelen yanıtları yoksay
            if (active.processingInProgress) {
                console.log('Ignoring response during processing');
                setIsLoading(false);
                return;
            }

            if (active.error) {
                addToast('Could not retrieve active profile', 'error');
                setIsLoading(false);
                return;
            }

            setActiveProfile(active);
        } catch (err) {
            console.error('Failed to load active profile:', err);
            addToast('Could not retrieve active profile', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    // İlk yükleme
    useEffect(() => {
        loadProfiles();
        loadActiveProfile();

        // Zamanlayıcıları temizle
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [loadProfiles, loadActiveProfile]);

    // Profil ekle butonu işleyicisi
    const handleAddProfile = useCallback(() => {
        setEditingProfile(null);
        setShowAddForm(true);
    }, []);

    // Profil düzenleme işleyicisi
    const handleEditProfile = useCallback((profile) => {
        setEditingProfile(profile);
        setShowAddForm(true);
    }, []);

    // Profil silme işleyicisi
    const handleDeleteProfile = useCallback(async (profileId) => {
        const deletedProfile = profiles.find(p => p.id === profileId);

        // Aktif profili silmeyi engelle
        if (activeProfile &&
            deletedProfile.name === activeProfile.name &&
            deletedProfile.email === activeProfile.email) {
            addToast('Cannot delete the active profile', 'error');
            return;
        }

        const updatedProfiles = profiles.filter(p => p.id !== profileId);
        await saveProfiles(updatedProfiles);

        // Silme işlemi sonrası bildirim göster
        addToast(`Profile "${deletedProfile?.name}" deleted`, 'success');
    }, [profiles, activeProfile, addToast]);

    // Profilleri kaydet
    const saveProfiles = useCallback(async (updatedProfiles) => {
        if (!electronAPI) {
            setProfiles(updatedProfiles);
            return;
        }

        try {
            await electronAPI.saveProfiles(updatedProfiles);
            setProfiles(updatedProfiles);
        } catch (err) {
            console.error('Failed to save profiles:', err);
            addToast('Error saving profiles', 'error');
        }
    }, [electronAPI, addToast]);

    // Profil aktifleştirme işleyicisi - tamamen yeniden yazıldı
    const handleActivateProfile = useCallback(async (profile) => {
        // Zaten aktifleştiriliyor mu kontrol et
        if (isActivatingRef.current) {
            console.log('Activation already in progress, ignoring request');
            addToast('Please wait, profile activation in progress', 'info');
            return;
        }

        // Zaten aktif olan profili aktifleştirmeyi engelle
        if (activeProfile &&
            profile.name === activeProfile.name &&
            profile.email === activeProfile.email) {
            addToast(`Profile "${profile.name}" is already active`, 'info');
            return;
        }

        // Aktifleştirme durumunu işaretle
        isActivatingRef.current = true;
        setIsLoading(true);

        // Zamanlayıcı varsa temizle
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        try {
            if (!electronAPI) {
                // Test modunda
                setActiveProfile({
                    name: profile.name,
                    email: profile.email
                });
                addToast(`Profile "${profile.name}" activated`, 'success');
                isActivatingRef.current = false;
                setIsLoading(false);
                return;
            }

            // Backend'e profil değişikliği gönder
            const result = await electronAPI.updateProfile({
                name: profile.name,
                email: profile.email,
                editor: profile.editor || '',
                pullRebase: profile.pullRebase || false,
                autocrlf: profile.autocrlf || 'input',
                defaultBranch: profile.defaultBranch || 'main',
                pushDefault: profile.pushDefault || '',
                colorUI: profile.colorUI || 'auto',
                sshKey: profile.sshKey || ''
            });

            if (result.success) {
                // Aktivasyon başarılı - UI'ı güncelle
                // Önbelleğe alınmış verileri kullan, git'ten okumak yerine
                setActiveProfile({
                    name: profile.name,
                    email: profile.email,
                    editor: profile.editor,
                    pullRebase: profile.pullRebase,
                    autocrlf: profile.autocrlf,
                    defaultBranch: profile.defaultBranch,
                    pushDefault: profile.pushDefault,
                    colorUI: profile.colorUI,
                    sshKey: profile.sshKey
                });

                addToast(`Profile "${profile.name}" activated`, 'success');

                // 2.5 saniye sonra git'ten aktif profili yenile
                refreshTimeoutRef.current = setTimeout(() => {
                    loadActiveProfile();
                }, 2500);
            } else {
                // Aktivasyon sırasında bir hata oluştu
                addToast(`Could not activate profile: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (err) {
            console.error('Activation error:', err);
            addToast('Error during profile activation', 'error');
        } finally {
            // İşlem bitti, aktifleştirme durumunu sıfırla (2 saniye sonra)
            setTimeout(() => {
                isActivatingRef.current = false;
                setIsLoading(false);
            }, 2000);
        }
    }, [activeProfile, electronAPI, addToast, loadActiveProfile]);

    // Profil kaydetme işleyicisi
    const handleSaveProfile = useCallback(async (profile) => {
        let updatedProfiles;
        let isEdit = false;

        if (editingProfile) {
            // Düzenleme
            updatedProfiles = profiles.map(p =>
                p.id === editingProfile.id ? { ...profile, id: p.id } : p
            );
            isEdit = true;
        } else {
            // Yeni ekleme
            const newProfile = {
                ...profile,
                id: Date.now().toString()
            };
            updatedProfiles = [...profiles, newProfile];
        }

        await saveProfiles(updatedProfiles);
        setShowAddForm(false);

        // İşlem sonrası bildirim göster
        if (isEdit) {
            addToast(`Profile "${profile.name}" updated`, 'success');

            // Aktif profili düzenlendiyse, aktif profili de güncelle
            if (activeProfile &&
                editingProfile.id &&
                profiles.find(p => p.id === editingProfile.id &&
                    p.name === activeProfile.name &&
                    p.email === activeProfile.email)) {
                // Aktif profil güncellenmiş, değişiklikleri git config'e yansıt
                handleActivateProfile(profile);
            }
        } else {
            addToast(`Profile "${profile.name}" added`, 'success');
        }
    }, [editingProfile, profiles, saveProfiles, addToast, activeProfile, handleActivateProfile]);

    // İptal butonu işleyicisi
    const handleCancelForm = useCallback(() => {
        setShowAddForm(false);
        setEditingProfile(null);
    }, []);

    // Dış değişiklikten profil oluştur
    const handleCreateExternalProfile = useCallback(() => {
        if (externalProfile) {
            setEditingProfile({
                name: externalProfile.name,
                email: externalProfile.email,
                description: 'Created from external change'
            });
            setShowAddForm(true);
            setExternalChangeDetected(false);
            addToast('Creating new profile from external change', 'info');
        }
    }, [externalProfile, addToast]);

    // Dış değişikliği yoksay
    const handleIgnoreExternalChange = useCallback(() => {
        setExternalChangeDetected(false);
        addToast('External change ignored', 'warning');
    }, [addToast]);

    // Profilleri dışa aktar
    const handleExportProfiles = useCallback(() => {
        if (profiles.length === 0) {
            addToast('No profiles to export', 'warning');
            return;
        }

        try {
            // JSON verisini oluştur
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                profiles: profiles
            };

            // JSON verisini stringe dönüştür
            const jsonString = JSON.stringify(exportData, null, 2);

            // Dosyayı indir
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `git-profiles-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();

            // Temizlik
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);

            addToast('Profiles exported successfully', 'success');
        } catch (err) {
            console.error('Export error:', err);
            addToast('Failed to export profiles', 'error');
        }
    }, [profiles, addToast]);

    // Profilleri içe aktar
    const handleImportProfiles = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importData = JSON.parse(e.target.result);

                // Dosya formatını kontrol et
                if (!importData.profiles || !Array.isArray(importData.profiles)) {
                    addToast('Invalid profile file format', 'error');
                    return;
                }

                // Profilleri doğrula
                const validProfiles = importData.profiles.filter(p =>
                    p.name && p.email && p.id
                );

                if (validProfiles.length === 0) {
                    addToast('No valid profiles found in file', 'error');
                    return;
                }

                // ID çakışması olmaması için ID'leri yenile
                const importedProfiles = validProfiles.map(p => ({
                    ...p,
                    id: `${p.id}_${Date.now()}`
                }));

                // Mevcut profillerle birleştir
                const updatedProfiles = [...profiles, ...importedProfiles];
                await saveProfiles(updatedProfiles);

                addToast(`${importedProfiles.length} profiles imported successfully`, 'success');
                event.target.value = ''; // Dosya girdisini temizle
            } catch (err) {
                console.error('Import error:', err);
                addToast('Failed to import profiles', 'error');
                event.target.value = ''; // Hata durumunda da temizle
            }
        };

        reader.onerror = () => {
            addToast('Error reading file', 'error');
            event.target.value = '';
        };

        reader.readAsText(file);
    }, [profiles, saveProfiles, addToast]);

    // Manuel profil yenileme
    const handleRefreshProfile = useCallback(() => {
        if (isActivatingRef.current || isLoading) {
            addToast('Please wait, an operation is in progress', 'info');
            return;
        }

        loadActiveProfile();
        addToast('Refreshing profile information...', 'info');
    }, [loadActiveProfile, isLoading, addToast]);

    return (
        <div className="app">
            <header className="app-header">
                <h1>Git Profile Manager</h1>
                <div className="header-actions">
                    <div className="import-export-buttons">
                        <button onClick={() => document.getElementById('import-file').click()} className="import-btn">
                            Import
                        </button>
                        <input
                            type="file"
                            id="import-file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleImportProfiles}
                        />
                        <button onClick={handleExportProfiles} className="export-btn">
                            Export
                        </button>
                        <button
                            onClick={handleRefreshProfile}
                            className="refresh-btn"
                            disabled={isLoading || isActivatingRef.current}
                        >
                            {isLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                    <button onClick={handleAddProfile} className="add-btn">
                        Add Profile
                    </button>
                </div>
            </header>

            {isLoading && (
                <div className="loading-indicator">
                    <span>Processing, please wait...</span>
                </div>
            )}

            {externalChangeDetected && (
                <div className="external-change-notification">
                    <div className="notification-content">
                        <p>External change detected in git config:</p>
                        <p><strong>Name:</strong> {externalProfile?.name}</p>
                        <p><strong>Email:</strong> {externalProfile?.email}</p>
                        <div className="notification-actions">
                            <button onClick={handleCreateExternalProfile}>Save as Profile</button>
                            <button onClick={handleIgnoreExternalChange}>Ignore</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="app-container">
                <div className="active-profile-container">
                    <ActiveProfile profile={activeProfile} />
                </div>

                <div className="profiles-container">
                    <h2>Profiles</h2>
                    <ProfileList
                        profiles={profiles}
                        activeProfile={activeProfile}
                        onActivate={handleActivateProfile}
                        onEdit={handleEditProfile}
                        onDelete={handleDeleteProfile}
                        isActivating={isActivatingRef.current || isLoading}
                    />
                </div>
            </div>

            {showAddForm && (
                <div className="overlay">
                    <div className="form-popup">
                        <ProfileForm
                            profile={editingProfile}
                            onSave={handleSaveProfile}
                            onCancel={handleCancelForm}
                        />
                    </div>
                </div>
            )}

            {/* Toast bildirimlerini göster */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

export default App;
