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
        console.warn('Error calling window.getCurrentUser:', error);
      }
    }
    
    // Method 2: Direct localStorage access (fallback)
    if (!user || !user.id) {
      try {
        const loggedInUserStr = localStorage.getItem('loggedInUser');
        if (loggedInUserStr) {
          user = JSON.parse(loggedInUserStr);
        }
      } catch (error) {
        console.warn('Error parsing loggedInUser from localStorage:', error);
      }
    }
    
    if (user && user.id) {
      const cartKey = `cart_${user.id}`;
      console.log('Cart key for logged-in user:', cartKey);
      return cartKey;
    }
    
    console.log('Using guest cart key');
    return 'cart_guest';
  },

  // Get cart from localStorage
  getCart: function() {
    try {
      const cartKey = this.getCartKey();
      console.log('Getting cart with key:', cartKey);
      const cart = localStorage.getItem(cartKey);
      
      if (!cart) {
        console.log('No cart found with key:', cartKey);
        // Try to find any cart key as fallback
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cart_')) {
            const cartData = localStorage.getItem(key);
            if (cartData) {
              try {
                const parsed = JSON.parse(cartData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  console.log('Found cart in alternative key:', key);
                  return parsed;
                }
              } catch (e) {
                console.error('Error parsing cart from key', key, ':', e);
              }
            }
          }
        }
        return [];
      }
      
      const parsed = JSON.parse(cart);
      console.log('Cart retrieved successfully:', parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error getting cart:', error);
      return [];
    }
  },

  // Add product to cart
  addToCart: function(product) {
    try {
      const cart = this.getCart();
      const existingItem = cart.find(item => item.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          imageURL: product.imageURL || product.imageUrl,
          price: product.sellingPrice > 0 ? product.sellingPrice : (product.unitPrice > 0 ? product.unitPrice : 0),
          quantity: 1
        });
      }
      
      const cartKey = this.getCartKey();
      localStorage.setItem(cartKey, JSON.stringify(cart));
      this.updateCartCount();
      return cart;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return [];
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
      console.error('Error removing from cart:', error);
      return [];
    }
  },

  // Update product quantity in cart
  updateQuantity: function(productId, quantity) {
    try {
      const cart = this.getCart();
      const item = cart.find(item => item.id === productId);
      
      if (item) {
        if (quantity <= 0) {
          return this.removeFromCart(productId);
        }
        item.quantity = quantity;
        const cartKey = this.getCartKey();
        localStorage.setItem(cartKey, JSON.stringify(cart));
        this.updateCartCount();
      }
      
      return cart;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return [];
    }
  },

  // Get cart count
  getCartCount: function() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
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
      console.error('Error merging cart after login:', error);
    }
  }
};

// Wishlist Management
const WishlistService = {
  // Get wishlist from localStorage
  getWishlist: function() {
    try {
      const wishlist = localStorage.getItem('wishlist');
      return wishlist ? JSON.parse(wishlist) : [];
    } catch (error) {
      console.error('Error getting wishlist:', error);
      return [];
    }
  },

  // Add product to wishlist
  addToWishlist: function(product) {
    try {
      const wishlist = this.getWishlist();
      const existingItem = wishlist.find(item => item.id === product.id);
      
      if (!existingItem) {
        wishlist.push({
          id: product.id,
          name: product.name,
          imageURL: product.imageURL,
          price: product.sellingPrice > 0 ? product.sellingPrice : (product.unitPrice > 0 ? product.unitPrice : 0)
        });
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        this.updateWishlistCount();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    }
  },

  // Remove product from wishlist
  removeFromWishlist: function(productId) {
    try {
      const wishlist = this.getWishlist();
      const updatedWishlist = wishlist.filter(item => item.id !== productId);
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      this.updateWishlistCount();
      return updatedWishlist;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return [];
    }
  },

  // Check if product is in wishlist
  isInWishlist: function(productId) {
    const wishlist = this.getWishlist();
    return wishlist.some(item => item.id === productId);
  },

  // Get wishlist count
  getWishlistCount: function() {
    return this.getWishlist().length;
  },

  // Update wishlist count badge (if exists)
  updateWishlistCount: function() {
    const count = this.getWishlistCount();
    $('.wishlist-count').text(count);
    if (count === 0) {
      $('.wishlist-count').hide();
    } else {
      $('.wishlist-count').show();
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
  
  // Run when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        hideZeroCartCounts();
        if (typeof CartService !== 'undefined' && typeof CartService.updateCartCount === 'function') {
          CartService.updateCartCount();
        }
      });
    } else {
      hideZeroCartCounts();
      if (typeof CartService !== 'undefined' && typeof CartService.updateCartCount === 'function') {
        CartService.updateCartCount();
      }
    }
  }
  
  // Also run when jQuery is ready (if available)
  if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(function() {
      hideZeroCartCounts();
      if (typeof CartService !== 'undefined' && typeof CartService.updateCartCount === 'function') {
        CartService.updateCartCount();
      }
    });
  }
})();

