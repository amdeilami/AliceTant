/**
 * AppointmentHistory Component
 * 
 * Displays a list of customer appointments with sorting and filtering.
 * Shows appointment details including date, time, provider, business, and status.
 * 
 * Features:
 * - Fetches appointments from API
 * - Sorts appointments (upcoming first, then by date)
 * - Displays status indicators with color coding
 * - Shows empty state when no appointments exist
 * - Handles loading and error states
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 */
import { useState, useEffect } from 'react';
import api from '../utils/api';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorDisplay from './ErrorDisplay';

const AppointmentHistory = ({ className = '' }) => {
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

                const response = await api.get('/appointments/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                // Sort appointments: upcoming first, then by date
                const sortedAppointments = sortAppointments(response.data);
                setAppointments(sortedAppointments);
            } catch (err) {
                console.error('Error fetching appointments:', err);
                setError(err.response?.data?.message || 'Failed to load appointments');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointments();
    }, []);

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

            const isUpcomingA = dateA >= now;
            const isUpcomingB = dateB >= now;

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
     * Get status badge styling based on appointment status.
     * 
     * @param {string} status - Appointment status
     * @returns {Object} CSS classes for status badge
     */
    const getStatusStyle = (status) => {
        const styles = {
            upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            completed: 'bg-gray-100 text-gray-800 border-gray-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
        };

        return styles[status] || styles.upcoming;
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

    // Loading state
    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h2>
                <LoadingSkeleton.ListItem count={3} />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h2>
                <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
            </div>
        );
    }

    // Empty state
    if (appointments.length === 0) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h2>
                <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
                    <p className="text-gray-600">You don't have any appointments. Start by searching for providers!</p>
                </div>
            </div>
        );
    }

    // Appointments list
    return (
        <div className={`bg-white rounded-lg shadow p-4 sm:p-6 ${className}`}>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">My Appointments</h2>

            <ul className="space-y-3 sm:space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto" role="list" aria-label="Appointment list">
                {appointments.map((appointment) => (
                    <li
                        key={appointment.id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                    >
                        <article className="flex flex-col">
                            {/* Appointment Details */}
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-0">
                                        {appointment.businessName}
                                    </h3>
                                    <span
                                        className={`self-start sm:ml-3 px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(appointment.status)}`}
                                        role="status"
                                        aria-label={`Appointment status: ${appointment.status}`}
                                    >
                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                    </span>
                                </div>

                                <dl className="space-y-1 text-xs sm:text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <dt className="sr-only">Provider:</dt>
                                        <dd>Provider: {appointment.providerName}</dd>
                                    </div>

                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <dt className="sr-only">Date:</dt>
                                        <dd>
                                            <time dateTime={appointment.date}>{formatDate(appointment.date)}</time>
                                        </dd>
                                    </div>

                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <dt className="sr-only">Time:</dt>
                                        <dd>
                                            <time dateTime={appointment.time}>{formatTime(appointment.time)}</time>
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </article>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AppointmentHistory;
