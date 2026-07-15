/**
 * Environment Configuration
 *
 * This file contains all environment variables and API configurations.
 * To change URLs or keys, update the values below or use a .env file with react-native-config.
 *
 * NOTE: For production, replace test keys with live keys and update URLs accordingly.
 */

// ===========================================
// ENVIRONMENT SETTINGS
// ===========================================
export const APP_ENV = 'development'; // 'development' | 'production'

// ===========================================
// MAIN BACKEND API
// ===========================================
// Production URL
const PRODUCTION_API_URL = 'https://sahayaa-backend-production.up.railway.app/api/';
// Local Development URL
const DEVELOPMENT_API_URL = 'https://sahayaa-backend-production.up.railway.app/api/';


// Use production URL by default, switch to development URL for local testing
export const BASE_URL = PRODUCTION_API_URL;

// ===========================================
// RAZORPAY PAYMENT GATEWAY
// ===========================================
// Razorpay Payment API Base URL (for create-order, verify-payment, etc.)
export const RAZORPAY_API_URL = 'https://sahayaa-backend-production.up.railway.app/api/';

// The public checkout key is safe to ship in the mobile app. The secret key
// must remain on the backend and is never needed by the client.
export const RAZORPAY_KEY_ID = 'rzp_test_Rcx3E3rF2dNmEc';

// Production Keys (Replace for production deployment)
// export const RAZORPAY_KEY_ID = 'rzp_live_XXXXXXXXXXXXXXX';

// ===========================================
// GOOGLE MAPS
// ===========================================
export const mapKey = 'AIzaSyCt8jw_uRbRfr9_8CBRdauiHY8rWCjV6WU';
export const GOOGLE_MAPS_API_KEY = mapKey;

// ===========================================
// ANALYTICS
// ===========================================
export const MixPanelKey = '';

// ===========================================
// HELPER FUNCTIONS
// ===========================================
/**
 * Get full API URL for a route
 * @param {string} route - The API route
 * @returns {string} Full URL
 */
export const getApiUrl = (route) => `${BASE_URL}${route}`;

/**
 * Get full Razorpay API URL for a route
 * @param {string} route - The API route (e.g., 'create-order.php')
 * @returns {string} Full URL
 */
export const getRazorpayApiUrl = (route) => `${RAZORPAY_API_URL}${route}`;

// ===========================================
// DEFAULT EXPORT
// ===========================================
export default {
  APP_ENV,
  BASE_URL,
  RAZORPAY_API_URL,
  RAZORPAY_KEY_ID,
  mapKey,
  GOOGLE_MAPS_API_KEY,
  MixPanelKey,
  getApiUrl,
  getRazorpayApiUrl,
};

