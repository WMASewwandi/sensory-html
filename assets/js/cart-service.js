/**
 * Cart and Wishlist Management Service
 */

// Cart Management
const CartService = {
  // Get cart key based on user (if logged in) or guest
  getCartKey: function() {
    let user = null;
    
    // Method 1: Try window.getCurrentUser function
    if (typeof window.getCurrentUser === 'function') {
      try {
        user = window.getCurrentUser();
      } catch (error) {
        // Error calling window.getCurrentUser
      }
    }
    
    // Method 2: Check sessionStorage (for active session)
    if (!user || !user.id) {
      try {
        const loggedInUserStr = sessionStorage.getItem('loggedInUser');
        if (loggedInUserStr) {
          user = JSON.parse(loggedInUserStr);
        }
      } catch (error) {
        // Error parsing loggedInUser from sessionStorage
      }
    }
    
    // Method 3: Direct localStorage access (fallback for backward compatibility)
    if (!user || !user.id) {
      try {
        const loggedInUserStr = localStorage.getItem('loggedInUser');
        if (loggedInUserStr) {
          user = JSON.parse(loggedInUserStr);
        }
      } catch (error) {
        // Error parsing loggedInUser from localStorage
      }
    }
    
    if (user && user.id) {
      const cartKey = `cart_${user.id}`;
      return cartKey;
    }
    
    return 'cart_guest';
  },

  // Get cart from localStorage
  getCart: function() {
    try {
      const cartKey = this.getCartKey();
      const cart = localStorage.getItem(cartKey);
      
      if (!cart) {
        return [];
      }
      
      const parsed = JSON.parse(cart);
      
      // Ensure we return an array and filter out invalid items
      const cartArray = Array.isArray(parsed) ? parsed : [];
      // Filter out invalid items (items without id or with invalid quantity)
      const validCart = cartArray.filter(item => {
        if (!item || !item.id) {
          return false;
        }
        const quantity = parseInt(item.quantity) || 0;
        return quantity > 0;
      });
      
      // If we filtered out invalid items, save the cleaned cart
      if (validCart.length !== cartArray.length) {
        localStorage.setItem(cartKey, JSON.stringify(validCart));
      }
      
      return validCart;
    } catch (error) {
      // Error getting cart
      return [];
    }
  },

  // Add product to cart (sync version - use addToCartWithStockCheck for stock validation)
  addToCart: function(product, skipStockCheck = false) {
    try {
      const cart = this.getCart();
      const quantity = parseInt(product.quantity) || 1;
      const existingItem = cart.find(item => item.id === product.id);
      
      // Check max stock if provided
      if (product.maxStock !== undefined && product.maxStock !== null) {
        const currentQty = existingItem ? existingItem.quantity : 0;
        const newTotalQty = currentQty + quantity;
        
        if (product.maxStock <= 0) {
          return { success: false, message: 'This product is out of stock', cart: cart };
        }
        
        if (newTotalQty > product.maxStock) {
          const canAdd = product.maxStock - currentQty;
          if (canAdd <= 0) {
            return { success: false, message: `You already have the maximum available quantity (${product.maxStock}) in your cart`, cart: cart };
          }
          return { success: false, message: `Only ${canAdd} more can be added. Maximum available: ${product.maxStock}`, cart: cart };
        }
      }
      
      if (existingItem) {
        existingItem.quantity += quantity;
        // Store max stock for future reference
        if (product.maxStock !== undefined) {
          existingItem.maxStock = product.maxStock;
        }
      } else {
        const newItem = {
          id: product.id,
          name: product.name,
          imageURL: product.imageURL || product.imageUrl,
          price: product.sellingPrice > 0 ? product.sellingPrice : (product.unitPrice > 0 ? product.unitPrice : 0),
          quantity: quantity
        };
        // Store max stock for future reference
        if (product.maxStock !== undefined) {
          newItem.maxStock = product.maxStock;
        }
        cart.push(newItem);
      }
      
      const cartKey = this.getCartKey();
      localStorage.setItem(cartKey, JSON.stringify(cart));
      this.updateCartCount();
      return { success: true, cart: cart };
    } catch (error) {
      // Error adding to cart
      return { success: false, message: 'Failed to add to cart', cart: [] };
    }
  },

  // Add product to cart with stock validation (async version)
  addToCartWithStockCheck: async function(product) {
    try {
      const quantity = parseInt(product.quantity) || 1;
      
      // Get stock level from API
      if (typeof window.getStockMap === 'function') {
        const stockMap = await window.getStockMap();
        const availableStock = stockMap.get(product.id) || 0;
        
        // Check if product is in stock
        if (availableStock <= 0) {
          return { success: false, message: 'This product is out of stock' };
        }
        
        // Check current cart quantity
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);
        const currentQty = existingItem ? existingItem.quantity : 0;
        const newTotalQty = currentQty + quantity;
        
        // Validate against available stock
        if (newTotalQty > availableStock) {
          const canAdd = availableStock - currentQty;
          if (canAdd <= 0) {
            return { success: false, message: `You already have the maximum available quantity (${availableStock}) in your cart` };
          }
          return { success: false, message: `Only ${canAdd} more can be added. Available stock: ${availableStock}` };
        }
        
        // Add maxStock to product for the sync addToCart
        product.maxStock = availableStock;
      }
      
      // Call the sync version
      return this.addToCart(product);
    } catch (error) {
      // Error with stock check, fall back to regular add
      return this.addToCart(product);
    }
  },

  // Remove product from cart
  removeFromCart: function(productId) {
    try {
      const cart = this.getCart();
      const updatedCart = cart.filter(item => item.id !== productId);
      const cartKey = this.getCartKey();
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
      this.updateCartCount();
      return updatedCart;
    } catch (error) {
      // Error removing from cart
      return [];
    }
  },

  // Update product quantity in cart
  updateQuantity: function(productId, quantity, maxStock = null) {
    try {
      const cart = this.getCart();
      const item = cart.find(item => item.id === productId);
      
      if (item) {
        if (quantity <= 0) {
          return this.removeFromCart(productId);
        }
        
        // Check max stock limit
        const stockLimit = maxStock !== null ? maxStock : (item.maxStock || null);
        if (stockLimit !== null && quantity > stockLimit) {
          return { success: false, message: `Maximum available quantity is ${stockLimit}`, cart: cart };
        }
        
        item.quantity = quantity;
        if (stockLimit !== null) {
          item.maxStock = stockLimit;
        }
        
        const cartKey = this.getCartKey();
        localStorage.setItem(cartKey, JSON.stringify(cart));
        this.updateCartCount();
      }
      
      return { success: true, cart: cart };
    } catch (error) {
      // Error updating quantity
      return { success: false, cart: [] };
    }
  },

  // Update product quantity with stock validation (async version)
  updateQuantityWithStockCheck: async function(productId, quantity) {
    try {
      // Get stock level from API
      if (typeof window.getStockMap === 'function') {
        const stockMap = await window.getStockMap();
        const availableStock = stockMap.get(productId) || 0;
        
        if (quantity > availableStock) {
          return { success: false, message: `Maximum available quantity is ${availableStock}` };
        }
        
        return this.updateQuantity(productId, quantity, availableStock);
      }
      
      return this.updateQuantity(productId, quantity);
    } catch (error) {
      return this.updateQuantity(productId, quantity);
    }
  },

  // Get cart count
  getCartCount: function() {
    const cart = this.getCart();
    // Only count valid items with valid quantities
    return cart.reduce((total, item) => {
      if (!item || !item.id) {
        return total;
      }
      const quantity = parseInt(item.quantity) || 0;
      return total + (quantity > 0 ? quantity : 0);
    }, 0);
  },

  // Update cart count badge
  updateCartCount: function() {
    const count = this.getCartCount();
    
    // Update using jQuery
    if (typeof jQuery !== 'undefined' && jQuery('.cart-count').length > 0) {
      jQuery('.cart-count').each(function() {
        const $el = jQuery(this);
        if (count === 0 || count === '0' || parseInt(count) === 0) {
          $el.hide().addClass('hidden').css('display', 'none').css('visibility', 'hidden');
        } else {
          $el.text(count).show().removeClass('hidden').css('display', 'inline-block').css('visibility', 'visible');
        }
      });
    }
    
    // Also update on all pages using vanilla JS
    if (typeof window !== 'undefined' && window.document) {
      const allCartCounts = document.querySelectorAll('.cart-count');
      allCartCounts.forEach(el => {
        if (count === 0 || count === '0' || parseInt(count) === 0) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.classList.add('hidden');
          el.textContent = '0';
        } else {
          el.textContent = count;
          el.style.setProperty('display', 'inline-block', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
          el.classList.remove('hidden');
        }
      });
    }
  },

  // Clear cart
  clearCart: function() {
    const cartKey = this.getCartKey();
    localStorage.removeItem(cartKey);
    this.updateCartCount();
  },

  // Merge guest cart with user cart after login
  mergeCartAfterLogin: function(userId) {
    try {
      const guestCart = localStorage.getItem('cart_guest');
      const userCartKey = `cart_${userId}`;
      const userCart = localStorage.getItem(userCartKey);
      
      if (guestCart) {
        const guestItems = JSON.parse(guestCart);
        const existingUserCart = userCart ? JSON.parse(userCart) : [];
        
        // Merge items - if product exists in user cart, keep the higher quantity
        guestItems.forEach(guestItem => {
          const existingItem = existingUserCart.find(item => item.id === guestItem.id);
          if (existingItem) {
            existingItem.quantity = Math.max(existingItem.quantity, guestItem.quantity);
          } else {
            existingUserCart.push(guestItem);
          }
        });
        
        localStorage.setItem(userCartKey, JSON.stringify(existingUserCart));
        localStorage.removeItem('cart_guest');
        this.updateCartCount();
      }
    } catch (error) {
      // Error merging cart after login
    }
  }
};

