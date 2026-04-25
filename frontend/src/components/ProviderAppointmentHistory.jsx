/**
 * ProviderAppointmentHistory Component
 * 
 * Displays a list of past/cancelled appointments for providers.
 * 
 * Features:
 * - Fetches appointments via /appointments/ ViewSet (auto-filtered by provider role)
 * - Filters for past or cancelled appointments
 * - Sorts by date descending (newest first)
 * - Displays customer name, email, date, time, business name, and status
 * - Handles loading, error, and empty states
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
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Filter for past or cancelled appointments
                const now = new Date();
                const pastAppointments = response.data.filter(apt => {
                    const aptDate = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
                    return aptDate < now || apt.status === 'CANCELLED';
                });

                // Sort newest first
                pastAppointments.sort((a, b) => {
                    const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
                    const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
                    return dateB - dateA;
                });

                setAppointments(pastAppointments);
            } catch (err) {
                console.error('Error fetching appointment history:', err);
                setError(err.response?.data?.error || 'Failed to load appointment history');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const formatDate = (dateString) => {
        const d = new Date(dateString + 'T00:00:00');
        return d.toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${minutes} ${ampm}`;
    };

    const getStatusStyle = (s) => {
        const styles = {
            ACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
            CANCELLED: 'bg-red-100 text-red-800 border-red-200',
        };
        return styles[s] || styles.ACTIVE;
    };

    const getStatusLabel = (s) => {
        const labels = { ACTIVE: 'Past', CANCELLED: 'Cancelled' };
        return labels[s] || s;
    };

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

    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment History</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment History</h2>
                <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No past appointments</h3>
                    <p className="text-gray-600">Past and cancelled appointments will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow p-4 sm:p-6 ${className}`}>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                Appointment History ({appointments.length})
            </h2>

            <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {appointments.map((appointment) => (
                    <div
                        key={appointment.id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow opacity-80"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                {appointment.business_name}
                            </h3>
                            <span className={`self-start sm:self-auto mt-1 sm:mt-0 px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusStyle(appointment.status)}`}>
                                {getStatusLabel(appointment.status)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{(appointment.customer_names || []).join(', ') || 'No customer'}</span>
                            </div>

                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{(appointment.customer_emails || []).join(', ') || '—'}</span>
                            </div>

                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDate(appointment.appointment_date)}</span>
                            </div>

                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    {formatTime(appointment.appointment_time)}
                                    {appointment.end_time && ` — ${formatTime(appointment.end_time)}`}
                                </span>
                            </div>
                        </div>

                        {appointment.notes && (
                            <div className="mt-2 text-sm text-gray-500 italic">
                                <span className="font-medium not-italic text-gray-600">Notes:</span> {appointment.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProviderAppointmentHistory;
