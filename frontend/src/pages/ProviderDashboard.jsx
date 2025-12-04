/**
 * Provider Dashboard Component
 * 
 * Main dashboard page for provider users.
 * Displays provider-specific features and navigation.
 * 
 * Features:
 * - Provider-specific navigation and UI
 * - Access to business management, availability, and appointments
 * - Section-based routing within dashboard
 * - Fetches and displays current user data and businesses on load
 * - Displays different content based on active section
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import BusinessManagement from '../components/BusinessManagement';
import AvailabilityManagement from '../components/AvailabilityManagement';
import AppointmentManagement from '../components/AppointmentManagement';
import ProviderAppointmentHistory from '../components/ProviderAppointmentHistory';
import api from '../utils/api';

const ProviderDashboard = () => {
    const { user, updateUser } = useAuth();
    const [activeSection, setActiveSection] = useState('home');
    const [isLoadingUserData, setIsLoadingUserData] = useState(false);
    const [userDataError, setUserDataError] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(false);
    const [businessesError, setBusinessesError] = useState(null);

    /**
     * Fetch current user data from the API on component mount.
     * Updates the auth context with fresh user data.
     */
    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoadingUserData(true);
            setUserDataError(null);

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Add auth token to request headers
                const response = await api.get('/auth/me/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Normalize role to lowercase for consistency in frontend
                const userData = {
                    ...response.data,
                    role: response.data.role?.toLowerCase()
                };

                // Update user data in auth context
                updateUser(userData);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUserDataError(error.response?.data?.message || 'Failed to load user data');
            } finally {
                setIsLoadingUserData(false);
            }
        };

        fetchUserData();
    }, [updateUser]);

    /**
     * Fetch provider's businesses from the API on component mount.
     */
    useEffect(() => {
        const fetchBusinesses = async () => {
            setIsLoadingBusinesses(true);
            setBusinessesError(null);

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await api.get('/businesses/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setBusinesses(response.data);
            } catch (error) {
                console.error('Error fetching businesses:', error);
                setBusinessesError(error.response?.data?.message || 'Failed to load businesses');
            } finally {
                setIsLoadingBusinesses(false);
            }
        };

        fetchBusinesses();
    }, []);

    /**
     * Handle navigation between dashboard sections.
     * @param {string} section - Section identifier ('home', 'businesses', 'availability', 'appointments', 'history')
     */
    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    /**
     * Render content based on active section.
     * @returns {React.ReactNode} Section-specific content
     */
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'businesses':
                return <BusinessManagement />;

            case 'availability':
                return <AvailabilityManagement />;

            case 'appointments':
                return <AppointmentManagement />;

            case 'history':
                return <ProviderAppointmentHistory />;

            case 'home':
            default:
                return (
                    <div className="space-y-6">
                        {/* Welcome Section */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Welcome, {user?.full_name || user?.username}!
                            </h2>
                            <p className="text-gray-600">
                                Manage your businesses, availability, and appointments
                            </p>
                            {user?.email && (
                                <p className="text-sm text-gray-500 mt-2">
                                    {user.email}
                                </p>
                            )}
                        </div>

                        {/* Business Summary */}
                        {isLoadingBusinesses ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                                    <p className="text-blue-700">Loading businesses...</p>
                                </div>
                            </div>
                        ) : businessesError ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-700">Business data will be available once the business management feature is implemented.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Businesses</h3>
                                {businesses.length > 0 ? (
                                    <p className="text-gray-600">You have {businesses.length} business(es)</p>
                                ) : (
                                    <p className="text-gray-600">No businesses yet. Create your first business to get started!</p>
                                )}
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <button
                                onClick={() => handleSectionChange('businesses')}
                                className="bg-indigo-50 p-4 sm:p-6 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-indigo-900 mb-1 sm:mb-2 text-sm sm:text-base">My Businesses</h3>
                                <p className="text-xs sm:text-sm text-indigo-700">Create and manage your service offerings</p>
                            </button>

                            <button
                                onClick={() => handleSectionChange('availability')}
                                className="bg-purple-50 p-4 sm:p-6 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-purple-900 mb-1 sm:mb-2 text-sm sm:text-base">Availability</h3>
                                <p className="text-xs sm:text-sm text-purple-700">Set your available time slots</p>
                            </button>

                            <button
                                onClick={() => handleSectionChange('appointments')}
                                className="bg-pink-50 p-4 sm:p-6 rounded-lg border border-pink-100 hover:bg-pink-100 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-pink-900 mb-1 sm:mb-2 text-sm sm:text-base">Appointments</h3>
                                <p className="text-xs sm:text-sm text-pink-700">View and manage bookings</p>
                            </button>

                            <button
                                onClick={() => handleSectionChange('history')}
                                className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">History</h3>
                                <p className="text-xs sm:text-sm text-blue-700">Review past appointments</p>
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <DashboardLayout
            role="provider"
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
        >
            {/* Loading State */}
            {isLoadingUserData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                        <p className="text-blue-700">Loading user data...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {userDataError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700">{userDataError}</p>
                </div>
            )}

            {/* Section Content */}
            {renderSectionContent()}
        </DashboardLayout>
    );
};

export default ProviderDashboard;
