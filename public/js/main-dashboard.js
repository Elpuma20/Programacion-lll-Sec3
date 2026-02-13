import { logout } from './auth.js';
import { updateDashboard, switchDashboardTab } from './dashboard.js';
import { handleCreateProduct, editProduct, cancelEdit, deleteProduct, handleSearch } from './products.js';

// Authorization Check
window.addEventListener('load', () => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userStr);
    updateDashboard(user, token);
});

// Search Handler
window.handleHeaderSearch = function (event) {
    window.searchByCode();
};

// Expose functions to window
window.logout = logout;
window.switchDashboardTab = switchDashboardTab;
window.handleCreateProduct = handleCreateProduct;
window.editProduct = editProduct;
window.cancelEdit = cancelEdit;
window.deleteProduct = deleteProduct;
window.handleSearch = handleSearch;
window.searchByCode = function () {
    import('./products.js').then(module => {
        module.searchByCode();
    });
};
window.fetchProducts = function () {
    import('./products.js').then(module => {
        module.fetchProducts();
    });
};

/* --- Cart Functions --- */
import { addToCart, toggleCart, clearCart, fetchCart } from './cart.js';
import { fetchOrders, toggleOrders } from './orders.js';

window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.clearCart = clearCart;
window.fetchOrders = fetchOrders;
window.toggleOrders = toggleOrders;

// Initialize cart on load
window.addEventListener('load', () => {
    const token = localStorage.getItem('authToken');
    if (token) fetchCart();
});
