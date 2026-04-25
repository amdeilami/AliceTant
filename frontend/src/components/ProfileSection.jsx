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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage your profile settings and preferences</p>
            </div>



            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex px-4 sm:px-6 overflow-x-auto" aria-label="Profile settings tabs" role="tablist">
                    <button
                        onClick={() => setActiveTab('avatar')}
                        role="tab"
                        aria-selected={activeTab === 'avatar'}
                        aria-controls="avatar-panel"
                        id="avatar-tab"
                        className={`py-4 px-4 sm:px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'avatar'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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
                        <form onSubmit={handleAvatarSubmit} className="max-w-sm mx-auto" aria-label="Avatar upload form">
                            {/* Avatar Preview — centered */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar preview"
                                            className="w-28 h-28 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-700"
                                        />
                                    ) : (
                                        <div className="w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-4 ring-gray-100 dark:ring-gray-700">
                                            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                    {/* Overlay pick button */}
                                    <label
                                        htmlFor="avatar-upload"
                                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 hover:bg-black/40 transition-colors cursor-pointer group"
                                    >
                                        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </label>
                                </div>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    onChange={handleAvatarChange}
                                    className="sr-only"
                                    aria-describedby="avatar-help"
                                />
                                <p id="avatar-help" className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                                    Click the photo to choose a file&ensp;&middot;&ensp;JPEG, PNG, GIF, WEBP&ensp;&middot;&ensp;Max 5 MB
                                </p>
                                {avatarFile && (
                                    <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">{avatarFile.name}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !avatarFile}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3" id="current-email">
                                    Current email: <span className="font-medium">{user?.email}</span>
                                </p>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter new email address"
                                    required
                                    aria-describedby="current-email"
                                    aria-label="New email address"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || email === user?.email}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        id="current_password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter current password"
                                        required
                                        aria-label="Current password"
                                        autoComplete="current-password"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="new_password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
