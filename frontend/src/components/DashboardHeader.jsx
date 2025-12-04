/**
 * DashboardHeader Component
 * 
 * Header bar for dashboard pages with user info and logout button.
 * 
 * Features:
 * - Displays user information (name, avatar)
 * - Logout button
 * - Hamburger menu button for mobile sidebar toggle
 * - Responsive design
 * - Role-specific branding
 * 
 * @param {Object} props - Component props
 * @param {string} props.role - User role ('customer' or 'provider')
 * @param {Function} props.onToggleSidebar - Callback to toggle sidebar
 * @param {boolean} props.isSidebarOpen - Current sidebar state
 */
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = ({ role, onToggleSidebar, isSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    /**
     * Handle user logout
     */
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get display name from user data
    const displayName = user?.full_name || user?.username || 'User';
    const userInitials = displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-30" role="banner">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
                {/* Left section: Hamburger menu (mobile) + Logo/Title */}
                <div className="flex items-center space-x-4">
                    {/* Hamburger menu button - visible on mobile */}
                    <button
                        onClick={onToggleSidebar}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={isSidebarOpen}
                        aria-controls="dashboard-sidebar"
                    >
                        <svg
                            className="w-6 h-6 text-gray-600"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            {isSidebarOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>

                    {/* Logo/Title */}
                    <div className="flex items-center">
                        <h1 className="text-xl md:text-2xl font-bold text-indigo-600">
                            AliceTant
                        </h1>
                        <span className="ml-2 text-sm text-gray-500 hidden sm:inline" aria-label={`${role === 'customer' ? 'Customer' : 'Provider'} Dashboard`}>
                            {role === 'customer' ? 'Customer' : 'Provider'} Dashboard
                        </span>
                    </div>
                </div>

                {/* Right section: User info + Logout */}
                <div className="flex items-center space-x-3 md:space-x-4">
                    {/* User info */}
                    <div className="flex items-center space-x-3" role="region" aria-label="User information">
                        {/* Avatar */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-semibold" aria-hidden="true">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={`${displayName}'s profile picture`}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <span>{userInitials}</span>
                            )}
                        </div>

                        {/* User name - hidden on small mobile */}
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{displayName}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                    </div>

                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        className="px-3 py-2 md:px-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        aria-label={`Logout from ${displayName}'s account`}
                    >
                        <span className="hidden sm:inline">Logout</span>
                        <svg
                            className="w-5 h-5 sm:hidden"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
