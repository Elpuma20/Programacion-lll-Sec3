import { API_URL, postDataAuth, getData, deleteDataAuth, showToast } from './utils.js';

let cartItems = [];
let cartTotal = 0;

export async function addToCart(productId, quantity = 1) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showToast('Debes iniciar sesión para comprar', 'error');
        return;
    }

    try {
        const result = await postDataAuth(`${API_URL}/cart`, { product_id: productId, quantity }, token);
        if (result.success) {
            showToast('Producto agregado al carrito', 'success');
            fetchCart(); // Update cart count/data if needed immediately
        } else {
            showToast(result.message || 'Error al agregar al carrito', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Error de conexión', 'error');
    }
}

export async function fetchCart() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const result = await getData(`${API_URL}/cart`, token);
        if (result.success) {
            cartItems = result.cart;
            calculateTotal();
            renderCart();
            updateCartCount();
        }
    } catch (error) {
        console.error('Error fetching cart:', error);
    }
}

export async function clearCart() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    if (!confirm('¿Estás seguro de vaciar el carrito?')) return;

    try {
        const result = await deleteDataAuth(`${API_URL}/cart`, token);
        if (result.success) {
            showToast('Carrito vaciado', 'success');
            cartItems = [];
            calculateTotal();
            renderCart();
            updateCartCount();
        } else {
            showToast('Error al vaciar el carrito', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Error de conexión', 'error');
    }
}

function calculateTotal() {
    cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function updateCartCount() {
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

export function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            fetchCart(); // Refresh data when opening
            modal.style.display = 'flex';
        }
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-amount');

    if (totalEl) totalEl.textContent = `$${cartTotal.toFixed(2)}`;

    if (!container) return;

    container.innerHTML = '';

    if (cartItems.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg">No hay productos en tu carrito.</div>';
        return;
    }

    cartItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div class="cart-item-image">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-meta">
                    <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                    <span class="cart-item-quantity">x${item.quantity}</span>
                </div>
            </div>
            <div class="cart-item-total">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        `;
        container.appendChild(itemEl);
    });

    // Render PayPal Button
    renderPayPalButton();
}

function renderPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    // Clear previous button content to avoid duplicates
    container.innerHTML = '';

    if (cartItems.length === 0) {
        return;
    }

    try {
        window.paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'checkout'
            },
            createOrder: function (data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        description: "Compra en RODRI-MARKET",
                        amount: {
                            currency_code: "USD",
                            value: cartTotal.toFixed(2)
                        }
                    }]
                });
            },
            onApprove: function (data, actions) {
                return actions.order.capture().then(async function (details) {
                    showToast('¡Pago exitoso! Gracias ' + details.payer.name.given_name, 'success');

                    // Create order in backend after successful payment
                    const token = localStorage.getItem('authToken');
                    if (!token) return;

                    try {
                        const response = await postDataAuth(`${API_URL}/orders`, {}, token);
                        if (response.success) {
                            showToast('Pedido registrado correctamente', 'success');
                            // Reset cart
                            cartItems = [];
                            calculateTotal();
                            renderCart();
                            updateCartCount();

                            // Close cart modal after short delay
                            setTimeout(() => {
                                toggleCart();
                                // Optional: switch to orders tab to show new order
                                if (window.toggleOrders) {
                                    window.toggleOrders();
                                }
                            }, 1500);
                        } else {
                            showToast('Error al registrar pedido: ' + response.message, 'error');
                        }
                    } catch (error) {
                        console.error('Order creation error:', error);
                        showToast('Error de conexión al registrar pedido', 'error');
                    }
                });
            },
            onError: function (err) {
                console.error('PayPal Error:', err);
                showToast('Hubo un error con el pago de PayPal', 'error');
            }
        }).render('#paypal-button-container');
    } catch (error) {
        console.error('PayPal SDK error:', error);
    }
}
