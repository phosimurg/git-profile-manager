import React, { useState, useEffect } from 'react';
import './styles/ProfileList.css';

function ProfileList({ profiles, activeProfile, onActivate, onEdit, onDelete, isActivating }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProfiles, setFilteredProfiles] = useState(profiles);

    // Profiller değiştiğinde veya arama terimi değiştiğinde filtreleme yap
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredProfiles(profiles);
            return;
        }

        const term = searchTerm.toLowerCase().trim();
        const filtered = profiles.filter(profile => {
            return (
                profile.name.toLowerCase().includes(term) ||
                profile.email.toLowerCase().includes(term) ||
                (profile.description && profile.description.toLowerCase().includes(term))
            );
        });

        setFilteredProfiles(filtered);
    }, [profiles, searchTerm]);

    // İki profilin aynı olup olmadığını kontrol et - daha sağlam karşılaştırma
    const isActive = (profile) => {
        if (!activeProfile) return false;

        // Temel iki alan için kesin eşleşme
        return profile.name === activeProfile.name &&
            profile.email === activeProfile.email;
    };

    // Aktifleştirme butonuna tıklanınca çağrılacak fonksiyon
    const handleActivate = (profile) => {
        // Zaten aktifse veya işlem yapılıyorsa aktifleştirmeyi önle
        if (isActive(profile) || isActivating) {
            return;
        }

        onActivate(profile);
    };

    return (
        <div className="profile-list">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                {searchTerm && (
                    <button
                        className="clear-search"
                        onClick={() => setSearchTerm('')}
                    >
                        ×
                    </button>
                )}
            </div>

            {filteredProfiles.length === 0 ? (
                <p className="no-results">
                    {profiles.length === 0
                        ? "No profiles yet. Please add a profile."
                        : "No profiles match your search."}
                </p>
            ) : (
                <ul>
                    {filteredProfiles.map(profile => (
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
                                {!isActive(profile) ? (
                                    <button
                                        onClick={() => handleActivate(profile)}
                                        className="activate-btn"
                                        disabled={isActivating}
                                    >
                                        {isActivating ? 'Wait...' : 'Activate'}
                                    </button>
                                ) : (
                                    <span className="active-indicator">Active</span>
                                )}
                                <button
                                    onClick={() => onEdit(profile)}
                                    className="edit-btn"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(profile.id)}
                                    className="delete-btn"
                                    disabled={isActive(profile)}
                                >
                                    Delete
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
