import React from 'react';
import './styles/ActiveProfile.css';

function ActiveProfile({ profile }) {
    return (
        <div className="active-profile">
            <h2>Aktif Profil</h2>
            {profile ? (
                <div className="profile-details">
                    <p><strong>İsim:</strong> {profile.name}</p>
                    <p><strong>E-posta:</strong> {profile.email}</p>
                </div>
            ) : (
                <p>Aktif profil bulunamadı</p>
            )}
        </div>
    );
}

export default ActiveProfile;
