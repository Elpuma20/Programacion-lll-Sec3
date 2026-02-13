import { API_URL, getData, postDataAuth, putDataAuth, deleteDataAuth, showToast } from './utils.js';

let allProducts = [];
let editingProductId = null;

export async function fetchProducts(token) {
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

export function searchByCode() {
    const codeInput = document.getElementById('header-search-input');
    if (!codeInput) return;

    const term = codeInput.value.trim().toLowerCase();

    // Ensure we are on the feed view, BUT SKIP FETCHING to avoid overwriting results/clearing input
    if (window.switchDashboardTab) window.switchDashboardTab('overview', true);

    if (!term) {
        // If empty, show all products
        renderProductFeed(allProducts);
        return;
    }

    const filtered = allProducts.filter(p => p.code.toLowerCase().includes(term));

    if (filtered.length > 0) {
        renderProductFeed(filtered);
    } else {
        const feed = document.getElementById('product-feed');
        if (feed) feed.innerHTML = '<div class="loading-products">No se encontraron productos con ese código.</div>';
    }
}

export function renderProductFeed(products) {
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
                <button class="btn-primary" style="width: 100%; margin-top: 10px;" onclick="addToCart(${product.id})">Agregar al Carrito</button>
            </div>
        `;
        feed.appendChild(card);
    });
}

export function renderProducts(products) {
    const tbody = document.getElementById('product-list-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No hay productos disponibles.</td></tr>';
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

export async function handleCreateProduct(e) {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    // Dynamic import to avoid circular dependency if possible, or just use window.logout
    if (!token) {
        showToast('Sesión expirada', 'error');
        if (window.logout) window.logout();
        return;
    }

    const name = document.getElementById('prod-name').value;
    const code = document.getElementById('prod-code').value;
    const price = document.getElementById('prod-price').value;
    const description = document.getElementById('prod-desc').value;

    if (parseFloat(price) <= 0) {
        showToast('El precio debe ser mayor a 0', 'error');
        return;
    }

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

export function editProduct(product) {
    editingProductId = product.id;

    document.getElementById('form-title').textContent = 'Editar Producto';
    document.getElementById('save-btn').textContent = 'Actualizar Producto';
    document.getElementById('cancel-btn').style.display = 'block';

    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-code').value = product.code;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-desc').value = product.description || '';

    // Scroll to form
    const container = document.getElementById('create-product-container');
    if (container) container.scrollIntoView({ behavior: 'smooth' });
}

export function cancelEdit() {
    editingProductId = null;
    document.getElementById('product-form').reset();

    document.getElementById('form-title').textContent = '🛒 Nuevo Producto';
    document.getElementById('save-btn').textContent = 'Guardar Producto';
    document.getElementById('cancel-btn').style.display = 'none';
}

export async function deleteProduct(id) {
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

export function handleSearch(query) {
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
