/**
 * API Service for fetching data
 */

// Fetch all categories
async function fetchCategories() {
  try {
    const response = await fetch(API_CONFIG.BASE_URL + '/services/app/category/GetAllCategories?includeProductCount=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    if (data.success && data.result) {
      // Sort by sequenceNumber (null values last)
      const sortedCategories = data.result.sort((a, b) => {
        if (a.sequenceNumber === null) return 1;
        if (b.sequenceNumber === null) return -1;
        return a.sequenceNumber - b.sequenceNumber;
      });
      
      return sortedCategories;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Fetch products
async function fetchProducts(skipCount = 0, maxResultCount = 8, categoryId = null, keyword = '') {
  try {
    const requestBody = {
      isQuantityRequired: true,
      isActive: true,
      warehouseId: "afabb9ea-2c59-4d0c-9fa9-96f174877782",
      skipCount: skipCount,
      maxResultCount: maxResultCount
    };

    // Add keyword if provided (this is what the API uses for search)
    if (keyword && keyword.trim() !== '') {
      requestBody.keyword = keyword.trim();
    }

    // Add categoryId if provided
    if (categoryId) {
      requestBody.categoryId = categoryId;
    }
    
    const response = await fetch(API_CONFIG.BASE_URL + '/services/app/product/GetAll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    if (data.success && data.result && data.result.items) {
      return {
        items: data.result.items,
        totalCount: data.result.totalCount
      };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      items: [],
      totalCount: 0
    };
  }
}

// Format price with LKR currency
function formatPrice(price) {
  if (price === null || price === undefined || price === 0) {
    return 'LKR 0.00';
  }
  return 'LKR ' + parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Fetch single product by ID
async function fetchProductById(productId) {
  try {
    // Fetch products and find the one with matching ID
    const result = await fetchProducts(0, 1000, null, '');
    
    if (result && result.items && result.items.length > 0) {
      const product = result.items.find(p => p.id === productId);
      return product || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Register new customer
async function registerCustomer(customerData) {
  try {
    const response = await fetch(API_CONFIG.BASE_URL + '/services/ecommerce/eCommerceCustomer/Create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(customerData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Registration failed');
    }

    const data = await response.json();
    
    if (data.success && data.result) {
      return {
        success: true,
        customer: data.result,
        message: 'Registration successful!'
      };
    } else {
      throw new Error(data.error?.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error registering customer:', error);
    return {
      success: false,
      message: error.message || 'Registration failed. Please try again.'
    };
  }
}

// Login customer
async function loginCustomer(emailAddress, password) {
  try {
    const loginData = {
      emailAddress: emailAddress,
      password: password,
      userType: 2
    };

    const response = await fetch(API_CONFIG.BASE_URL + '/services/ecommerce/eCommerceCustomerAccount/Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Login failed');
    }

    const data = await response.json();
    
    if (data.success && data.result) {
      return {
        success: true,
        user: data.result,
        message: 'Login successful!'
      };
    } else {
      throw new Error(data.error?.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    return {
      success: false,
      message: error.message || 'Login failed. Please check your credentials and try again.'
    };
  }
}

// Get current logged-in user
function getCurrentUser() {
  try {
    const userData = localStorage.getItem('loggedInUser');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Save logged-in user
function saveCurrentUser(userData) {
  try {
    localStorage.setItem('loggedInUser', JSON.stringify(userData));
    // Also save JWT token separately for API calls
    if (userData.jWtToken) {
      localStorage.setItem('authToken', userData.jWtToken);
    }
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Logout user
function logoutUser() {
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('authToken');
}

// Make functions globally accessible
window.fetchCategories = fetchCategories;
window.fetchProducts = fetchProducts;
window.fetchProductById = fetchProductById;
window.formatPrice = formatPrice;
window.registerCustomer = registerCustomer;
window.loginCustomer = loginCustomer;
window.getCurrentUser = getCurrentUser;
window.saveCurrentUser = saveCurrentUser;
window.logoutUser = logoutUser;

