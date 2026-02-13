import { switchTab, handleRegister, handleLogin } from './auth.js';

// Check if already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        window.location.href = 'dashboard.html';
    }
});

// Expose functions to window
window.switchTab = switchTab;
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
