import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ProfileList from './components/ProfileList';
import ProfileForm from './components/ProfileForm';
import ActiveProfile from './components/ActiveProfile';

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
        }
    }, []);

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
        }
    }, []);

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
            } else {
                setExternalChangeDetected(false);
            }
        });
    }, [profiles]);

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
        const updatedProfiles = profiles.filter(p => p.id !== profileId);
        await saveProfiles(updatedProfiles);
    }, [profiles]);

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
        }
    }, []);

    // Profil aktifleştirme işleyicisi
    const handleActivateProfile = useCallback(async (profile) => {
        if (!electronAPI) {
            setActiveProfile({
                name: profile.name,
                email: profile.email
            });
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
        } catch (err) {
            console.error('Profil aktifleştirilemedi:', err);
        }
    }, []);

    // Profil kaydetme işleyicisi
    const handleSaveProfile = useCallback(async (profile) => {
        let updatedProfiles;

        if (editingProfile) {
            updatedProfiles = profiles.map(p =>
                p.id === editingProfile.id ? { ...profile, id: p.id } : p
            );
        } else {
            const newProfile = {
                ...profile,
                id: Date.now().toString()
            };
            updatedProfiles = [...profiles, newProfile];
        }

        await saveProfiles(updatedProfiles);
        setShowAddForm(false);
    }, [editingProfile, profiles, saveProfiles]);

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
        }
    }, [externalProfile]);

    // Dış değişikliği yoksay
    const handleIgnoreExternalChange = useCallback(() => {
        setExternalChangeDetected(false);
    }, []);

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
        </div>
    );
}

export default App;
