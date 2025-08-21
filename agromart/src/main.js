import { getSupabase } from './supabase.js';
import { ProductCard } from './components/ProductCard.js';
import * as cart from './cart.js';
import * as auth from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- App State ---
    let products = [];
    let appConfig = {};
    let currentUser = null;
    let isLoginMode = true;

    // --- DOM Elements ---
    const productGrid = document.getElementById('product-grid');
    const mainContent = document.getElementById('main-content');
    const cartButton = document.getElementById('cart-button');
    const authButton = document.getElementById('auth-button');
    const pages = {
        listing: document.getElementById('product-listing-page'),
        cart: document.getElementById('cart-page'),
        checkout: document.getElementById('checkout-page'),
    };
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authToggleLink = document.getElementById('auth-toggle-link');
    const fullnameField = document.getElementById('fullname-field');
    const authCloseButton = document.getElementById('auth-close-button');
    const authError = document.getElementById('auth-error');

    // --- PWA Service Worker ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(reg => console.log('SW registered', reg)).catch(err => console.log('SW not registered', err));
    }

    // --- Initialization ---
    const supabase = await getSupabase();
    if (!supabase) return;

    const fetchAppConfig = async () => {
        try {
            const response = await fetch('/api/util');
            appConfig = await response.json();
        } catch (error) {
            console.error("Failed to load app config:", error);
            mainContent.innerHTML = `<p class="text-red-500">Error loading application configuration.</p>`;
        }
    };

    const fetchProducts = async () => {
        const { data, error } = await supabase.from('products').select('*').eq('active', true);
        if (error) {
            console.error('Error fetching products:', error);
            return;
        }
        products = data;
        renderProducts();
    };

    // --- Rendering & UI ---
    const renderProducts = () => {
        if (productGrid) productGrid.innerHTML = products.map(p => ProductCard(p)).join('');
    }

    const showPage = (pageName) => {
        Object.values(pages).forEach(p => p.classList.add('hidden'));
        if (pages[pageName]) pages[pageName].classList.remove('hidden');
    };

    const updateCartButton = () => cartButton.textContent = `View Cart (${cart.getCartCount()})`;

    const updateAuthUI = () => {
        if (currentUser) {
            authButton.textContent = 'Logout';
            closeAuthModal();
        } else {
            authButton.textContent = 'Login';
        }
    };

    const renderCartPage = () => {
        const items = cart.getCartItems();
        const total = cart.getCartTotal();

        if (items.length === 0) {
            pages.cart.innerHTML = `<h2 class="text-2xl font-semibold mb-4">Your Cart is Empty</h2><button id="back-to-shop" class="bg-gray-500 text-white px-4 py-2 rounded">Continue Shopping</button>`;
            document.getElementById('back-to-shop').onclick = () => showPage('listing');
            return;
        }

        const itemsHtml = items.map(item => `
            <div class="flex justify-between items-center border-b py-2">
                <div>
                    <p class="font-bold">${item.title}</p>
                    <p class="text-sm text-gray-600">Qty: ${item.quantity} @ ₦${item.price_min.toLocaleString()}</p>
                </div>
                <p class="font-semibold">₦${(item.quantity * item.price_min).toLocaleString()}</p>
            </div>
        `).join('');

        pages.cart.innerHTML = `
            <h2 class="text-2xl font-semibold mb-4">Your Cart</h2>
            ${itemsHtml}
            <div class="text-right font-bold text-xl mt-4">Total: ₦${total.toLocaleString()}</div>
            <div class="flex justify-end gap-4 mt-4">
                <button id="back-to-shop" class="bg-gray-500 text-white px-4 py-2 rounded">Continue Shopping</button>
                <button id="go-to-checkout" class="bg-green-500 text-white px-4 py-2 rounded">Proceed to Checkout</button>
            </div>
        `;
        document.getElementById('back-to-shop').onclick = () => showPage('listing');
        document.getElementById('go-to-checkout').onclick = () => {
            renderCheckoutPage();
            showPage('checkout');
        };
    };

    const renderCheckoutPage = () => {
        const total = cart.getCartTotal();
        pages.checkout.innerHTML = `
            <h2 class="text-2xl font-semibold mb-4">Checkout</h2>
            <form id="checkout-form">
                <div class="mb-4">
                    <label for="shipping_name" class="block">Full Name</label>
                    <input type="text" id="shipping_name" name="name" class="w-full p-2 border rounded" required>
                </div>
                <div class="mb-4">
                    <label for="shipping_phone" class="block">Phone Number</label>
                    <input type="tel" id="shipping_phone" name="phone" class="w-full p-2 border rounded" required>
                </div>
                <div class="mb-4">
                    <label for="shipping_address" class="block">Delivery Address</label>
                    <textarea id="shipping_address" name="address" class="w-full p-2 border rounded" required></textarea>
                </div>
                <div class="mb-4">
                    <label for="shipping_note" class="block">Order Note (Optional)</label>
                    <textarea id="shipping_note" name="note" class="w-full p-2 border rounded"></textarea>
                </div>
                <div class="font-bold text-xl mt-4">Total: ₦${total.toLocaleString()}</div>
                <div class="flex justify-end gap-4 mt-6">
                     <button type="submit" name="method" value="pay_now" class="bg-blue-500 text-white px-4 py-2 rounded">Pay Now (Bank Transfer)</button>
                     <button type="submit" name="method" value="pay_on_delivery" class="bg-green-500 text-white px-4 py-2 rounded">Pay on Delivery</button>
                </div>
            </form>
        `;
        document.getElementById('checkout-form').onsubmit = handleCheckout;
    };

    const handleAddToCart = (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const card = e.target.closest('[data-product-id]');
            const productId = Number(card.dataset.productId);
            const product = products.find(p => p.id === productId);
            const quantity = Number(card.querySelector('input[name="quantity"]').value);
            if (product && quantity > 0) {
                cart.addToCart(product, quantity);
                alert(`${quantity} x ${product.title} added to cart!`);
            }
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("You must be logged in to checkout.");
            openAuthModal();
            return;
        }

        const formData = new FormData(e.target);
        const method = e.submitter.value;
        const shipping = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            note: formData.get('note'),
        };
        const items = cart.getCartItems().map(i => ({ id: i.id, title: i.title, unit: i.unit, qty: i.quantity, price: i.price_min }));
        const total = cart.getCartTotal();

        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ items, total, method, shipping }),
        });
        const order = await response.json();

        if (order.error) {
            alert(`Error creating order: ${order.error}`);
            return;
        }

        // Add checks to ensure appConfig is loaded before using it
        if (!appConfig.WHATSAPP || !appConfig.BANK) {
            alert('Critical Error: Application configuration is missing. Cannot proceed with payment flow.');
            return;
        }

        if (method === 'pay_on_delivery') {
            const itemsText = items.map(i => `${i.title} × ${i.qty} - ₦${(i.price * i.qty).toLocaleString()}`).join('\\n');
            const message = `*New POD Request*\\n\\nOrder #${order.id}\\n\\nItems:\\n${itemsText}\\n\\nTotal: *₦${total.toLocaleString()}*\\n\\n---\\n\\nCustomer:\\n${shipping.name}\\n${shipping.phone}\\n${shipping.address}\\nNote: ${shipping.note}`;
            window.open(`https://wa.me/${appConfig.WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
        } else { // pay_now
            pages.checkout.innerHTML = `
                <h2 class="text-2xl font-semibold mb-4">Pay Now</h2>
                <p>Your Order #${order.id} has been placed.</p>
                <p class="my-4">Please transfer *₦${total.toLocaleString()}* to:</p>
                <div class="bg-gray-100 p-4 rounded">
                    <p><strong>Bank:</strong> ${appConfig.BANK.name}</p>
                    <p><strong>Account Name:</strong> ${appConfig.BANK.acctName}</p>
                    <p><strong>Account Number:</strong> ${appConfig.BANK.acctNo}</p>
                </div>
                <p class="mt-4">After payment, please send a screenshot to us on WhatsApp.</p>
                <a href="https://wa.me/${appConfig.WHATSAPP}?text=Payment%20proof%20for%20Order%20%23${order.id}" target="_blank" class="inline-block bg-green-500 text-white px-4 py-2 rounded mt-2">Send Proof on WhatsApp</a>
            `;
        }
        cart.clearCart();
    };

    const handleAuthForm = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        authError.textContent = '';

        let result;
        if (isLoginMode) {
            result = await auth.signIn(email, password);
        } else {
            const fullName = e.target.full_name.value;
            result = await auth.signUp(fullName, email, password);
        }

        if (result.error) {
            authError.textContent = result.error.message;
        } else {
            closeAuthModal();
        }
    };

    // --- Auth Modal ---
    const openAuthModal = (login = true) => {
        isLoginMode = login;
        authForm.reset();
        authError.textContent = '';
        authTitle.textContent = isLoginMode ? 'Login' : 'Sign Up';
        authToggleLink.textContent = isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login";
        fullnameField.classList.toggle('hidden', isLoginMode);
        authModal.classList.remove('hidden');
    };
    const closeAuthModal = () => authModal.classList.add('hidden');

    // --- Event Listeners ---
    authToggleLink.onclick = (e) => { e.preventDefault(); openAuthModal(!isLoginMode); };
    authCloseButton.onclick = closeAuthModal;
    authButton.onclick = () => currentUser ? auth.signOut() : openAuthModal(true);
    cartButton.onclick = () => {
        if (!currentUser) {
            openAuthModal(true);
            return;
        }
        renderCartPage();
        showPage('cart');
    };
    window.addEventListener('cartUpdated', updateCartButton);
    if (productGrid) productGrid.addEventListener('click', handleAddToCart);
    authForm.addEventListener('submit', handleAuthForm);
    auth.onAuthStateChange((_event, session) => {
        currentUser = session ? session.user : null;
        updateAuthUI();
    });

    // --- Initial Load ---
    const initialLoad = async () => {
        await fetchAppConfig();
        await fetchProducts();
        currentUser = await auth.getCurrentUser();
        updateAuthUI();
        updateCartButton();
        showPage('listing');
    };

    initialLoad();
});
