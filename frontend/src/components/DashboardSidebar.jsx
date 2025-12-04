/**
 * DashboardSidebar Component
 * 
 * Navigation sidebar with role-specific menu items.
 * 
 * Features:
 * - Role-specific navigation menu (customer vs provider)
 * - Active section highlighting
 * - Collapsible on mobile devices
 * - Smooth transitions
 * - Keyboard accessible
 * 
 * @param {Object} props - Component props
 * @param {string} props.role - User role ('customer' or 'provider')
 * @param {string} props.activeSection - Currently active section
 * @param {Function} props.onNavigate - Callback when navigation item is clicked
 * @param {boolean} props.isOpen - Sidebar open state (for mobile)
 * @param {Function} props.onClose - Callback to close sidebar
 */

const DashboardSidebar = ({ role, activeSection, onNavigate, isOpen, onClose }) => {
    // Define navigation items based on role
    const customerNavItems = [
        {
            id: 'home',
            label: 'Home',
            icon: (
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            id: 'search',
            label: 'Search Providers',
            icon: (
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
        },
        {
            id: 'appointments',
            label: 'My Appointments',
            icon: (
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: (
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
    ];

    const providerNavItems = [
        {
            id: 'home',
            label: 'Home',
            icon: (
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            id: 'businesses',
            label: 'My Businesses',
            icon: (
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
        },
        {
            id: 'availability',
            label: 'Availability',
            icon: (
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            id: 'appointments',
            label: 'Appointments',
            icon: (
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            id: 'history',
            label: 'History',
            icon: (
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    const navItems = role === 'customer' ? customerNavItems : providerNavItems;

    /**
     * Handle navigation item click
     * @param {string} sectionId - Section identifier
     */
    const handleNavClick = (sectionId) => {
        onNavigate(sectionId);
    };

    return (
        <>
            {/* Sidebar - Fixed on desktop, slide-in on mobile */}
            <aside
                id="dashboard-sidebar"
                className={`
                    fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg z-30
                    transform transition-transform duration-300 ease-in-out
                    md:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                aria-label={`${role === 'customer' ? 'Customer' : 'Provider'} dashboard navigation`}
                role="navigation"
            >
                <nav className="h-full overflow-y-auto py-4">
                    <ul className="space-y-1 px-3" role="list">
                        {navItems.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <li key={item.id} role="listitem">
                                    <button
                                        onClick={() => handleNavClick(item.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleNavClick(item.id);
                                            }
                                        }}
                                        className={`
                                            w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                                            transition-colors duration-200
                                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                                            ${isActive
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }
                                        `}
                                        aria-current={isActive ? 'page' : undefined}
                                        aria-label={`Navigate to ${item.label}`}
                                        type="button"
                                    >
                                        <span className={isActive ? 'text-white' : 'text-gray-500'} aria-hidden="true">
                                            {item.icon}
                                        </span>
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default DashboardSidebar;
