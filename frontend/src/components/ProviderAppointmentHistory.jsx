/**
 * ProviderAppointmentHistory Component
 * 
 * Displays a list of past appointments for providers.
 * Shows customer details, appointment date/time, and business name.
 * 
 * Features:
 * - Fetches past appointments from API
 * - Sorts appointments by date in descending order (newest first)
 * - Displays customer name, date, time, and business name
 * - Shows empty state when no past appointments exist
 * - Handles loading and error states
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 */
import { useState, useEffect } from 'react';
import api from '../utils/api';

const ProviderAppointmentHistory = ({ className = '' }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Fetch appointments from the API on component mount.
     */
    useEffect(() => {
        const fetchAppointments = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await api.get('/appointments/provider/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Filter for past appointments only (completed or cancelled)
                const pastAppointments = response.data.filter(appointment => {
                    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
                    const now = new Date();
                    return appointmentDate < now || appointment.status === 'completed' || appointment.status === 'cancelled';
                });

                // Sort appointments by date in descending order (newest first)
                const sortedAppointments = sortAppointmentsByDate(pastAppointments);
                setAppointments(sortedAppointments);
            } catch (err) {
                console.error('Error fetching appointment history:', err);
                setError(err.response?.data?.message || 'Failed to load appointment history');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    /**
     * Sort appointments by date in descending order (newest first).
     * 
     * @param {Array} appointments - Array of appointment objects
     * @returns {Array} Sorted appointments
     */
    const sortAppointmentsByDate = (appointments) => {
        return [...appointments].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA; // Descending order (newest first)
        });
    };

    /**
     * Format date string to readable format.
     * 
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    /**
     * Format time string to readable format.
     * 
     * @param {string} timeString - Time in HH:MM format
     * @returns {string} Formatted time
     */
    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    /**
     * Get status badge styling based on appointment status.
     * 
     * @param {string} status - Appointment status
     * @returns {Object} CSS classes for status badge
     */
    const getStatusStyle = (status) => {
        const styles = {
            completed: 'bg-gray-100 text-gray-800 border-gray-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
        };

        return styles[status] || styles.completed;
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment History</h2>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading appointment history...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment History</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (appointments.length === 0) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment History</h2>
                <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No past appointments</h3>
                    <p className="text-gray-600">You don't have any past appointments yet.</p>
                </div>
            </div>
        );
    }

    // Appointments list
    return (
        <div className={`bg-white rounded-lg shadow p-4 sm:p-6 ${className}`}>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Appointment History</h2>

            <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {appointments.map((appointment) => (
                    <div
                        key={appointment.id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex flex-col">
                            {/* Appointment Details */}
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-0">
                                        {appointment.businessName}
                                    </h3>
                                    <span className={`self-start sm:ml-3 px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(appointment.status)}`}>
                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                    </span>
                                </div>

                                <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>Customer: {appointment.customerName}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{formatDate(appointment.date)}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{formatTime(appointment.time)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProviderAppointmentHistory;
