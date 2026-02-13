import { switchTab, handleRegister, handleLogin, logout } from './auth.js';
import { updateDashboard, showDashboard, switchDashboardTab } from './dashboard.js';
import { handleCreateProduct, editProduct, cancelEdit, deleteProduct, handleSearch } from './products.js';

// --- Initialization ---

window.addEventListener('load', () => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        updateDashboard(user, token);
        showDashboard();
    }
});

// --- Expose functions to window for HTML onclick attributes ---
// This is necessary because modules have their own scope, but the HTML 
// refers to these functions in the global scope.

window.switchTab = switchTab;
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
window.logout = logout;
window.switchDashboardTab = switchDashboardTab;
window.handleCreateProduct = handleCreateProduct;
window.editProduct = editProduct;
window.cancelEdit = cancelEdit;
window.deleteProduct = deleteProduct;
window.handleSearch = handleSearch;
