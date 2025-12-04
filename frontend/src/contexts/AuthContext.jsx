/**
 * Authentication Context Provider
 * 
 * Manages global authentication state including user data, authentication status,
 * and authentication methods (login, logout, updateUser).
 * 
 * Features:
 * - Persists authentication state to localStorage
 * - Provides authentication status and user data to all components
 * - Handles token management
 * - Provides methods for login, logout, and user data updates
 */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider.
 * 
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * AuthProvider component that wraps the application and provides authentication state.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize authentication state from localStorage on mount
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const token = localStorage.getItem('authToken');
                const userData = localStorage.getItem('userData');

                if (token && userData) {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                // Clear invalid data
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    /**
     * Login user and store authentication data.
     * 
     * @param {string} token - Authentication token
     * @param {Object} userData - User data object
     */
    const login = useCallback((token, userData) => {
        console.log('AuthContext login called with:', { token, userData });
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        console.log('AuthContext state updated:', { isAuthenticated: true, user: userData });
    }, []);

    /**
     * Logout user and clear authentication data.
     */
    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    /**
     * Update user data in state and localStorage.
     * 
     * @param {Object} updates - Partial user data to update
     */
    const updateUser = useCallback((updates) => {
        setUser(currentUser => {
            const updatedUser = { ...currentUser, ...updates };
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
