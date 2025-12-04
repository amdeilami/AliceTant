/**
 * ProtectedRoute Component
 * 
 * Higher-order component that protects routes requiring authentication.
 * Redirects unauthenticated users to login page.
 * Redirects authenticated users to their role-specific dashboard.
 * 
 * Features:
 * - Checks authentication status before rendering protected content
 * - Redirects based on user role (customer/provider)
 * - Shows loading state while checking authentication
 * - Handles role-based access control
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute wrapper component.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Protected content to render
 * @param {string} [props.requiredRole] - Required user role ('customer' or 'provider')
 * @returns {React.ReactNode} Protected content or redirect
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    console.log('ProtectedRoute check:', { isAuthenticated, isLoading, user, requiredRole });

    // Show loading state while checking authentication
    if (isLoading) {
        console.log('ProtectedRoute: showing loading state');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        console.log('ProtectedRoute: not authenticated, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Check role-based access if requiredRole is specified
    if (requiredRole && user?.role?.toLowerCase() !== requiredRole.toLowerCase()) {
        console.log('ProtectedRoute: role mismatch, redirecting', {
            userRole: user?.role,
            requiredRole: requiredRole,
            comparison: user?.role?.toLowerCase() !== requiredRole.toLowerCase()
        });
        // Redirect to correct dashboard based on user's actual role
        const userRoleLower = user?.role?.toLowerCase();
        const redirectPath = userRoleLower === 'customer'
            ? '/dashboard/customer'
            : '/dashboard/provider';
        return <Navigate to={redirectPath} replace />;
    }

    // Render protected content
    console.log('ProtectedRoute: rendering protected content');
    return children;
};

export default ProtectedRoute;
