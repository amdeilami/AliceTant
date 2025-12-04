/**
 * API utility for making HTTP requests to the backend.
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

export default api;
