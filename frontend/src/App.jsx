/**
 * Main App component with routing.
 * 
 * Provides authentication context, theme context, and defines all application routes.
 * Includes protected routes for customer and provider dashboards.
 * Wraps application with ErrorBoundary, ToastProvider, and ThemeProvider
 * for global error handling, notifications, and dark/light theme support.
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';
import AnnouncementBanner from './components/AnnouncementBanner';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import CustomerDashboard from './pages/CustomerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BusinessPage from './pages/BusinessPage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <AnnouncementBanner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />

                {/* Protected routes - Customer Dashboard */}
                <Route
                  path="/dashboard/customer"
                  element={
                    <ProtectedRoute requiredRole="customer">
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Business detail page (customer) */}
                <Route
                  path="/business/:id"
                  element={
                    <ProtectedRoute requiredRole="customer">
                      <BusinessPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected routes - Provider Dashboard */}
                <Route
                  path="/dashboard/provider"
                  element={
                    <ProtectedRoute requiredRole="provider">
                      <ProviderDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
            {/* Theme toggle visible on all pages regardless of auth */}
            <ThemeToggle />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
