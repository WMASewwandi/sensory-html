/**
 * API Service for fetching data
 */

// Fetch all categories
async function fetchCategories() {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(API_CONFIG.BASE_URL + '/inventory/categories?pageNumber=1&pageSize=1000', {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    if (data.success && data.data && data.data.items) {
      // Sort by name alphabetically
      const sortedCategories = data.data.items.sort((a, b) => {
        return (a.name || '').localeCompare(b.name || '');
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
    // Calculate pageNumber from skipCount and maxResultCount
    const pageNumber = Math.floor(skipCount / maxResultCount) + 1;
    const pageSize = maxResultCount;
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString()
    });

    // Add keyword if provided
    if (keyword && keyword.trim() !== '') {
      queryParams.append('keyword', keyword.trim());
    }

    // Add categoryId if provided
    if (categoryId) {
      queryParams.append('categoryId', categoryId.toString());
    }
    
    const apiUrl = API_CONFIG.BASE_URL + '/inventory/products?' + queryParams.toString();
    console.log('Fetching products from:', apiUrl);
    
    const headers = getAuthHeaders();
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', response.status, errorText);
      throw new Error(`Network response was not ok: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (data.success && data.data && data.data.items) {
      // Normalize product data to match existing code expectations
      const normalizedItems = data.data.items.map(product => ({
        ...product,
        // Map imageUrl to imageURL for backward compatibility
        imageURL: product.imageUrl || product.imageURL || null,
        // Map unitPrice from sellingPrice if unitPrice doesn't exist
        unitPrice: product.unitPrice || product.sellingPrice || 0
      }));
      
      console.log('Fetched products:', normalizedItems.length, 'items');
      return {
        items: normalizedItems,
        totalCount: data.data.totalCount
      };
    } else {
      console.error('Invalid response format:', data);
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
    // Map customer data to Identity Service RegisterRequest format
    const registerData = {
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email || customerData.emailAddress,
      password: customerData.password
    };

    const response = await fetch(API_CONFIG.BASE_URL + '/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(registerData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error?.message || 'Registration failed';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        success: true,
        user: data.data,
        message: data.message || 'Registration successful!'
      };
    } else {
      throw new Error(data.message || data.error?.message || 'Invalid response format');
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
async function loginCustomer(email, password) {
  try {
    const loginData = {
      email: email,
      password: password
    };

    const response = await fetch(API_CONFIG.BASE_URL + '/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error?.message || 'Login failed';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      const loginResponse = data.data;
      return {
        success: true,
        user: loginResponse.user,
        token: loginResponse.token,
        refreshToken: loginResponse.refreshToken,
        expiresAt: loginResponse.expiresAt, // expiresAt from response.data.expiresAt
        data: loginResponse, // Include full data object for access to expiresAt
        message: data.message || 'Login successful!'
      };
    } else {
      throw new Error(data.message || data.error?.message || 'Invalid response format');
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
    // Check sessionStorage first (for active session)
    const userData = sessionStorage.getItem('loggedInUser');
    if (userData) {
      return JSON.parse(userData);
    }
    // Fallback to localStorage for backward compatibility (optional)
    const localUserData = localStorage.getItem('loggedInUser');
    return localUserData ? JSON.parse(localUserData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Get authentication token
function getAuthToken() {
  try {
    // Check sessionStorage first (for active session)
    const token = sessionStorage.getItem('authToken');
    if (token) {
      return token;
    }
    // Fallback to localStorage for backward compatibility (optional)
    return localStorage.getItem('authToken') || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Save logged-in user and token to sessionStorage (expires when browser closes)
function saveCurrentUser(userData, token, refreshToken) {
  try {
    // Store in sessionStorage (expires when browser closes)
    sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
    if (token) {
      sessionStorage.setItem('authToken', token);
    }
    if (refreshToken) {
      sessionStorage.setItem('refreshToken', refreshToken);
    }
    
    // Also store expiresAt if provided in userData
    if (userData && userData.expiresAt) {
      sessionStorage.setItem('tokenExpiresAt', userData.expiresAt);
    }
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Logout user - clear both sessionStorage and localStorage
function logoutUser() {
  try {
    // Clear sessionStorage
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('tokenExpiresAt');
    
    // Also clear localStorage for cleanup
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    // Clear user-specific cart data if needed
    // Note: You may want to keep the cart for guest users
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

// Check if user session is valid (token exists in sessionStorage)
function isUserLoggedIn() {
  try {
    const token = sessionStorage.getItem('authToken');
    const user = sessionStorage.getItem('loggedInUser');
    return !!(token && user);
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
}

// Get headers with authentication token
function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Make functions globally accessible
window.fetchCategories = fetchCategories;
window.fetchProducts = fetchProducts;
window.fetchProductById = fetchProductById;
window.formatPrice = formatPrice;
window.registerCustomer = registerCustomer;
window.loginCustomer = loginCustomer;
window.getCurrentUser = getCurrentUser;
window.getAuthToken = getAuthToken;
window.saveCurrentUser = saveCurrentUser;
window.logoutUser = logoutUser;
window.getAuthHeaders = getAuthHeaders;
window.isUserLoggedIn = isUserLoggedIn;

