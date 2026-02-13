import { API_URL, postData, showToast } from './utils.js';
import { updateDashboard, showDashboard, switchDashboardTab } from './dashboard.js';

// Switch Tab Logic (Login <-> Register)
export function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');

    if (!loginForm || !registerForm || tabs.length < 2) return;

    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

export async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const level = document.getElementById('reg-level').value;

    try {
        const result = await postData(`${API_URL}/register`, {
            name,
            email,
            password,
            level
        });

        if (result.success) {
            showToast('¡Registro exitoso! Por favor inicia sesión.', 'success');
            setTimeout(() => switchTab('login'), 1500);
            e.target.reset(); // Clear form
        } else {
            showToast(result.message || 'Error en el registro', 'error');
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'error');
        console.error(error);
    }
}

export async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const result = await postData(`${API_URL}/login`, {
            email,
            password
        });

        if (result.success) {
            console.log('>>> TOKEN DE ACCESO:', result.token);
            showToast('Inicio de sesión exitoso', 'success');

            // Save token and user info
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));

            window.location.href = 'dashboard.html';
        } else {
            showToast(result.message || 'Credenciales inválidas', 'error');
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'error');
        console.error(error);
    }
}

export function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    window.location.href = 'index.html';
}
