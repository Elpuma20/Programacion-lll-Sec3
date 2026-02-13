const API_URL = 'http://localhost:3000/api';
let allProducts = []; // Store products locally for filtering
let editingProductId = null; // Track if we are editing a product

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

async function getData(url, token) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

async function putDataAuth(url, data, token) {
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function deleteDataAuth(url, token) {
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

async function postDataAuth(url, data, token) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
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

    // Remove logged-in state (hides header nav)
    document.body.classList.remove('logged-in');

    // Hide header user info
    const headerUserInfo = document.getElementById('header-user-info');
    if (headerUserInfo) headerUserInfo.style.display = 'none';

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

    // UI Elements (use optional chaining or checks as they might not exist in all views)
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

    // Handle Admin/User panel visibility if they exist
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

function switchDashboardTab(tabName) {
    const overviewSection = document.getElementById('overview-section');
    const productSection = document.getElementById('product-section');
    const createProductContainer = document.getElementById('create-product-container');

    // Hide all
    overviewSection.style.display = 'none';
    productSection.style.display = 'none';

    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user && user.level === 'admin';

    if (tabName === 'overview') {
        overviewSection.style.display = 'block';
    } else if (tabName === 'products') {
        // Double check permissions
        if (!isAdmin) {
            showToast('Acceso denegado', 'error');
            switchDashboardTab('overview');
            return;
        }
        productSection.style.display = 'block';
        fetchProducts();
        if (isAdmin) createProductContainer.style.display = 'block';
        else createProductContainer.style.display = 'none';
    }
}

/* --- Product Management Logic --- */

async function fetchProducts(token) {
    // If token not passed, get from storage
    if (!token) token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const result = await getData(`${API_URL}/products`, token);
        if (result.success) {
            allProducts = result.products;
            renderProducts(allProducts); // Render Table
            renderProductFeed(allProducts); // Render Grid (Home)
        } else {
            console.error('Error fetching products:', result.message);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

function renderProductFeed(products) {
    const feed = document.getElementById('product-feed');
    if (!feed) return;

    feed.innerHTML = '';

    if (products.length === 0) {
        feed.innerHTML = '<div class="loading-products">No hay productos disponibles actualmente.</div>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-image">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
            </div>
            <div class="card-content">
                <div class="card-price">$ ${product.price ? product.price.toFixed(2) : '0.00'}</div>
                <div class="card-title">${product.name}</div>
                <div class="card-shipping">Envío gratis</div>
            </div>
        `;
        feed.appendChild(card);
    });
}

function renderProducts(products) {
    const tbody = document.getElementById('product-list-body');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No hay productos disponibles.</td></tr>';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user && user.level === 'admin';

    products.forEach(product => {
        const tr = document.createElement('tr');

        let actionsHtml = '-';
        if (isAdmin) {
            actionsHtml = `
                <div style="display: flex; gap: 8px;">
                    <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick='editProduct(${JSON.stringify(product)})'>Editar</button>
                    <button class="cta-btn" style="padding: 4px 8px; font-size: 0.8rem; background: var(--error); width: auto;" onclick="deleteProduct(${product.id})">Eliminar</button>
                </div>
            `;
        }

        tr.innerHTML = `
            <td><span class="product-code">${product.code}</span></td>
            <td>${product.name}</td>
            <td class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</td>
            <td style="color: #64748b;">${product.description || '-'}</td>
            <td>${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleCreateProduct(e) {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Sesión expirada', 'error');
        logout();
        return;
    }

    const name = document.getElementById('prod-name').value;
    const code = document.getElementById('prod-code').value;
    const price = document.getElementById('prod-price').value;
    const description = document.getElementById('prod-desc').value;

    try {
        let result;
        if (editingProductId) {
            // Update
            result = await putDataAuth(`${API_URL}/products/${editingProductId}`, {
                name, code, price, description
            }, token);
        } else {
            // Create
            result = await postDataAuth(`${API_URL}/products`, {
                name, code, price, description
            }, token);
        }

        if (result.success) {
            showToast(editingProductId ? 'Producto actualizado' : 'Producto creado exitosamente', 'success');
            cancelEdit(); // Reset form
            fetchProducts(token); // Refresh list
        } else {
            showToast(result.message || 'Error al guardar producto', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
        console.error(error);
    }
}

function editProduct(product) {
    editingProductId = product.id;

    document.getElementById('form-title').textContent = 'Editar Producto';
    document.getElementById('save-btn').textContent = 'Actualizar Producto';
    document.getElementById('cancel-btn').style.display = 'block';

    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-code').value = product.code;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-desc').value = product.description || '';

    // Scroll to form
    document.getElementById('create-product-container').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editingProductId = null;
    document.getElementById('product-form').reset();

    document.getElementById('form-title').textContent = 'Nuevo Producto';
    document.getElementById('save-btn').textContent = 'Guardar Producto';
    document.getElementById('cancel-btn').style.display = 'none';
}

async function deleteProduct(id) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        const result = await deleteDataAuth(`${API_URL}/products/${id}`, token);
        if (result.success) {
            showToast('Producto eliminado', 'success');
            fetchProducts(token);
        } else {
            showToast(result.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Error de conexión', 'error');
    }
}

function handleSearch(query) {
    const term = query.toLowerCase().trim();
    if (!term) {
        renderProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(p =>
        p.code.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term)
    );
    renderProducts(filtered);
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
