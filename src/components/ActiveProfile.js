import React, {useState, useEffect} from 'react';
import './styles/ActiveProfile.css';

function ActiveProfile({profile}) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [error, setError] = useState(null);

    // Profil değiştiğinde hata durumunu sıfırla
    useEffect(() => {
        setError(null);
    }, [profile]);

    const toggleAdvanced = () => {
        setShowAdvanced(!showAdvanced);
    };

    // Editor adını daha okunabilir hale getir
    const getEditorName = (editorCode) => {
        const editors = {
            'vim': 'Vim',
            'nano': 'Nano',
            'code': 'Visual Studio Code',
            'atom': 'Atom',
            'sublime': 'Sublime Text'
        };

        return editors[editorCode] || editorCode || 'System Default';
    };

    // Autocrlf değerini daha açıklayıcı hale getir
    const getAutocrlfDesc = (value) => {
        switch (value) {
            case 'true':
                return 'Convert to LF on commit, CRLF on checkout';
            case 'input':
                return 'Convert to LF on commit only';
            case 'false':
                return 'No conversion';
            default:
                return value || 'Default';
        }
    };

    // Değerin güvenli şekilde görüntülenmesi
    const safeDisplay = (value, defaultValue = 'Not set') => {
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        return value;
    };

    return (
        <div className="active-profile">
            <h2>Active Profile</h2>
            {error ? (
                <div className="profile-error">
                    <p>Error loading profile: {error}</p>
                </div>
            ) : profile ? (
                <div className="profile-details">
                    <div className="basic-info">
                        <p><strong>Name:</strong> {safeDisplay(profile.name)}</p>
                        <p><strong>Email:</strong> {safeDisplay(profile.email)}</p>
                        {profile.sshKey && (
                            <p><strong>SSH Key:</strong> {safeDisplay(profile.sshKey)}</p>
                        )}
                    </div>

                    <button
                        className="toggle-advanced-btn"
                        onClick={toggleAdvanced}
                    >
                        {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                    </button>

                    {showAdvanced && (
                        <div className="advanced-info">
                            <h3>Advanced Git Settings</h3>
                            <p><strong>Default Editor:</strong> {getEditorName(profile.editor)}</p>
                            <p><strong>Pull Strategy:</strong> {profile.pullRebase ? 'Rebase' : 'Merge'}</p>
                            <p><strong>Line Endings:</strong> {getAutocrlfDesc(profile.autocrlf)}</p>
                            <p><strong>Default Branch:</strong> {safeDisplay(profile.defaultBranch, 'main')}</p>
                            <p><strong>Push Default:</strong> {safeDisplay(profile.pushDefault, 'simple')}</p>
                            <p><strong>Color UI:</strong> {safeDisplay(profile.colorUI, 'auto')}</p>
                        </div>
                    )}
                </div>
            ) : (
                <p>No active profile found</p>
            )}
        </div>
    );
}

export default ActiveProfile;
