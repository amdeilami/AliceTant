/**
 * ToastTest Component
 * 
 * Test component for demonstrating toast notifications.
 * This is for development/testing purposes only.
 */
import { useToast } from '../contexts/ToastContext';

const ToastTest = () => {
    const { showSuccess, showError, showInfo, showWarning } = useToast();

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Toast Notification Test</h2>
            <p className="text-gray-600 mb-6">Click the buttons below to test different toast types:</p>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => showSuccess('This is a success message!')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    Show Success
                </button>

                <button
                    onClick={() => showError('This is an error message!')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Show Error
                </button>

                <button
                    onClick={() => showInfo('This is an info message!')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Show Info
                </button>

                <button
                    onClick={() => showWarning('This is a warning message!')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                    Show Warning
                </button>
            </div>
        </div>
    );
};

export default ToastTest;
