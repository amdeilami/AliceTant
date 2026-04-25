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
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import SearchBar from '../components/SearchBar';
import AppointmentHistory from '../components/AppointmentHistory';
import ProfileSection from '../components/ProfileSection';
import api from '../utils/api';

const CustomerDashboard = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('home');
    const [isLoadingUserData, setIsLoadingUserData] = useState(false);
    const [userDataError, setUserDataError] = useState(null);

    // Search state
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

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
    const handleSearch = async (query) => {
        setIsSearching(true);
        setHasSearched(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get(`/businesses/search/?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSearchResults(response.data);
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Load all businesses when entering search section
    useEffect(() => {
        if (activeSection === 'search' && !hasSearched) {
            handleSearch('');
        }
    }, [activeSection]);

    /**
     * Render content based on active section.
     * @returns {React.ReactNode} Section-specific content
     */
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'search':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Search Businesses</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Find businesses by name, phone, or email to book appointments.</p>

                        <div className="mb-6">
                            <SearchBar onSearch={handleSearch} placeholder="Search by name, phone, or email..." />
                        </div>

                        {isSearching ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                                <p className="text-gray-500 dark:text-gray-400">Searching...</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {searchResults.map(biz => (
                                    <button
                                        key={biz.id}
                                        onClick={() => navigate(`/business/${biz.id}`)}
                                        className="text-left bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            {biz.logo_url ? (
                                                <img src={biz.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{biz.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">{biz.name}</h3>
                                                {biz.summary && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{biz.summary}</p>
                                                )}
                                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                                                    {biz.phone && <span>{biz.phone}</span>}
                                                    {biz.email && <span>{biz.email}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : hasSearched ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <p>No businesses found matching your search.</p>
                            </div>
                        ) : null}
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
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Welcome, {user?.full_name || user?.username}!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Manage your appointments and find service providers
                            </p>
                            {user?.email && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    {user.email}
                                </p>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <button
                                onClick={() => handleSectionChange('search')}
                                className="bg-indigo-50 dark:bg-indigo-900/20 p-4 sm:p-6 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-1 sm:mb-2 text-sm sm:text-base">Search Businesses</h3>
                                <p className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-400">Find businesses and book appointments</p>
                            </button>

                            <button
                                onClick={() => handleSectionChange('appointments')}
                                className="bg-purple-50 dark:bg-purple-900/20 p-4 sm:p-6 rounded-lg border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-1 sm:mb-2 text-sm sm:text-base">My Appointments</h3>
                                <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-400">View and manage your upcoming appointments</p>
                            </button>

                            <button
                                onClick={() => handleSectionChange('profile')}
                                className="bg-pink-50 dark:bg-pink-900/20 p-4 sm:p-6 rounded-lg border border-pink-100 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors text-left"
                            >
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600 dark:text-pink-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-pink-900 dark:text-pink-300 mb-1 sm:mb-2 text-sm sm:text-base">Profile</h3>
                                <p className="text-xs sm:text-sm text-pink-700 dark:text-pink-400">Update your profile and preferences</p>
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
