/**
 * Cart and Wishlist Management Service
 */

// Cart Management
const CartService = {
  // Get cart from localStorage
  getCart: function() {
    try {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
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
          imageURL: product.imageURL,
          price: product.sellingPrice > 0 ? product.sellingPrice : (product.unitPrice > 0 ? product.unitPrice : 0),
          quantity: 1
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
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
      localStorage.setItem('cart', JSON.stringify(updatedCart));
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
        localStorage.setItem('cart', JSON.stringify(cart));
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
    $('.cart-count').text(count);
    if (count === 0) {
      $('.cart-count').hide();
    } else {
      $('.cart-count').show();
    }
    
    // Also update on all pages
    if (typeof window !== 'undefined' && window.document) {
      const allCartCounts = document.querySelectorAll('.cart-count');
      allCartCounts.forEach(el => {
        el.textContent = count;
        if (count === 0) {
          el.style.display = 'none';
        } else {
          el.style.display = 'inline-block';
        }
      });
    }
  },

  // Clear cart
  clearCart: function() {
    localStorage.removeItem('cart');
    this.updateCartCount();
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

