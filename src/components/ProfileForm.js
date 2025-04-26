import React, { useState, useEffect } from 'react';
import './styles/ProfileForm.css';

// Sekme tipleri
const TABS = {
    BASIC: 'basic',
    GIT_CONFIG: 'git_config',
    SSH: 'ssh'
};

function ProfileForm({ profile, onSave, onCancel }) {
    const [activeTab, setActiveTab] = useState(TABS.BASIC);
    const [formData, setFormData] = useState({
        // Temel bilgiler
        name: '',
        email: '',
        description: '',

        // Git config ayarları
        editor: '',
        pullRebase: false,
        autocrlf: 'input',
        defaultBranch: 'main',
        pushDefault: '',
        colorUI: 'auto',

        // SSH ayarları
        sshKey: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                description: profile.description || '',
                editor: profile.editor || '',
                pullRebase: profile.pullRebase || false,
                autocrlf: profile.autocrlf || 'input',
                defaultBranch: profile.defaultBranch || 'main',
                pushDefault: profile.pushDefault || '',
                colorUI: profile.colorUI || 'auto',
                sshKey: profile.sshKey || ''
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleFileSelect = async () => {
        // Electron dosya seçicisini kullan
        try {
            const filePath = await window.electronAPI.selectSSHKeyFile();
            if (filePath) {
                setFormData(prev => ({
                    ...prev,
                    sshKey: filePath
                }));
            }
        } catch (err) {
            console.error('Error selecting SSH key file:', err);
        }
    };

    return (
        <div className="profile-form">
            <h2>{profile ? 'Edit Profile' : 'Add New Profile'}</h2>

            <div className="tab-navigation">
                <button
                    className={`tab-button ${activeTab === TABS.BASIC ? 'active' : ''}`}
                    onClick={() => handleTabChange(TABS.BASIC)}
                >
                    Basic Info
                </button>
                <button
                    className={`tab-button ${activeTab === TABS.GIT_CONFIG ? 'active' : ''}`}
                    onClick={() => handleTabChange(TABS.GIT_CONFIG)}
                >
                    Git Config
                </button>
                <button
                    className={`tab-button ${activeTab === TABS.SSH ? 'active' : ''}`}
                    onClick={() => handleTabChange(TABS.SSH)}
                >
                    SSH Settings
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Temel Bilgiler Sekmesi */}
                <div className={`tab-content ${activeTab === TABS.BASIC ? 'active' : ''}`}>
                    <div className="form-section">
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description (optional)</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Git Config Sekmesi */}
                <div className={`tab-content ${activeTab === TABS.GIT_CONFIG ? 'active' : ''}`}>
                    <div className="form-section">
                        <div className="form-group">
                            <label htmlFor="editor">Default Editor</label>
                            <select
                                id="editor"
                                name="editor"
                                value={formData.editor}
                                onChange={handleChange}
                            >
                                <option value="">System Default</option>
                                <option value="vim">Vim</option>
                                <option value="nano">Nano</option>
                                <option value="code">Visual Studio Code</option>
                                <option value="atom">Atom</option>
                                <option value="sublime">Sublime Text</option>
                                <option value="notepad">Notepad</option>
                                <option value="notepad++">Notepad++</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="pullRebase">
                                <input
                                    type="checkbox"
                                    id="pullRebase"
                                    name="pullRebase"
                                    checked={formData.pullRebase}
                                    onChange={handleChange}
                                />
                                Use rebase instead of merge on pull
                            </label>
                        </div>

                        <div className="form-group">
                            <label htmlFor="autocrlf">Line Ending Handling (autocrlf)</label>
                            <select
                                id="autocrlf"
                                name="autocrlf"
                                value={formData.autocrlf}
                                onChange={handleChange}
                            >
                                <option value="input">Convert to LF on commit (input)</option>
                                <option value="true">Convert to LF on commit, CRLF on checkout (true)</option>
                                <option value="false">No conversion (false)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="defaultBranch">Default Branch Name</label>
                            <input
                                type="text"
                                id="defaultBranch"
                                name="defaultBranch"
                                value={formData.defaultBranch}
                                onChange={handleChange}
                                placeholder="main"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="pushDefault">Default Push Remote</label>
                            <input
                                type="text"
                                id="pushDefault"
                                name="pushDefault"
                                value={formData.pushDefault}
                                onChange={handleChange}
                                placeholder="origin"
                            />
                            <p className="field-help">
                                Default remote to push to, leave empty for default behavior
                            </p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="colorUI">Color UI</label>
                            <select
                                id="colorUI"
                                name="colorUI"
                                value={formData.colorUI}
                                onChange={handleChange}
                            >
                                <option value="auto">Auto</option>
                                <option value="always">Always</option>
                                <option value="never">Never</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* SSH Ayarları Sekmesi */}
                <div className={`tab-content ${activeTab === TABS.SSH ? 'active' : ''}`}>
                    <div className="form-section">
                        <div className="form-group">
                            <label htmlFor="sshKey">SSH Key Path</label>
                            <div className="file-input-container">
                                <input
                                    type="text"
                                    id="sshKey"
                                    name="sshKey"
                                    value={formData.sshKey}
                                    onChange={handleChange}
                                    placeholder="~/.ssh/id_rsa"
                                    className="file-path-input"
                                />
                                <button
                                    type="button"
                                    className="file-browse-btn"
                                    onClick={handleFileSelect}
                                >
                                    Browse
                                </button>
                            </div>
                            <input
                                type="file"
                                id="ssh-key-file"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                            <p className="field-help">
                                Path to the SSH private key file for this profile.
                                Leave empty to use system default.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="cancel-btn">
                        Cancel
                    </button>
                    <button type="submit" className="save-btn">
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProfileForm;
