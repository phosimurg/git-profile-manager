import React from 'react';
import './ProfileList.css';

function ProfileList({profiles, activeProfile, onActivate, onEdit, onDelete}) {
    // İki profilin aynı olup olmadığını kontrol et
    const isActive = (profile) => {
        if (!activeProfile) return false;
        return profile.name === activeProfile.name &&
            profile.email === activeProfile.email;
    };

    return (
        <div className="profile-list">
            {profiles.length === 0 ? (
                <p>Henüz profil bulunmuyor. Bir profil ekleyin.</p>
            ) : (
                <ul>
                    {profiles.map(profile => (
                        <li
                            key={profile.id}
                            className={isActive(profile) ? 'active' : ''}
                        >
                            <div className="profile-info">
                                <h3>{profile.name}</h3>
                                <p>{profile.email}</p>
                                {profile.description && <p className="description">{profile.description}</p>}
                            </div>
                            <div className="profile-actions">
                                {!isActive(profile) && (
                                    <button
                                        onClick={() => onActivate(profile)}
                                        className="activate-btn"
                                    >
                                        Aktifleştir
                                    </button>
                                )}
                                <button
                                    onClick={() => onEdit(profile)}
                                    className="edit-btn"
                                >
                                    Düzenle
                                </button>
                                <button
                                    onClick={() => onDelete(profile.id)}
                                    className="delete-btn"
                                >
                                    Sil
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ProfileList;
