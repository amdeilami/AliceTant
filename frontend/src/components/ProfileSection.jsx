/**
 * ProfileSection Component
 * 
 * User profile management interface with tabs for avatar, email, and password updates.
 * Handles form validation, API calls, and displays success/error messages.
 * 
 * Features:
 * - Avatar upload with preview and file validation
 * - Email update form with validation
 * - Password update form with current password, new password, and confirmation
 * - Success/error message display
 * - Updates displayed user data after successful changes
 */
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const ProfileSection = () => {
    const { user, updateUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const [activeTab, setActiveTab] = useState('avatar');
    const [isLoading, setIsLoading] = useState(false);

    // Avatar state
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Email state
    const [email, setEmail] = useState(user?.email || '');

    // Password state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });



    /**
     * Handle avatar file selection.
     * Validates file type and creates preview.
     * 
     * @param {Event} e - File input change event
     */
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showError('Invalid file type. Please upload a JPEG, PNG, GIF, or WEBP image.');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showError('File size must be less than 5MB.');
            return;
        }

        setAvatarFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    /**
     * Handle avatar upload submission.
     * 
     * @param {Event} e - Form submit event
     */
    const handleAvatarSubmit = async (e) => {
        e.preventDefault();

        if (!avatarFile) {
            showError('Please select an image file.');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();
            formData.append('avatar', avatarFile);

            const response = await api.post('/profile/avatar/', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            showSuccess(response.data.message || 'Avatar updated successfully');

            // Reset form
            setAvatarFile(null);
            setAvatarPreview(null);
        } catch (error) {
            console.error('Avatar upload error:', error);
            showError(error.response?.data?.error || error.response?.data?.details?.avatar?.[0] || 'Failed to upload avatar');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle email update submission.
     * 
     * @param {Event} e - Form submit event
     */
    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await api.put('/profile/email/',
                { email },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            showSuccess(response.data.message || 'Email updated successfully');

            // Update user data in context
            if (response.data.user) {
                updateUser(response.data.user);
            }
        } catch (error) {
            console.error('Email update error:', error);
            showError(error.response?.data?.error || error.response?.data?.details?.email?.[0] || 'Failed to update email');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle password update submission.
     * 
     * @param {Event} e - Form submit event
     */
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // Validate password confirmation
        if (passwordData.new_password !== passwordData.confirm_password) {
            showError('Password confirmation does not match.');
            return;
        }

        // Validate password length
        if (passwordData.new_password.length < 8) {
            showError('New password must be at least 8 characters long.');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await api.put('/profile/password/', passwordData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            showSuccess(response.data.message || 'Password updated successfully');

            // Reset form
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            console.error('Password update error:', error);
            showError(error.response?.data?.error || error.response?.data?.details?.new_password?.[0] || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Profile</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your profile settings and preferences</p>
            </div>



            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex px-4 sm:px-6 overflow-x-auto" aria-label="Profile settings tabs" role="tablist">
                    <button
                        onClick={() => setActiveTab('avatar')}
                        role="tab"
                        aria-selected={activeTab === 'avatar'}
                        aria-controls="avatar-panel"
                        id="avatar-tab"
                        className={`py-4 px-4 sm:px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'avatar'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Avatar
                    </button>
                    <button
                        onClick={() => setActiveTab('email')}
                        role="tab"
                        aria-selected={activeTab === 'email'}
                        aria-controls="email-panel"
                        id="email-tab"
                        className={`py-4 px-4 sm:px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'email'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Email
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        role="tab"
                        aria-selected={activeTab === 'password'}
                        aria-controls="password-panel"
                        id="password-tab"
                        className={`py-4 px-4 sm:px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'password'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Password
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
                {/* Avatar Tab */}
                {activeTab === 'avatar' && (
                    <div role="tabpanel" id="avatar-panel" aria-labelledby="avatar-tab">
                        <form onSubmit={handleAvatarSubmit} className="max-w-md" aria-label="Avatar upload form">
                            <div className="mb-6">
                                <label htmlFor="avatar-upload" className="block text-sm font-medium text-gray-700 mb-2">
                                    Profile Picture
                                </label>

                                {/* Avatar Preview */}
                                <div className="mb-4" role="img" aria-label={avatarPreview ? "Selected avatar preview" : "Default avatar placeholder"}>
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar preview"
                                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                                            <svg className="w-16 h-16 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* File Input */}
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    onChange={handleAvatarChange}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-indigo-50 file:text-indigo-700
                                        hover:file:bg-indigo-100
                                        cursor-pointer"
                                    aria-describedby="avatar-help"
                                />
                                <p id="avatar-help" className="mt-2 text-xs text-gray-500">
                                    Accepted formats: JPEG, PNG, GIF, WEBP (max 5MB)
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !avatarFile}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                aria-label={isLoading ? "Uploading avatar" : "Upload avatar"}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span className="ml-2">Uploading...</span>
                                    </>
                                ) : (
                                    'Upload Avatar'
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Email Tab */}
                {activeTab === 'email' && (
                    <div role="tabpanel" id="email-panel" aria-labelledby="email-tab">
                        <form onSubmit={handleEmailSubmit} className="max-w-md" aria-label="Email update form">
                            <div className="mb-6">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <p className="text-sm text-gray-500 mb-3" id="current-email">
                                    Current email: <span className="font-medium">{user?.email}</span>
                                </p>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter new email address"
                                    required
                                    aria-describedby="current-email"
                                    aria-label="New email address"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || email === user?.email}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                aria-label={isLoading ? "Updating email" : "Update email"}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span className="ml-2">Updating...</span>
                                    </>
                                ) : (
                                    'Update Email'
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <div role="tabpanel" id="password-panel" aria-labelledby="password-tab">
                        <form onSubmit={handlePasswordSubmit} className="max-w-md" aria-label="Password update form">
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        id="current_password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter current password"
                                        required
                                        aria-label="Current password"
                                        autoComplete="current-password"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="new_password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter new password (min 8 characters)"
                                        required
                                        minLength={8}
                                        aria-label="New password"
                                        aria-describedby="password-requirements"
                                        autoComplete="new-password"
                                    />
                                    <p id="password-requirements" className="sr-only">
                                        Password must be at least 8 characters long
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Confirm new password"
                                        required
                                        aria-label="Confirm new password"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                aria-label={isLoading ? "Updating password" : "Update password"}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span className="ml-2">Updating...</span>
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSection;
