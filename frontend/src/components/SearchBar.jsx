/**
 * SearchBar Component
 * 
 * A search input component with debounced search functionality.
 * Designed for finding providers and businesses.
 * 
 * Features:
 * - Text input with search icon
 * - Debounced search to avoid excessive API calls (500ms delay)
 * - Placeholder text for user guidance
 * - Focus styling for better UX
 * - Callback function for search logic
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSearch - Callback function called with search query after debounce
 * @param {string} [props.placeholder] - Optional placeholder text for the input
 */
import { useState, useEffect, useRef } from 'react';

const SearchBar = ({ onSearch, placeholder = 'Search for providers or businesses...' }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const debounceTimerRef = useRef(null);

    /**
     * Handle input change with debouncing.
     * Clears previous timer and sets new one to call onSearch after delay.
     * 
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     */
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer for debounced search
        debounceTimerRef.current = setTimeout(() => {
            onSearch(value);
        }, 500); // 500ms debounce delay
    };

    /**
     * Cleanup: Clear debounce timer on component unmount
     */
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="w-full" role="search">
            <div className="relative">
                {/* Search Icon */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                    <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Search Input */}
                <label htmlFor="search-input" className="sr-only">
                    Search for providers or businesses
                </label>
                <input
                    id="search-input"
                    type="search"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg 
                             leading-5 bg-white placeholder-gray-500 
                             focus:outline-none focus:placeholder-gray-400 
                             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                             transition-colors duration-200
                             text-gray-900"
                    aria-label="Search for providers or businesses"
                    aria-describedby="search-description"
                    autoComplete="off"
                />
                <span id="search-description" className="sr-only">
                    Type to search for providers or businesses. Results will appear as you type.
                </span>
            </div>
        </div>
    );
};

export default SearchBar;
