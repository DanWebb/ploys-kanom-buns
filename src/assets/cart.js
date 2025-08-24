/**
 * Shopping Cart with Session Storage and Observable Pattern
 * Supports Shopify checkout integration
 */
class ShoppingCart {
  constructor() {
    this.storageKey = 'ploys-kanom-buns-cart';
    this.observers = new Set();
    this.items = this.loadFromStorage();
  }

  /**
   * Load cart data from sessionStorage
   * @returns {Object} Cart items object
   */
  loadFromStorage() {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      return {};
    }
  }

  /**
   * Save cart data to sessionStorage
   */
  saveToStorage() {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  /**
   * Add an observer function that will be called when cart changes
   * @param {Function} observer - Function to call when cart updates
   */
  subscribe(observer) {
    if (typeof observer === 'function') {
      this.observers.add(observer);
    }
  }

  /**
   * Remove an observer function
   * @param {Function} observer - Function to remove from observers
   */
  unsubscribe(observer) {
    this.observers.delete(observer);
  }

  /**
   * Notify all observers of cart changes
   */
  notifyObservers() {
    const cartData = {
      items: { ...this.items },
      totalQuantity: this.getTotalQuantity(),
      totalPrice: this.getTotalPrice()
    };

    this.observers.forEach(observer => {
      try {
        observer(cartData);
      } catch (error) {
        console.error('Error in cart observer:', error);
      }
    });
  }

  /**
   * Add item to cart or increment quantity
   * @param {string} variantId - Shopify variant ID
   * @param {number} price - Price per item (optional, for total calculation)
   * @returns {number} New quantity for this variant
   */
  addItem(variantId, price = 0) {
    if (!variantId) {
      throw new Error('Variant ID is required');
    }

    if (!this.items[variantId]) {
      this.items[variantId] = {
        quantity: 0,
        price: price
      };
    }

    this.items[variantId].quantity += 1;
    
    // Update price if provided
    if (price > 0) {
      this.items[variantId].price = price;
    }

    this.saveToStorage();
    this.notifyObservers();
    
    return this.items[variantId].quantity;
  }

  /**
   * Remove item from cart or decrement quantity
   * @param {string} variantId - Shopify variant ID
   * @returns {number} New quantity for this variant (0 if removed)
   */
  removeItem(variantId) {
    if (!variantId || !this.items[variantId]) {
      return 0;
    }

    this.items[variantId].quantity -= 1;

    if (this.items[variantId].quantity <= 0) {
      delete this.items[variantId];
      this.saveToStorage();
      this.notifyObservers();
      return 0;
    }

    this.saveToStorage();
    this.notifyObservers();
    
    return this.items[variantId].quantity;
  }

  /**
   * Get quantity for a specific variant
   * @param {string} variantId - Shopify variant ID
   * @returns {number} Quantity of this variant in cart
   */
  getItemQuantity(variantId) {
    return this.items[variantId]?.quantity || 0;
  }

  /**
   * Get total quantity of all items in cart
   * @returns {number} Total quantity
   */
  getTotalQuantity() {
    return Object.values(this.items).reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Get total price of all items in cart
   * @returns {number} Total price
   */
  getTotalPrice() {
    return Object.values(this.items).reduce((total, item) => {
      return total + (item.quantity * (item.price || 0));
    }, 0);
  }

  /**
   * Clear all items from cart
   */
  clearCart() {
    this.items = {};
    this.saveToStorage();
    this.notifyObservers();
  }

  /**
   * Get all cart items
   * @returns {Object} Cart items object
   */
  getAllItems() {
    return { ...this.items };
  }

  /**
   * Check if cart is empty
   * @returns {boolean} True if cart is empty
   */
  isEmpty() {
    return Object.keys(this.items).length === 0;
  }

  /**
   * Generate Shopify checkout URL
   * @returns {string} Shopify cart URL
   */
  getCheckoutUrl() {
    if (this.isEmpty()) {
      return 'https://ployskanombuns.myshopify.com/cart';
    }

    const cartItems = Object.entries(this.items)
      .map(([variantId, item]) => `${variantId}:${item.quantity}`)
      .join(',');

    return `https://ployskanombuns.myshopify.com/cart/${cartItems}`;
  }

  /**
   * Navigate to Shopify checkout
   */
  checkout() {
    const checkoutUrl = this.getCheckoutUrl();
    window.location.href = checkoutUrl;
  }
}

// Create global cart instance
const cart = new ShoppingCart();

// Helper functions for easy DOM integration
window.Cart = {
  // Main cart instance
  instance: cart,
  
  // Quick access methods
  add: (variantId, price) => cart.addItem(variantId, price),
  remove: (variantId) => cart.removeItem(variantId),
  getQuantity: (variantId) => cart.getItemQuantity(variantId),
  getTotalQuantity: () => cart.getTotalQuantity(),
  getTotalPrice: () => cart.getTotalPrice(),
  clear: () => cart.clearCart(),
  checkout: () => cart.checkout(),
  
  // Observable methods
  subscribe: (observer) => cart.subscribe(observer),
  unsubscribe: (observer) => cart.unsubscribe(observer),
  
  // Utility methods
  isEmpty: () => cart.isEmpty(),
  getAllItems: () => cart.getAllItems(),
  getCheckoutUrl: () => cart.getCheckoutUrl()
};

// Example usage for DOM integration:
/*
// Subscribe to cart changes
Cart.subscribe((cartData) => {
  console.log('Cart updated:', cartData);
  
  // Update cart badge
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    badge.textContent = cartData.totalQuantity;
    badge.style.display = cartData.totalQuantity > 0 ? 'block' : 'none';
  }
  
  // Update total price display
  const total = document.querySelector('.cart-total');
  if (total) {
    total.textContent = `$${cartData.totalPrice.toFixed(2)}`;
  }
});

// Add item button example
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-add-to-cart]')) {
    const variantId = e.target.dataset.variantId;
    const price = parseFloat(e.target.dataset.price) || 0;
    Cart.add(variantId, price);
  }
  
  if (e.target.matches('[data-remove-from-cart]')) {
    const variantId = e.target.dataset.variantId;
    Cart.remove(variantId);
  }
  
  if (e.target.matches('[data-checkout]')) {
    Cart.checkout();
  }
});
*/

export default cart;