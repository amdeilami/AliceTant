/**
 * ToastContainer Component
 * 
 * Container for displaying multiple toast notifications.
 * Manages toast lifecycle and positioning.
 * 
 * Features:
 * - Fixed positioning in top-right corner
 * - Stacks multiple toasts vertically
 * - Handles toast removal
 * - Z-index management for proper layering
 */
import Toast from './Toast';

const ToastContainer = ({ toasts, onRemoveToast }) => {
    if (toasts.length === 0) {
        return null;
    }

    return (
        <div
            className="fixed top-4 right-4 z-50 space-y-3"
            aria-live="polite"
            aria-atomic="true"
        >
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    type={toast.type}
                    message={toast.message}
                    duration={toast.duration}
                    onClose={onRemoveToast}
                />
            ))}
        </div>
    );
};

export default ToastContainer;
