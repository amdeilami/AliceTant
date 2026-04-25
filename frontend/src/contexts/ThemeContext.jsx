/**
 * Theme Context Provider
 * 
 * Manages dark/light theme state across the entire application.
 * Persists the user's preference in localStorage and applies the
 * 'dark' class to the <html> element for CSS-based dark mode.
 * 
 * Available to all pages regardless of authentication status.
 * 
 * Features:
 * - Persistent theme preference via localStorage
 * - Respects system preference (prefers-color-scheme) on first visit
 * - Toggles 'dark' class on <html> for global CSS dark mode
 * - Exposes theme state and toggle function via React context
 */
import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

/**
 * Custom hook to access theme context.
 * Must be used within a ThemeProvider.
 * 
 * @returns {{ theme: 'light' | 'dark', toggleTheme: () => void, isDark: boolean }}
 * @throws {Error} If used outside of ThemeProvider
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

/**
 * Determine the initial theme from localStorage or system preference.
 * @returns {'light' | 'dark'}
 */
const getInitialTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
        return stored;
    }
    // Fall back to system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

/**
 * ThemeProvider component that wraps the application.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);

    // Apply the dark class to <html> whenever theme changes
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = {
        theme,
        toggleTheme,
        isDark: theme === 'dark',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
