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
      keyword: keyword,
      isActive: true,
      warehouseId: "afabb9ea-2c59-4d0c-9fa9-96f174877782",
      skipCount: skipCount,
      maxResultCount: maxResultCount
    };

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

// Make functions globally accessible
window.fetchCategories = fetchCategories;
window.fetchProducts = fetchProducts;
window.formatPrice = formatPrice;

