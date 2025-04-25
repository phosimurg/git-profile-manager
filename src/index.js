import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// React 17 tarzı render - hook hataları için daha kararlı
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
