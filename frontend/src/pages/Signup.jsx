/**
 * Signup page component for user registration.
 * Provides form for new users to create an account with role selection.
 * 
 * Features:
 * - Form state management for all signup fields
 * - Client-side validation with error display
 * - Role selection (Customer/Provider)
 * - Navigation to login page
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

function Signup() {
    // Form state management
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'customer'
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
            case 'fullName':
                if (!value.trim()) {
                    error = 'Full name is required';
                } else if (value.trim().length < 2) {
                    error = 'Full name must be at least 2 characters';
                }
                break;

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
                } else if (value.length < 8) {
                    error = 'Password must be at least 8 characters and contain at least one letter and one number';
                } else if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
                    error = 'Password must be at least 8 characters and contain at least one letter and one number';
                }
                break;

            case 'confirmPassword':
                if (!value) {
                    error = 'Please confirm your password';
                } else if (value !== formData.password) {
                    error = 'Passwords do not match';
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

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Full name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8 || !/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
            newErrors.password = 'Password must be at least 8 characters and contain at least one letter and one number';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handles form submission.
     * 
     * @param {Event} e - Form submit event
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // Prepare data for future backend integration
        const submitData = {
            full_name: formData.fullName,
            email: formData.email,
            phone_number: formData.phoneNumber || null,
            password: formData.password,
            role: formData.role
        };

        console.log('Form submitted:', submitData);

        // TODO: Replace with actual API call when backend is ready
        // api.post('/auth/signup/', submitData)

        setIsSubmitting(false);
        alert('Signup successful! (Backend integration pending)');
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Join AliceTant to manage your appointments
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

                            {/* Full Name Field */}
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name <span className="text-red-500" aria-label="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    onBlur={() => validateField('fullName', formData.fullName)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter your full name"
                                    aria-required="true"
                                    aria-invalid={errors.fullName ? 'true' : 'false'}
                                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                                />
                                {errors.fullName && (
                                    <p id="fullName-error" className="mt-1 text-sm text-red-600" role="alert">
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

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

                            {/* Phone Number Field (Optional) */}
                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    placeholder="+1 (555) 000-0000"
                                    aria-required="false"
                                    autoComplete="tel"
                                />
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
                                    aria-describedby={errors.password ? 'password-error password-requirements' : 'password-requirements'}
                                    autoComplete="new-password"
                                />
                                <p id="password-requirements" className="mt-1 text-xs text-gray-500">
                                    Must be at least 8 characters with one letter and one number
                                </p>
                                {errors.password && (
                                    <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password <span className="text-red-500" aria-label="required">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Confirm your password"
                                    aria-required="true"
                                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                                    autoComplete="new-password"
                                />
                                {errors.confirmPassword && (
                                    <p id="confirmPassword-error" className="mt-1 text-sm text-red-600" role="alert">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            {/* Role Selection */}
                            <fieldset>
                                <legend className="block text-sm font-medium text-gray-700 mb-2">
                                    Role <span className="text-red-500" aria-label="required">*</span>
                                </legend>
                                <div className="flex gap-4" role="radiogroup" aria-required="true">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="customer"
                                            checked={formData.role === 'customer'}
                                            onChange={(e) => handleInputChange('role', e.target.value)}
                                            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300"
                                            aria-label="Customer role"
                                        />
                                        <span className="text-sm text-gray-700">Customer</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="provider"
                                            checked={formData.role === 'provider'}
                                            onChange={(e) => handleInputChange('role', e.target.value)}
                                            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300"
                                            aria-label="Provider role"
                                        />
                                        <span className="text-sm text-gray-700">Provider</span>
                                    </label>
                                </div>
                            </fieldset>

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    aria-label={isSubmitting ? 'Creating account, please wait' : 'Sign up for AliceTant'}
                                >
                                    {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                                </button>
                            </div>

                            {/* Login Link */}
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <Link
                                        to="/login"
                                        className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                                    >
                                        Login here
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

export default Signup;
