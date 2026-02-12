/**
 * DirectPay.lk Payment Gateway Configuration
 * Documentation: https://doc.directpay.lk/
 * NPM Package: https://www.npmjs.com/package/directpay-ipg-js
 * 
 * Sandbox Portal: https://dpmp.directpay.lk/
 * Production Portal: https://portal.directpay.lk/
 * 
 * IMPORTANT: These are SANDBOX credentials for testing only.
 * For production, replace with live credentials from https://portal.directpay.lk/
 */
const DIRECTPAY_CONFIG = {
  // Environment: 'sandbox' or 'production'
  // DEV = Sandbox, PROD = Production
  environment: 'sandbox',
  
  // Sandbox Configuration (https://dpmp.directpay.lk/)
  sandbox: {
    merchantId: 'LA13502',
    // Secret key for HMAC-SHA256 signature generation
    secretKey: '2f8832325b0d1b593ed486a0c0b7b1ad2caad263d5fd20cf4650bda4bb8dcc5f',
    // DirectPay IPG CDN (v3)
    cdnUrl: 'https://cdn.directpay.lk/v3/directpayipg.min.js',
    // Stage for SDK
    stage: 'DEV',
    // Portal URL
    portalUrl: 'https://dpmp.directpay.lk/'
  },
  
  // Production Configuration (Update with live credentials when ready)
  production: {
    merchantId: 'LA13502', // Replace with production Merchant ID
    secretKey: '', // Replace with production Secret Key from https://portal.directpay.lk/
    cdnUrl: 'https://cdn.directpay.lk/v3/directpayipg.min.js',
    stage: 'PROD',
    portalUrl: 'https://portal.directpay.lk/'
  },
  
  // Payment settings
  currency: 'LKR',
  
  // Get current environment config
  getConfig: function() {
    return this.environment === 'production' ? this.production : this.sandbox;
  },
  
  // Get Merchant ID
  getMerchantId: function() {
    return this.getConfig().merchantId;
  },
  
  // Get Secret Key (for HMAC signature)
  getSecretKey: function() {
    return this.getConfig().secretKey;
  },
  
  // Get CDN URL for SDK
  getCdnUrl: function() {
    return this.getConfig().cdnUrl;
  },
  
  // Get Stage (DEV or PROD)
  getStage: function() {
    return this.getConfig().stage;
  },
  
  // Check if sandbox mode
  isSandbox: function() {
    return this.environment === 'sandbox';
  }
};

// Test Card Details for Sandbox (for reference)
const DIRECTPAY_TEST_CARDS = {
  mastercard_3ds: {
    number: '5123 4500 0000 0008',
    brand: 'Mastercard',
    description: '3DS enabled',
    cvc: 'Any 3 digits',
    expiry: 'Any future date'
  },
  mastercard_no_3ds: {
    number: '5111 1111 1111 1118',
    brand: 'Mastercard',
    description: '3DS disabled',
    cvc: 'Any 3 digits',
    expiry: 'Any future date'
  },
  visa_3ds: {
    number: '4508 7500 1574 1019',
    brand: 'Visa',
    description: '3DS enabled',
    cvc: 'Any 3 digits',
    expiry: 'Any future date'
  },
  visa_no_3ds: {
    number: '4012 0000 3333 0026',
    brand: 'Visa',
    description: '3DS disabled',
    cvc: 'Any 3 digits',
    expiry: 'Any future date'
  },
  failed_transaction: {
    number: '5204 7300 0000 2514',
    brand: 'Mastercard',
    description: 'Will fail the transaction',
    cvc: 'Any 3 digits',
    expiry: 'Any future date'
  }
};

// Make configurations globally accessible
window.DIRECTPAY_CONFIG = DIRECTPAY_CONFIG;
window.DIRECTPAY_TEST_CARDS = DIRECTPAY_TEST_CARDS;
