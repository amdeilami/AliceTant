/**
 * ErrorBoundary Component
 * 
 * Global error boundary that catches React errors and displays a fallback UI.
 * Prevents the entire application from crashing due to component errors.
 * 
 * Features:
 * - Catches errors in child components
 * - Displays user-friendly error message
 * - Provides option to reload the page
 * - Logs errors to console for debugging
 */
import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    /**
     * Update state when an error is caught.
     * 
     * @param {Error} error - The error that was thrown
     * @returns {Object} New state
     */
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    /**
     * Log error details when an error is caught.
     * 
     * @param {Error} caughtError - The error that was thrown
     * @param {Object} errorInfo - Additional error information
     */
    componentDidCatch(caughtError, errorInfo) {
        console.error('Error caught by ErrorBoundary:', caughtError, errorInfo);
        this.setState({
            error: caughtError,
            errorInfo
        });
    }

    /**
     * Handle page reload.
     */
    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
                            <svg
                                className="w-8 h-8 text-red-600"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-gray-600 text-center mb-6">
                            We encountered an unexpected error. Please try reloading the page.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-gray-100 rounded-lg overflow-auto max-h-48">
                                <p className="text-sm font-mono text-red-600 mb-2">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                                Reload Page
                            </button>

                            <a
                                href="/"
                                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
                            >
                                Go to Home
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
