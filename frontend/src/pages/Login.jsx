/**
 * Login page component for user authentication.
 * Provides form for existing users to log into their account.
 * 
 * Features:
 * - Form state management for email and password
 * - Client-side validation with error display
 * - OAuth login options (Google and Facebook)
 * - Navigation to signup page
 * - Backend API integration for authentication
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { login } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Login() {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();
    const { showSuccess, showError } = useToast();

    // Form state management
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Handles input changes for form fields.
     * 
     * @param {string} field - The name of the field being updated
     * @param {string} value - The new value for the field
     */
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    /**
     * Validates a single form field.
     * 
     * @param {string} field - The field name to validate
     * @param {string} value - The field value to validate
     */
    const validateField = (field, value) => {
        let error = '';

        switch (field) {
            case 'email':
                if (!value.trim()) {
                    error = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'Please enter a valid email address';
                }
                break;

            case 'password':
                if (!value) {
                    error = 'Password is required';
                }
                break;

            default:
                break;
        }

        setErrors(prev => ({
            ...prev,
            [field]: error || undefined
        }));
    };

    /**
     * Validates all form fields.
     * 
     * @returns {boolean} - True if form is valid, false otherwise
     */
    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handles form submission.
     * Authenticates user with backend API and handles various response scenarios.
     * 
     * @param {Event} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // Clear any previous general errors
        setErrors(prev => ({
            ...prev,
            general: undefined
        }));

        try {
            // Call backend login API
            const response = await login({
                email: formData.email,
                password: formData.password
            });

            // Normalize role to lowercase for consistency
            const normalizedUser = {
                ...response.user,
                role: response.user.role?.toLowerCase()
            };

            // Handle 200 success response
            // Store token and user data using AuthContext
            authLogin(response.token, normalizedUser);

            // Show success toast
            showSuccess('Login successful! Redirecting...');

            // Redirect to role-specific dashboard
            // Use setTimeout to ensure state updates complete before navigation
            const dashboardPath = normalizedUser.role === 'customer'
                ? '/dashboard/customer'
                : '/dashboard/provider';

            setTimeout(() => {
                navigate(dashboardPath, { replace: true });
            }, 100);
        } catch (error) {
            // Handle different error scenarios
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                if (status === 401) {
                    // Handle 401 unauthorized error (invalid credentials)
                    const errorMsg = errorData.error || 'Invalid email or password. Please try again.';
                    setErrors({ general: errorMsg });
                    showError(errorMsg);
                } else if (status === 400) {
                    // Handle 400 validation error
                    const errorMsg = errorData.error || 'Please check your input and try again.';
                    setErrors({ general: errorMsg });
                    showError(errorMsg);
                } else {
                    // Handle other server errors
                    const errorMsg = 'An unexpected error occurred. Please try again later.';
                    setErrors({ general: errorMsg });
                    showError(errorMsg);
                }
            } else if (error.request) {
                // Handle network errors (no response received)
                const errorMsg = 'Unable to connect to the server. Please check your internet connection and try again.';
                setErrors({ general: errorMsg });
                showError(errorMsg);
            } else {
                // Handle other errors
                const errorMsg = 'Something went wrong. Please try again.';
                setErrors({ general: errorMsg });
                showError(errorMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handles OAuth login button clicks.
     * 
     * @param {string} provider - The OAuth provider (google or facebook)
     */
    const handleOAuthLogin = (provider) => {
        console.log(`OAuth login with ${provider}`);
        // TODO: Implement OAuth flow when backend is ready
        alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth login (Backend integration pending)`);
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Sign in to your AliceTant account
                        </p>
                    </div>

                    <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                            {/* Screen reader announcement region for form errors */}
                            <div
                                role="alert"
                                aria-live="polite"
                                aria-atomic="true"
                                className="sr-only"
                            >
                                {Object.keys(errors).length > 0 && (
                                    `Form has ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''}`
                                )}
                            </div>

                            {/* General Error Message */}
                            {errors.general && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
                                    <p className="text-sm">{errors.general}</p>
                                </div>
                            )}

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address <span className="text-red-500" aria-label="required">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    onBlur={() => validateField('email', formData.email)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="you@example.com"
                                    aria-required="true"
                                    aria-invalid={errors.email ? 'true' : 'false'}
                                    aria-describedby={errors.email ? 'email-error' : undefined}
                                    autoComplete="email"
                                />
                                {errors.email && (
                                    <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password <span className="text-red-500" aria-label="required">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    onBlur={() => validateField('password', formData.password)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter your password"
                                    aria-required="true"
                                    aria-invalid={errors.password ? 'true' : 'false'}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                    autoComplete="current-password"
                                />
                                {errors.password && (
                                    <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    aria-label={isSubmitting ? 'Logging in, please wait' : 'Login to AliceTant'}
                                >
                                    {isSubmitting ? 'Logging in...' : 'Login'}
                                </button>
                            </div>

                            {/* OAuth Section */}
                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">Or login with</span>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleOAuthLogin('google')}
                                        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                        aria-label="Login with Google"
                                    >
                                        Google
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOAuthLogin('facebook')}
                                        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                        aria-label="Login with Facebook"
                                    >
                                        Facebook
                                    </button>
                                </div>
                            </div>

                            {/* Signup Link */}
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <Link
                                        to="/signup"
                                        className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                                    >
                                        Sign up here
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Login;
