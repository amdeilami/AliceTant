/**
 * Customer Dashboard Component
 * 
 * Main dashboard page for customer users.
 * Displays customer-specific features and navigation.
 * 
 * Features:
 * - Customer-specific navigation and UI
 * - Access to search, appointments, and profile sections
 * - Section-based routing within dashboard
 * - Fetches and displays current user data on load
 * - Displays different content based on active section
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import SearchBar from '../components/SearchBar';
import AppointmentHistory from '../components/AppointmentHistory';
import ProfileSection from '../components/ProfileSection';
import api from '../utils/api';

const CustomerDashboard = () => {
    const { user, updateUser } = useAuth();
    const [activeSection, setActiveSection] = useState('home');
    const [isLoadingUserData, setIsLoadingUserData] = useState(false);
    const [userDataError, setUserDataError] = useState(null);

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
     * Handle navigation between dashboard sections.
     * @param {string} section - Section identifier ('home', 'search', 'appointments', 'profile')
     */
    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    /**
     * Handle search query from SearchBar component.
     * Search logic will be implemented in later tasks.
     * @param {string} query - Search query string
     */
    const handleSearch = (query) => {
        console.log('Search query:', query);
        // TODO: Implement search logic in future tasks
        // This will call the API to search for providers/businesses
    };

    /**
     * Render content based on active section.
     * @returns {React.ReactNode} Section-specific content
     */
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'search':
                return (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Providers</h2>
                        <p className="text-gray-600 mb-6">Find service providers and businesses to book appointments.</p>

                        {/* Search Bar */}
                        <div className="mb-6">
                            <SearchBar onSearch={handleSearch} />
                        </div>

                        {/* Search Results Placeholder */}
                        <div className="text-center py-8 text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p>Start typing to search for providers or businesses</p>
                        </div>
                    </div>
                );

            case 'appointments':
                return <AppointmentHistory />;

            case 'profile':
                return <ProfileSection />;

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
                                Manage your appointments and find service providers
                            </p>
                            {user?.email && (
                                <p className="text-sm text-gray-500 mt-2">
                                    {user.email}
                                </p>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <button
                                onClick={() => handleSectionChange('search')}
                                className="bg-indigo-50 p-4 sm:p-6 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-indigo-900 mb-1 sm:mb-2 text-sm sm:text-base">Search Providers</h3>
                                <p className="text-xs sm:text-sm text-indigo-700">Find and book appointments with service providers</p>
                            </button>

                            <button
                                onClick={() => handleSectionChange('appointments')}
                                className="bg-purple-50 p-4 sm:p-6 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-purple-900 mb-1 sm:mb-2 text-sm sm:text-base">My Appointments</h3>
                                <p className="text-xs sm:text-sm text-purple-700">View and manage your upcoming appointments</p>
                            </button>

                            <button
                                onClick={() => handleSectionChange('profile')}
                                className="bg-pink-50 p-4 sm:p-6 rounded-lg border border-pink-100 hover:bg-pink-100 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-pink-900 mb-1 sm:mb-2 text-sm sm:text-base">Profile</h3>
                                <p className="text-xs sm:text-sm text-pink-700">Update your profile and preferences</p>
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <DashboardLayout
            role="customer"
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

export default CustomerDashboard;
