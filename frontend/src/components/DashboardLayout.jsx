/**
 * DashboardLayout Component
 * 
 * Main layout wrapper for dashboard pages.
 * Provides consistent header, sidebar, and content area structure.
 * 
 * Features:
 * - Responsive layout with collapsible sidebar on mobile
 * - Role-specific navigation and features
 * - Consistent header and sidebar across all dashboard pages
 * - Mobile-first design with hamburger menu
 * - Supports controlled active section from parent component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Dashboard content to render
 * @param {string} props.role - User role ('customer' or 'provider')
 * @param {string} [props.activeSection] - Currently active section (controlled)
 * @param {Function} [props.onSectionChange] - Callback when section changes
 */
import { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';

const DashboardLayout = ({ children, role, activeSection: controlledActiveSection, onSectionChange }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [internalActiveSection, setInternalActiveSection] = useState('home');

    // Use controlled activeSection if provided, otherwise use internal state
    const activeSection = controlledActiveSection !== undefined ? controlledActiveSection : internalActiveSection;

    /**
     * Toggle sidebar visibility (primarily for mobile)
     */
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    /**
     * Handle navigation to a different section
     * @param {string} section - Section identifier
     */
    const handleNavigate = (section) => {
        // If parent provides onSectionChange, use it (controlled)
        if (onSectionChange) {
            onSectionChange(section);
        } else {
            // Otherwise use internal state (uncontrolled)
            setInternalActiveSection(section);
        }

        // Close sidebar on mobile after navigation
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Skip to main content link for keyboard navigation */}
            <a href="#main-content" className="skip-to-main">
                Skip to main content
            </a>

            {/* Header */}
            <DashboardHeader
                role={role}
                onToggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
            />

            <div className="flex">
                {/* Sidebar */}
                <DashboardSidebar
                    role={role}
                    activeSection={activeSection}
                    onNavigate={handleNavigate}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <main
                    id="main-content"
                    className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64 mt-16"
                    role="main"
                    aria-label={`${role === 'customer' ? 'Customer' : 'Provider'} dashboard main content`}
                >
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setIsSidebarOpen(false);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Close sidebar overlay"
                />
            )}
        </div>
    );
};

export default DashboardLayout;
