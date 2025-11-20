/**
 * Layout component that wraps pages with Header and Footer.
 * Provides consistent structure across all pages.
 * 
 * Props:
 *   children: React nodes to be rendered in the main content area
 */
import Header from './Header';
import Footer from './Footer';

function Layout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default Layout;
