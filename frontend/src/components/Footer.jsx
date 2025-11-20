/**
 * Footer component for the application.
 * Displays copyright information and footer links.
 */
import { Link } from 'react-router-dom';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div>
                        <h3 className="text-lg font-bold text-indigo-600 mb-3">AliceTant</h3>
                        <p className="text-gray-600 text-sm">
                            Your personal booking assistant for seamless appointment scheduling.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/about" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/services" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors">
                                    Services
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/privacy" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-center text-gray-500 text-sm">
                        © {currentYear} AliceTant. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
