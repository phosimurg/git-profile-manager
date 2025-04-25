import React, {useState, useEffect} from 'react';
import './ProfileForm.css';

function ProfileForm({profile, onSave, onCancel}) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        description: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                description: profile.description || ''
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="profile-form">
            <h2>{profile ? 'Profili Düzenle' : 'Yeni Profil Ekle'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">İsim</label>
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
                    <label htmlFor="email">E-posta</label>
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
                    <label htmlFor="description">Açıklama (isteğe bağlı)</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="cancel-btn">
                        İptal
                    </button>
                    <button type="submit" className="save-btn">
                        Kaydet
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProfileForm;
