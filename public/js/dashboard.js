import { fetchProducts } from './products.js';
import { showToast } from './utils.js';

export function showDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    const dashboard = document.getElementById('dashboard-section');
    dashboard.style.display = 'block';
    dashboard.classList.add('active');
}

export function updateDashboard(user, token) {
    // Set logged-in state (shows header nav)
    document.body.classList.add('logged-in');

    // Update Header User Info
    const headerUserInfo = document.getElementById('header-user-info');
    const headerUserName = document.getElementById('header-user-name');
    const headerUserRole = document.getElementById('header-user-role');

    if (headerUserInfo) headerUserInfo.style.display = 'flex';
    if (headerUserName) headerUserName.textContent = user.name;
    if (headerUserRole) {
        headerUserRole.textContent = user.level === 'admin' ? 'ADMIN' : 'USUARIO';
        headerUserRole.style.backgroundColor = user.level === 'admin' ? '#1e293b' : 'rgba(255,255,255,0.5)';
        headerUserRole.style.color = user.level === 'admin' ? '#fbbf24' : '#1e293b';
    }

    // UI Elements
    const nameDisplay = document.getElementById('user-name-display');
    if (nameDisplay) nameDisplay.textContent = user.name;

    const badge = document.getElementById('user-badge');
    if (badge) badge.textContent = user.level.toUpperCase();

    const roleText = document.getElementById('role-text');
    if (roleText) roleText.textContent = user.level === 'admin' ? 'Administrador' : 'Usuario Estándar';

    const adminContent = document.getElementById('admin-content');
    const userContent = document.getElementById('user-content');

    // Default to overview
    switchDashboardTab('overview');

    // Handle Admin/User panel visibility
    const navProducts = document.getElementById('nav-products');

    if (user.level === 'admin') {
        if (adminContent) adminContent.style.display = 'block';
        if (userContent) userContent.style.display = 'none';
        if (navProducts) navProducts.style.display = 'block'; // Show for admin
        if (badge) {
            badge.style.background = 'rgba(236, 72, 153, 0.2)';
            badge.style.color = '#ec4899';
        }
    } else {
        if (adminContent) adminContent.style.display = 'none';
        if (userContent) userContent.style.display = 'block';
        if (navProducts) navProducts.style.display = 'none'; // Hide for user
        if (badge) {
            badge.style.background = 'rgba(99, 102, 241, 0.2)';
            badge.style.color = '#6366f1';
        }
    }
}

export function switchDashboardTab(tabName, skipFetch = false) {
    const overviewSection = document.getElementById('overview-section');
    const productSection = document.getElementById('product-section');
    const ordersSection = document.getElementById('orders-section');
    const createProductContainer = document.getElementById('create-product-container');

    // Hide all
    if (overviewSection) overviewSection.style.display = 'none';
    if (productSection) productSection.style.display = 'none';
    if (ordersSection) ordersSection.style.display = 'none';

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user && user.level === 'admin';

    if (tabName === 'overview') {
        if (overviewSection) overviewSection.style.display = 'block';
        if (!skipFetch) fetchProducts();
    } else if (tabName === 'products') {
        // Double check permissions
        if (!isAdmin) {
            showToast('Acceso denegado', 'error');
            switchDashboardTab('overview');
            return;
        }
        if (productSection) productSection.style.display = 'block';
        fetchProducts();
        if (createProductContainer) {
            createProductContainer.style.display = isAdmin ? 'block' : 'none';
        }
    }
}
