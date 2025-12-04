/**
 * AppointmentManagement Component
 * 
 * Provider interface for viewing and managing appointments across all businesses.
 * Displays appointment details including customer information, business, date, time, and status.
 * 
 * Features:
 * - Fetches appointments from API for all provider's businesses
 * - Sorts appointments (upcoming first, then chronologically)
 * - Displays customer name, email, business name, date, time, and status
 * - Cancel appointment functionality with confirmation dialog
 * - Updates appointment status after cancellation
 * - Handles loading and error states
 * - Shows empty state when no appointments exist
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 */
import { useState, useEffect } from 'react';
import api from '../utils/api';

const AppointmentManagement = ({ className = '' }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);

    /**
     * Fetch provider appointments from the API on component mount.
     */
    useEffect(() => {
        fetchAppointments();
    }, []);

    /**
     * Fetch appointments from the API.
     */
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

            // Sort appointments: upcoming first, then chronologically
            const sortedAppointments = sortAppointments(response.data);
            setAppointments(sortedAppointments);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load appointments');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Sort appointments with upcoming appointments first, then chronologically.
     * 
     * @param {Array} appointments - Array of appointment objects
     * @returns {Array} Sorted appointments
     */
    const sortAppointments = (appointments) => {
        const now = new Date();

        return [...appointments].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);

            const isUpcomingA = dateA >= now && a.status !== 'completed' && a.status !== 'cancelled';
            const isUpcomingB = dateB >= now && b.status !== 'completed' && b.status !== 'cancelled';

            // Upcoming appointments come first
            if (isUpcomingA && !isUpcomingB) return -1;
            if (!isUpcomingA && isUpcomingB) return 1;

            // Within same category (upcoming or past), sort chronologically
            // Upcoming: earliest first, Past: most recent first
            if (isUpcomingA) {
                return dateA - dateB; // Ascending for upcoming
            } else {
                return dateB - dateA; // Descending for past
            }
        });
    };

    /**
     * Open cancel confirmation dialog.
     * 
     * @param {Object} appointment - Appointment to cancel
     */
    const handleCancelClick = (appointment) => {
        setAppointmentToCancel(appointment);
        setShowCancelDialog(true);
    };

    /**
     * Close cancel confirmation dialog.
     */
    const handleCancelDialogClose = () => {
        setShowCancelDialog(false);
        setAppointmentToCancel(null);
    };

    /**
     * Confirm and execute appointment cancellation.
     */
    const handleCancelConfirm = async () => {
        if (!appointmentToCancel) return;

        setCancellingId(appointmentToCancel.id);
        setShowCancelDialog(false);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            await api.post(`/appointments/${appointmentToCancel.id}/cancel/`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Update appointment status in local state
            setAppointments(prevAppointments =>
                prevAppointments.map(apt =>
                    apt.id === appointmentToCancel.id
                        ? { ...apt, status: 'cancelled' }
                        : apt
                )
            );

            // Re-sort appointments after status update
            setAppointments(prevAppointments => sortAppointments(prevAppointments));
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel appointment');
        } finally {
            setCancellingId(null);
            setAppointmentToCancel(null);
        }
    };

    /**
     * Get status badge styling based on appointment status.
     * 
     * @param {string} status - Appointment status
     * @returns {Object} CSS classes for status badge
     */
    const getStatusStyle = (status) => {
        const styles = {
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            completed: 'bg-gray-100 text-gray-800 border-gray-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
        };

        return styles[status] || styles.confirmed;
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
     * Check if appointment can be cancelled.
     * 
     * @param {Object} appointment - Appointment object
     * @returns {boolean} True if appointment can be cancelled
     */
    const canCancelAppointment = (appointment) => {
        return appointment.status === 'confirmed';
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment Management</h2>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading appointments...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment Management</h2>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment Management</h2>
                <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
                    <p className="text-gray-600">You don't have any appointments. Set up your availability to start accepting bookings!</p>
                </div>
            </div>
        );
    }

    // Appointments list
    return (
        <div className={`bg-white rounded-lg shadow p-4 sm:p-6 ${className}`}>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Appointment Management</h2>

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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>{appointment.customerName}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span>{appointment.customerEmail}</span>
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

                            {/* Actions */}
                            {canCancelAppointment(appointment) && (
                                <div className="mt-3 sm:mt-4">
                                    <button
                                        onClick={() => handleCancelClick(appointment)}
                                        disabled={cancellingId === appointment.id}
                                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                                    >
                                        {cancellingId === appointment.id ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Cancelling...
                                            </span>
                                        ) : (
                                            'Cancel Appointment'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Cancel Confirmation Dialog */}
            {showCancelDialog && appointmentToCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Cancel Appointment
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to cancel the appointment with {appointmentToCancel.customerName} on {formatDate(appointmentToCancel.date)} at {formatTime(appointmentToCancel.time)}?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelDialogClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                                Keep Appointment
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentManagement;
