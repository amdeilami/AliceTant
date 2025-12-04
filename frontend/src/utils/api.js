/**
 * API utility for making HTTP requests to the backend.
 * 
 * Features:
 * - Automatic token injection for authenticated requests
 * - Token expiration handling with redirect to login
 * - Retry functionality for failed requests
 * - Global error handling
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor to add authentication token to all requests.
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor to handle errors globally.
 * Handles token expiration, network errors, and provides retry functionality.
 */
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized (token expired or invalid)
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Clear auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');

            // Redirect to login page
            window.location.href = '/login';

            return Promise.reject(error);
        }

        // Handle network errors with retry functionality
        if (!error.response && !originalRequest._retryCount) {
            originalRequest._retryCount = 0;
        }

        // Retry failed requests up to 2 times for network errors
        if (!error.response && originalRequest._retryCount < 2) {
            originalRequest._retryCount += 1;

            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, originalRequest._retryCount) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));

            return api(originalRequest);
        }

        return Promise.reject(error);
    }
);

/**
 * Register a new user account.
 * 
 * @param {Object} userData - User registration data
 * @param {string} userData.full_name - User's full name (2-64 characters)
 * @param {string} userData.email - User's email address
 * @param {string} [userData.phone_number] - User's phone number (optional)
 * @param {string} userData.password - User's password (min 8 characters)
 * @param {string} userData.role - User's role ('customer' or 'provider')
 * @returns {Promise<Object>} Response containing user data
 * @throws {Error} API error with response data
 */
export const signup = async (userData) => {
    const response = await api.post('/auth/signup/', userData);
    return response.data;
};

/**
 * Authenticate a user and obtain access token.
 * 
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.email - User's email address
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Response containing token and user data
 * @throws {Error} API error with response data
 */
export const login = async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
};

/**
 * Retry a failed API request manually.
 * Useful for user-initiated retry actions.
 * 
 * @param {Function} apiCall - The API call function to retry
 * @param {Array} args - Arguments to pass to the API call
 * @returns {Promise} Result of the API call
 */
export const retryRequest = async (apiCall, ...args) => {
    return await apiCall(...args);
};

export default api;
