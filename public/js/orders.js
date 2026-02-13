import { API_URL, getData } from './utils.js';

export async function fetchOrders() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const container = document.getElementById('orders-list-body');
    if (!container) return;

    // Only show loading if empty
    if (container.innerHTML.trim() === '') {
        container.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando pedidos...</td></tr>';
    }

    try {
        const result = await getData(`${API_URL}/orders`, token);
        if (result.success) {
            renderOrders(result.orders);
        } else {
            container.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error al cargar pedidos.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        container.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error de conexión.</td></tr>';
    }
}

export function toggleOrders() {
    const modal = document.getElementById('orders-modal');
    if (modal) {
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            fetchOrders(); // Refresh data when opening
            modal.style.display = 'flex';
        }
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders-list-body');
    if (!container) return;

    container.innerHTML = '';

    if (orders.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No has realizado ninguna compra aún.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const date = new Date(order.date).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td>${date}</td>
            <td style="font-weight: bold;">$${order.total.toFixed(2)}</td>
            <td><span class="status-badge success">Completado</span></td>
        `;
        container.appendChild(tr);
    });
}
