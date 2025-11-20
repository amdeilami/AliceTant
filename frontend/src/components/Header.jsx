/**
 * Header component for the application.
 * Displays the site logo/name and navigation links.
 */
import { Link } from 'react-router-dom';

function Header() {
    return (
        <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
                            AliceTant
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        <Link
                            to="/"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            to="/about"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            About
                        </Link>
                        <Link
                            to="/services"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Services
                        </Link>
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/login"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
