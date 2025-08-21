const CART_KEY = 'agromart_cart';

// Load cart from localStorage
const getCart = () => {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
};

// Save cart to localStorage
const saveCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const addToCart = (product, quantity) => {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }

    saveCart(cart);
    // Dispatch a custom event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('cartUpdated'));
};

export const getCartItems = () => {
    return getCart();
};

export const updateCartItemQuantity = (productId, quantity) => {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
        if (quantity > 0) {
            item.quantity = quantity;
        } else {
            // Remove item if quantity is 0 or less
            cart = cart.filter(item => item.id !== productId);
        }
    }

    saveCart(cart);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
};

export const removeFromCart = (productId) => {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
};

export const clearCart = () => {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
};

export const getCartCount = () => {
    return getCart().reduce((count, item) => count + item.quantity, 0);
};

export const getCartTotal = () => {
    return getCart().reduce((total, item) => {
        // Use price_min as the reference price for calculation
        // A more complex app might let the user choose a specific variant/price
        return total + (item.price_min * item.quantity);
    }, 0);
};
