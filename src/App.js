import React, { useState, useEffect, useCallback } from 'react';
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
                { id: '1', name: 'Test Kullanıcı', email: 'test@example.com', description: 'Test profili' }
            ]);
            return;
        }

        try {
            const loadedProfiles = await electronAPI.getProfiles();
            setProfiles(loadedProfiles || []);
        } catch (err) {
            console.error('Profiller yüklenemedi:', err);
            setProfiles([]);
            addToast('Profiller yüklenirken hata oluştu', 'error');
        }
    }, [addToast]);

    // Aktif profili yükle
    const loadActiveProfile = useCallback(async () => {
        if (!electronAPI) {
            setActiveProfile({ name: 'Test Kullanıcı', email: 'test@example.com' });
            return;
        }

        try {
            const active = await electronAPI.getActiveProfile();
            setActiveProfile(active);
        } catch (err) {
            console.error('Aktif profil yüklenemedi:', err);
            addToast('Aktif profil bilgisi alınamadı', 'error');
        }
    }, [addToast]);

    // Git config değişikliklerini dinle
    const setupGitConfigListener = useCallback(() => {
        if (!electronAPI || !electronAPI.onGitConfigChanged) return null;

        return electronAPI.onGitConfigChanged((newConfig) => {
            setActiveProfile(newConfig);

            if (!profiles || profiles.length === 0) return;

            const matchingProfile = profiles.find(
                p => p.name === newConfig.name && p.email === newConfig.email
            );

            if (!matchingProfile && newConfig.name && newConfig.email) {
                setExternalChangeDetected(true);
                setExternalProfile(newConfig);
                // Dış değişiklik algılandığında bildirim göster
                addToast('Git config dosyasında değişiklik algılandı', 'info', 5000);
            } else {
                setExternalChangeDetected(false);
            }
        });
    }, [profiles, addToast]);

    // İlk yükleme
    useEffect(() => {
        loadProfiles();
        loadActiveProfile();

        const unsubscribe = setupGitConfigListener();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [loadProfiles, loadActiveProfile, setupGitConfigListener]);

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
        const updatedProfiles = profiles.filter(p => p.id !== profileId);
        await saveProfiles(updatedProfiles);

        // Silme işlemi sonrası bildirim göster
        addToast(`"${deletedProfile?.name}" profili silindi`, 'success');
    }, [profiles, addToast]);

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
            console.error('Profiller kaydedilemedi:', err);
            addToast('Profiller kaydedilirken hata oluştu', 'error');
        }
    }, [electronAPI, addToast]);

    // Profil aktifleştirme işleyicisi
    const handleActivateProfile = useCallback(async (profile) => {
        if (!electronAPI) {
            setActiveProfile({
                name: profile.name,
                email: profile.email
            });
            addToast(`"${profile.name}" profili aktifleştirildi`, 'success');
            return;
        }

        try {
            await electronAPI.updateProfile({
                name: profile.name,
                email: profile.email
            });
            setActiveProfile({
                name: profile.name,
                email: profile.email
            });
            addToast(`"${profile.name}" profili aktifleştirildi`, 'success');
        } catch (err) {
            console.error('Profil aktifleştirilemedi:', err);
            addToast('Profil aktifleştirilemedi', 'error');
        }
    }, [electronAPI, addToast]);

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
            addToast(`"${profile.name}" profili güncellendi`, 'success');
        } else {
            addToast(`"${profile.name}" profili eklendi`, 'success');
        }
    }, [editingProfile, profiles, saveProfiles, addToast]);

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
                description: 'Dış değişiklikten oluşturuldu'
            });
            setShowAddForm(true);
            setExternalChangeDetected(false);
            addToast('Dış değişiklikten yeni profil oluşturuluyor', 'info');
        }
    }, [externalProfile, addToast]);

    // Dış değişikliği yoksay
    const handleIgnoreExternalChange = useCallback(() => {
        setExternalChangeDetected(false);
        addToast('Dış değişiklik yok sayıldı', 'warning');
    }, [addToast]);

    return (
        <div className="app">
            <header className="app-header">
                <h1>Git Profil Yöneticisi</h1>
                <button onClick={handleAddProfile}>Profil Ekle</button>
            </header>

            {externalChangeDetected && (
                <div className="external-change-notification">
                    <div className="notification-content">
                        <p>Uygulama dışında git config değişikliği tespit edildi:</p>
                        <p><strong>İsim:</strong> {externalProfile?.name}</p>
                        <p><strong>E-posta:</strong> {externalProfile?.email}</p>
                        <div className="notification-actions">
                            <button onClick={handleCreateExternalProfile}>Profil Olarak Kaydet</button>
                            <button onClick={handleIgnoreExternalChange}>Yoksay</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="app-container">
                <div className="active-profile-container">
                    <ActiveProfile profile={activeProfile} />
                </div>

                <div className="profiles-container">
                    <h2>Profiller</h2>
                    <ProfileList
                        profiles={profiles}
                        activeProfile={activeProfile}
                        onActivate={handleActivateProfile}
                        onEdit={handleEditProfile}
                        onDelete={handleDeleteProfile}
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
