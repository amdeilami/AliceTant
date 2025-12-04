/**
 * Toast Context Provider
 * 
 * Provides global toast notification functionality throughout the application.
 * Manages toast state and provides methods to show/hide toasts.
 * 
 * Features:
 * - Global toast state management
 * - Methods to show success, error, info, and warning toasts
 * - Automatic toast ID generation
 * - Toast removal handling
 */
import { createContext, useState, useContext, useCallback } from 'react';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext(null);

/**
 * Custom hook to access toast context.
 * Must be used within a ToastProvider.
 * 
 * @returns {Object} Toast context value
 * @throws {Error} If used outside of ToastProvider
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

/**
 * ToastProvider component that wraps the application and provides toast functionality.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    /**
     * Add a new toast notification.
     * 
     * @param {string} type - Toast type ('success', 'error', 'info', 'warning')
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds (0 for no auto-dismiss)
     */
    const addToast = useCallback((type, message, duration = 5000) => {
        const id = Date.now() + Math.random();
        const newToast = { id, type, message, duration };

        setToasts((prevToasts) => [...prevToasts, newToast]);
    }, []);

    /**
     * Remove a toast by ID.
     * 
     * @param {number} id - Toast ID
     */
    const removeToast = useCallback((id) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    /**
     * Show a success toast.
     * 
     * @param {string} message - Success message
     * @param {number} duration - Duration in milliseconds
     */
    const showSuccess = useCallback((message, duration) => {
        addToast('success', message, duration);
    }, [addToast]);

    /**
     * Show an error toast.
     * 
     * @param {string} message - Error message
     * @param {number} duration - Duration in milliseconds
     */
    const showError = useCallback((message, duration) => {
        addToast('error', message, duration);
    }, [addToast]);

    /**
     * Show an info toast.
     * 
     * @param {string} message - Info message
     * @param {number} duration - Duration in milliseconds
     */
    const showInfo = useCallback((message, duration) => {
        addToast('info', message, duration);
    }, [addToast]);

    /**
     * Show a warning toast.
     * 
     * @param {string} message - Warning message
     * @param {number} duration - Duration in milliseconds
     */
    const showWarning = useCallback((message, duration) => {
        addToast('warning', message, duration);
    }, [addToast]);

    const value = {
        showSuccess,
        showError,
        showInfo,
        showWarning,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        </ToastContext.Provider>
    );
};

export default ToastContext;
