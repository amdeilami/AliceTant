/**
 * LoadingSpinner Component
 * 
 * Reusable loading spinner for form submissions and inline loading states.
 * 
 * Features:
 * - Multiple sizes (small, medium, large)
 * - Optional text label
 * - Customizable colors
 * - Centered or inline display
 */

const LoadingSpinner = ({
    size = 'medium',
    text = '',
    centered = false,
    className = ''
}) => {
    const sizeClasses = {
        small: 'h-4 w-4',
        medium: 'h-8 w-8',
        large: 'h-12 w-12'
    };

    const spinnerSize = sizeClasses[size] || sizeClasses.medium;

    const content = (
        <div className={`flex items-center ${centered ? 'justify-center' : ''} ${className}`}>
            <div
                className={`animate-spin rounded-full border-b-2 border-indigo-600 ${spinnerSize}`}
                role="status"
                aria-label="Loading"
            >
                <span className="sr-only">Loading...</span>
            </div>
            {text && (
                <span className="ml-3 text-gray-600">{text}</span>
            )}
        </div>
    );

    if (centered) {
        return (
            <div className="flex items-center justify-center py-12">
                {content}
            </div>
        );
    }

    return content;
};

export default LoadingSpinner;