// Wishlist Management - API-based
const WishlistService = {
  // Cache for wishlist items
  _wishlistCache: null,
  _wishlistCountCache: null,

  // Get current user ID
  getUserId: function() {
    let user = null;
    
    // Try window.getCurrentUser function
    if (typeof window.getCurrentUser === 'function') {
      try {
        user = window.getCurrentUser();
      } catch (error) {
        // Error calling window.getCurrentUser
      }
    }
    
    // Check sessionStorage
    if (!user || !user.id) {
      try {
        const loggedInUserStr = sessionStorage.getItem('loggedInUser');
        if (loggedInUserStr) {
          user = JSON.parse(loggedInUserStr);
        }
      } catch (error) {
        // Error parsing loggedInUser from sessionStorage
      }
    }
    
    // Check localStorage (fallback)
    if (!user || !user.id) {
      try {
        const loggedInUserStr = localStorage.getItem('loggedInUser');
        if (loggedInUserStr) {
          user = JSON.parse(loggedInUserStr);
        }
      } catch (error) {
        // Error parsing loggedInUser from localStorage
      }
    }
    
    return user ? user.id : null;
  },

  // Check if user is logged in
  isLoggedIn: function() {
    return this.getUserId() !== null;
  },

  // Get wishlist from API
  getWishlist: async function(pageNumber = 1, pageSize = 100) {
    try {
      const userId = this.getUserId();
      
      if (!userId) {
        // User not logged in, return empty array
        this._wishlistCache = [];
        return [];
      }

      const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Ensure API_CONFIG is available
      if (typeof API_CONFIG === 'undefined' || !API_CONFIG || !API_CONFIG.BASE_URL) {
        // API_CONFIG is not defined
        this._wishlistCache = [];
        this._wishlistCountCache = 0;
        return [];
      }
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/pos/wishlists/user/${userId}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: headers
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // User not authenticated
          this._wishlistCache = [];
          return [];
        }
        throw new Error(`Failed to fetch wishlist: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different API response formats
      let items = [];
      let totalCount = 0;
      
      // Check if data exists (even if success is false, the data might still be valid)
      if (data.data && Array.isArray(data.data)) {
        // Response data is directly an array
        items = data.data;
        totalCount = items.length;
      } else if (data.data && data.data.items && Array.isArray(data.data.items)) {
        // Response has items array
        items = data.data.items;
        totalCount = data.data.totalCount || data.data.items.length;
      } else if (data.data && data.data.data && Array.isArray(data.data.data)) {
        // Nested data structure
        items = data.data.data;
        totalCount = items.length;
      } else if (Array.isArray(data.data)) {
        items = data.data;
        totalCount = items.length;
      } else if (data.success && data.data) {
        // Try success=true format
        if (Array.isArray(data.data)) {
          items = data.data;
          totalCount = items.length;
        } else if (data.data.items && Array.isArray(data.data.items)) {
          items = data.data.items;
          totalCount = data.data.totalCount || items.length;
        }
      }
      
      // If still no items, check if data itself is an array (unlikely but possible)
      if (items.length === 0 && Array.isArray(data)) {
        items = data;
        totalCount = data.length;
      }
      
      // Parsed wishlist items
      this._wishlistCache = items;
      this._wishlistCountCache = totalCount;
      return items;
    } catch (error) {
      // Error getting wishlist
      this._wishlistCache = [];
      return [];
    }
  },

  // Add product to wishlist (requires login)
  addToWishlist: async function(product) {
    try {
      const userId = this.getUserId();
      
      if (!userId) {
        // Redirect to login page
        if (confirm('Please login to add items to your wishlist. Would you like to login now?')) {
          window.location.href = 'login-register?redirect=' + encodeURIComponent(window.location.pathname);
        }
        return { success: false, message: 'Please login to add items to wishlist' };
      }

      // Check if product is already in wishlist
      const isInWishlist = await this.checkProductInWishlist(product.id);
      if (isInWishlist) {
        return { success: false, message: 'Product is already in your wishlist' };
      }

      const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const productPrice = product.sellingPrice > 0 ? product.sellingPrice : (product.unitPrice > 0 ? product.unitPrice : 0);
      
      // Ensure API_CONFIG is available
      if (typeof API_CONFIG === 'undefined' || !API_CONFIG || !API_CONFIG.BASE_URL) {
        // API_CONFIG is not defined
        return { success: false, message: 'API configuration not available' };
      }

      const wishlistItem = {
        userId: userId,
        productId: product.id,
        productName: product.name || 'Product',
        productPrice: productPrice
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/pos/wishlists/items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(wishlistItem)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          if (confirm('Your session has expired. Please login again. Would you like to login now?')) {
            window.location.href = 'login-register?redirect=' + encodeURIComponent(window.location.pathname);
          }
          return { success: false, message: 'Please login to add items to wishlist' };
        }
        
        // Get error details from response
        let errorMessage = 'Failed to add to wishlist';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error?.message || errorData.error || `Server error: ${response.status}`;
          // Wishlist API error response
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Clear cache to force refresh
      this._wishlistCache = null;
      this._wishlistCountCache = null;
      
      // Force refresh count from API
      const newCount = await this.getWishlistCount();
      this._wishlistCountCache = newCount;
      
      // Update wishlist count badge (await to ensure it completes)
      await this.updateWishlistCount();
      
      return { success: true, message: 'Product added to wishlist successfully', data: data.data };
    } catch (error) {
      // Error adding to wishlist
      return { success: false, message: error.message || 'Failed to add product to wishlist' };
    }
  },

  // Remove product from wishlist by item ID
  removeFromWishlist: async function(itemId) {
    try {
      const userId = this.getUserId();
      
      if (!userId) {
        return { success: false, message: 'Please login to remove items from wishlist' };
      }

      const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/pos/wishlists/items/${itemId}?userId=${userId}`,
        {
          method: 'DELETE',
          headers: headers
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to remove from wishlist: ${response.status}`);
      }

      // Clear cache
      this._wishlistCache = null;
      this._wishlistCountCache = null;
      
      // Force refresh count from API
      const newCount = await this.getWishlistCount();
      this._wishlistCountCache = newCount;
      
      // Update wishlist count badge (await to ensure it completes)
      await this.updateWishlistCount();
      
      return { success: true, message: 'Product removed from wishlist' };
    } catch (error) {
      // Error removing from wishlist
      return { success: false, message: error.message || 'Failed to remove product from wishlist' };
    }
  },

  // Remove product from wishlist by product ID
  removeProductFromWishlist: async function(productId) {
    try {
      const userId = this.getUserId();
      
      if (!userId) {
        return { success: false, message: 'Please login to remove items from wishlist' };
      }

      const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/pos/wishlists/products/${productId}?userId=${userId}`,
        {
          method: 'DELETE',
          headers: headers
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to remove product from wishlist: ${response.status}`);
      }

      // Clear cache
      this._wishlistCache = null;
      this._wishlistCountCache = null;
      
      // Force refresh count from API
      const newCount = await this.getWishlistCount();
      this._wishlistCountCache = newCount;
      
      // Update wishlist count badge (await to ensure it completes)
      await this.updateWishlistCount();
      
      return { success: true, message: 'Product removed from wishlist' };
    } catch (error) {
      // Error removing product from wishlist
      return { success: false, message: error.message || 'Failed to remove product from wishlist' };
    }
  },

  // Check if product is in wishlist
  checkProductInWishlist: async function(productId) {
    try {
      const userId = this.getUserId();
      
      if (!userId) {
        return false;
      }

      const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/pos/wishlists/check/${productId}?userId=${userId}`,
        {
          method: 'GET',
          headers: headers
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success && data.data === true;
    } catch (error) {
      // Error checking product in wishlist
      return false;
    }
  },

  // Get wishlist count
  getWishlistCount: async function() {
    try {
      const userId = this.getUserId();
      
      if (!userId) {
        return 0;
      }

      // Return cached count if available and not forcing refresh
      // Note: We'll still fetch if cache is null to ensure accuracy

      const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Ensure API_CONFIG is available
      if (typeof API_CONFIG === 'undefined' || !API_CONFIG || !API_CONFIG.BASE_URL) {
        // API_CONFIG is not defined
        return 0;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/pos/wishlists/count?userId=${userId}`,
        {
          method: 'GET',
          headers: headers
        }
      );

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      
      // Handle different response formats
      let count = 0;
      
      if (data.success && data.data !== undefined) {
        // Format: {success: true, data: 3}
        count = parseInt(data.data) || 0;
      } else if (data.count !== undefined) {
        // Format: {count: 3}
        count = parseInt(data.count) || 0;
      } else if (data.data !== undefined && typeof data.data === 'number') {
        // Format: {data: 3}
        count = parseInt(data.data) || 0;
      } else if (data.success === false && data.data !== undefined) {
        // Sometimes API returns success=false but data is still valid
        if (typeof data.data === 'number') {
          count = parseInt(data.data) || 0;
        }
      }
      
      if (count > 0) {
        this._wishlistCountCache = count;
        // Wishlist count
        return count;
      }
      
      // Wishlist count API returned unexpected format
      return 0;
    } catch (error) {
      // Error getting wishlist count
      return 0;
    }
  },

  // Clear all wishlist items
  clearWishlist: async function() {
    try {
      const userId = this.getUserId();
      
      if (!userId) {
        return { success: false, message: 'Please login to clear wishlist' };
      }

      const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/pos/wishlists/clear?userId=${userId}`,
        {
          method: 'DELETE',
          headers: headers
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to clear wishlist: ${response.status}`);
      }

      // Clear cache
      this._wishlistCache = null;
      this._wishlistCountCache = 0;
      
      // Update wishlist count (await to ensure it completes)
      await this.updateWishlistCount();
      
      return { success: true, message: 'Wishlist cleared successfully' };
    } catch (error) {
      // Error clearing wishlist
      return { success: false, message: error.message || 'Failed to clear wishlist' };
    }
  },

  // Update wishlist count badge
  updateWishlistCount: async function() {
    try {
      const count = await this.getWishlistCount();
      const countNum = parseInt(count) || 0;
      
      // Updating wishlist count badge
      
      // Update using jQuery
      if (typeof jQuery !== 'undefined') {
        jQuery('.wishlist-count').each(function() {
          const $el = jQuery(this);
          if (countNum === 0) {
            $el.hide().addClass('hidden').css('display', 'none').css('visibility', 'hidden');
          } else {
            $el.text(countNum).show().removeClass('hidden').css({
              'display': 'inline-block',
              'visibility': 'visible'
            });
          }
        });
      }
      
      // Also update using vanilla JS
      if (typeof document !== 'undefined') {
        const allWishlistCounts = document.querySelectorAll('.wishlist-count');
        allWishlistCounts.forEach(el => {
          if (countNum === 0) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.classList.add('hidden');
            el.textContent = '0';
          } else {
            el.textContent = countNum;
            el.style.removeProperty('display');
            el.style.removeProperty('visibility');
            el.style.setProperty('display', 'inline-block', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.classList.remove('hidden');
          }
        });
      }
    } catch (error) {
      // Error updating wishlist count
    }
  }
};

// Make services globally accessible
window.CartService = CartService;
window.WishlistService = WishlistService;

// Initialize cart count visibility on page load - hide badges showing 0
(function() {
  function hideZeroCartCounts() {
    // Immediately hide all cart counts that show "0"
    const allCartCounts = document.querySelectorAll('.cart-count');
    allCartCounts.forEach(el => {
      const text = el.textContent.trim();
      if (text === '0' || text === '' || text === '01' || parseInt(text) === 0) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.classList.add('hidden');
      }
    });
  }
  
  // Run immediately
  if (typeof document !== 'undefined') {
    hideZeroCartCounts();
  }
  
  function updateCartCountOnLoad() {
    // Clean the cart first to remove any invalid items
    if (typeof CartService !== 'undefined' && typeof CartService.getCart === 'function') {
      // This will automatically clean invalid items
      CartService.getCart();
    }
    
    // Then update the count
    if (typeof CartService !== 'undefined' && typeof CartService.updateCartCount === 'function') {
      CartService.updateCartCount();
    }
    
    // Also hide zero counts
    hideZeroCartCounts();
  }
  
  // Run when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateCartCountOnLoad);
    } else {
      // DOM is already ready
      updateCartCountOnLoad();
    }
  }
  
  // Also run when jQuery is ready (if available)
  if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(updateCartCountOnLoad);
  }
  
  // Run on window load as additional fallback
  if (typeof window !== 'undefined') {
    window.addEventListener('load', updateCartCountOnLoad);
  }
})();

// Initialize wishlist count visibility on page load
(function() {
  function hideZeroWishlistCounts() {
    // Immediately hide all wishlist counts that show "0"
    const allWishlistCounts = document.querySelectorAll('.wishlist-count');
    allWishlistCounts.forEach(el => {
      const text = el.textContent.trim();
      if (text === '0' || text === '' || parseInt(text) === 0) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.classList.add('hidden');
      }
    });
  }
  
  // Run immediately
  if (typeof document !== 'undefined') {
    hideZeroWishlistCounts();
  }
  
  async function updateWishlistCountOnLoad() {
    // Update the wishlist count
    if (typeof WishlistService !== 'undefined' && typeof WishlistService.updateWishlistCount === 'function') {
      try {
        await WishlistService.updateWishlistCount();
      } catch (error) {
        // Error updating wishlist count on load
      }
    }
    
    // Also hide zero counts
    hideZeroWishlistCounts();
  }
  
  // Run when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateWishlistCountOnLoad);
    } else {
      // DOM is already ready
      updateWishlistCountOnLoad();
    }
  }
  
  // Also run when jQuery is ready (if available)
  if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(updateWishlistCountOnLoad);
  }
  
  // Run on window load as additional fallback
  if (typeof window !== 'undefined') {
    window.addEventListener('load', updateWishlistCountOnLoad);
  }
})();

