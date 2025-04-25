import React, { useEffect } from 'react';
import './styles/Toast.css';

// Toast bileşeni
const Toast = ({ message, type, onClose, duration = 3000 }) => {
    // Toast'ı süre sonunda otomatik kapat
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    // Toast'ı manuel olarak kapat
    const handleClose = () => {
        onClose();
    };

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                <span>{message}</span>
            </div>
            <button className="toast-close" onClick={handleClose}>
                &times;
            </button>
        </div>
    );
};

export default Toast;
