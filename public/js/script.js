const API_URL = 'http://localhost:3000/api';

/* --- UI Interaction Functions --- */

function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');

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

/* --- API Helpers --- */

async function postData(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

/* --- Auth Handling --- */

async function handleRegister(e) {
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

async function handleLogin(e) {
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

            updateDashboard(result.user, result.token);
            showDashboard();
        } else {
            showToast(result.message || 'Credenciales inválidas', 'error');
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'error');
        console.error(error);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';

    // Clear inputs
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';

    showToast('Sesión cerrada', 'success');
}

/* --- Dashboard Logic --- */

function showDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    const dashboard = document.getElementById('dashboard-section');
    dashboard.style.display = 'block';
    dashboard.classList.add('active');
}

function updateDashboard(user, token) {
    document.getElementById('user-name-display').textContent = user.name;
    // Token is now only logged to console, not displayed in UI

    const badge = document.getElementById('user-badge');
    badge.textContent = user.level.toUpperCase();

    const roleText = document.getElementById('role-text');
    roleText.textContent = user.level === 'admin' ? 'Administrador' : 'Usuario Estándar';

    // Show specific content based on role
    const adminContent = document.getElementById('admin-content');
    const userContent = document.getElementById('user-content');

    if (user.level === 'admin') {
        adminContent.style.display = 'block';
        userContent.style.display = 'none';
        badge.style.background = 'rgba(236, 72, 153, 0.2)';
        badge.style.color = '#ec4899';
    } else {
        adminContent.style.display = 'none';
        userContent.style.display = 'block';
        badge.style.background = 'rgba(99, 102, 241, 0.2)';
        badge.style.color = '#6366f1';
    }
}

// Check session on load
window.addEventListener('load', () => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        updateDashboard(user, token);
        showDashboard();
    }
});
