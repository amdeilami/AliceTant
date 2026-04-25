/**
 * AppointmentManagement Component
 * 
 * Provider interface for viewing and managing appointments across all businesses.
 * 
 * Features:
 * - Fetches appointments via /appointments/ ViewSet (auto-filtered by provider role)
 * - Sorts appointments (upcoming first, then chronologically)
 * - Displays customer name, email, business name, date, time, status, and notes
 * - Cancel appointment with confirmation dialog
 * - Reschedule appointment (change date/time) with inline form
 * - Status filter tabs (All / Active / Cancelled)
 * - Handles loading, error, and empty states
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
    const [actionError, setActionError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    const [rescheduleId, setRescheduleId] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
    const [reschedulingId, setReschedulingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchAppointments();
    }, []);

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

            setAppointments(sortAppointments(response.data));
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError(err.response?.data?.error || 'Failed to load appointments');
        } finally {
            setIsLoading(false);
        }
    };

    const sortAppointments = (appts) => {
        const now = new Date();
        return [...appts].sort((a, b) => {
            const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
            const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
            const isUpA = dateA >= now && a.status === 'ACTIVE';
            const isUpB = dateB >= now && b.status === 'ACTIVE';
            if (isUpA && !isUpB) return -1;
            if (!isUpA && isUpB) return 1;
            return isUpA ? dateA - dateB : dateB - dateA;
        });
    };

    // --- Cancel ---
    const handleCancelClick = (appointment) => {
        setAppointmentToCancel(appointment);
        setShowCancelDialog(true);
        setActionError(null);
    };

    const handleCancelDialogClose = () => {
        setShowCancelDialog(false);
        setAppointmentToCancel(null);
    };

    const handleCancelConfirm = async () => {
        if (!appointmentToCancel) return;
        setCancellingId(appointmentToCancel.id);
        setShowCancelDialog(false);
        setActionError(null);

        try {
            const token = localStorage.getItem('authToken');
            await api.post(`/appointments/${appointmentToCancel.id}/cancel/`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAppointments(prev =>
                sortAppointments(prev.map(apt =>
                    apt.id === appointmentToCancel.id ? { ...apt, status: 'CANCELLED' } : apt
                ))
            );
        } catch (err) {
            setActionError(err.response?.data?.error || 'Failed to cancel appointment');
        } finally {
            setCancellingId(null);
            setAppointmentToCancel(null);
        }
    };

    // --- Reschedule ---
    const handleRescheduleClick = (appointment) => {
        setRescheduleId(appointment.id);
        setRescheduleData({
            date: appointment.appointment_date,
            time: appointment.appointment_time.slice(0, 5) // HH:MM
        });
        setActionError(null);
    };

    const handleRescheduleCancel = () => {
        setRescheduleId(null);
        setRescheduleData({ date: '', time: '' });
    };

    const handleRescheduleSubmit = async (appointmentId) => {
        setReschedulingId(appointmentId);
        setActionError(null);

        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post(`/appointments/${appointmentId}/reschedule/`, {
                appointment_date: rescheduleData.date,
                appointment_time: rescheduleData.time
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setAppointments(prev =>
                sortAppointments(prev.map(apt => apt.id === appointmentId ? response.data : apt))
            );
            setRescheduleId(null);
            setRescheduleData({ date: '', time: '' });
        } catch (err) {
            setActionError(err.response?.data?.error || 'Failed to reschedule appointment');
        } finally {
            setReschedulingId(null);
        }
    };

    // --- Helpers ---
    const getStatusStyle = (s) => {
        const styles = {
            ACTIVE: 'bg-green-100 text-green-800 border-green-200',
            CANCELLED: 'bg-red-100 text-red-800 border-red-200',
        };
        return styles[s] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusLabel = (s) => {
        const labels = { ACTIVE: 'Active', CANCELLED: 'Cancelled' };
        return labels[s] || s;
    };

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

    const isActive = (apt) => apt.status === 'ACTIVE';

    const filteredAppointments = statusFilter === 'all'
        ? appointments
        : appointments.filter(a => a.status === statusFilter);

    // --- Loading ---
    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h2>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading appointments...</span>
                </div>
            </div>
        );
    }

    // --- Error ---
    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                    <button onClick={fetchAppointments} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 underline">
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // --- Empty ---
    if (appointments.length === 0) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h2>
                <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
                    <p className="text-gray-600">
                        Once customers book with your businesses, their appointments will appear here.
                    </p>
                </div>
            </div>
        );
    }

    // --- Main ---
    return (
        <div className={`bg-white rounded-lg shadow p-4 sm:p-6 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Appointments ({appointments.length})
                </h2>
                {/* Status filter tabs */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'ACTIVE', label: 'Active' },
                        { key: 'CANCELLED', label: 'Cancelled' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3 py-1.5 transition-colors ${
                                statusFilter === tab.key
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action error banner */}
            {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-red-700">{actionError}</p>
                        <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 text-sm ml-2">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No {statusFilter !== 'all' ? statusFilter.toLowerCase() : ''} appointments found.
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {filteredAppointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            className={`border rounded-lg p-3 sm:p-4 transition-shadow hover:shadow-md ${
                                appointment.status === 'CANCELLED' ? 'border-gray-200 opacity-70' : 'border-gray-200'
                            }`}
                        >
                            {/* Header: Business name + status */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    {appointment.business_name}
                                </h3>
                                <span className={`self-start sm:self-auto mt-1 sm:mt-0 px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusStyle(appointment.status)}`}>
                                    {getStatusLabel(appointment.status)}
                                </span>
                            </div>

                            {/* Details grid */}
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

                            {/* Notes */}
                            {appointment.notes && (
                                <div className="mt-2 text-sm text-gray-500 italic">
                                    <span className="font-medium not-italic text-gray-600">Notes:</span> {appointment.notes}
                                </div>
                            )}

                            {/* Reschedule inline form */}
                            {rescheduleId === appointment.id && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900 mb-2">Reschedule Appointment</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-blue-800 mb-1">New Date</label>
                                            <input
                                                type="date"
                                                value={rescheduleData.date}
                                                onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-1.5 border border-blue-300 rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-blue-800 mb-1">New Time</label>
                                            <input
                                                type="time"
                                                value={rescheduleData.time}
                                                onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                                                className="w-full px-3 py-1.5 border border-blue-300 rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleRescheduleSubmit(appointment.id)}
                                            disabled={reschedulingId === appointment.id}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            {reschedulingId === appointment.id ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={handleRescheduleCancel}
                                            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            {isActive(appointment) && rescheduleId !== appointment.id && (
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => handleRescheduleClick(appointment)}
                                        className="flex-1 px-3 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                                    >
                                        Reschedule
                                    </button>
                                    <button
                                        onClick={() => handleCancelClick(appointment)}
                                        disabled={cancellingId === appointment.id}
                                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
                                    >
                                        {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Cancel Confirmation Dialog */}
            {showCancelDialog && appointmentToCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Appointment</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to cancel the appointment with{' '}
                            <span className="font-medium">{(appointmentToCancel.customer_names || []).join(', ')}</span>{' '}
                            on {formatDate(appointmentToCancel.appointment_date)} at {formatTime(appointmentToCancel.appointment_time)}?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelDialogClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Keep Appointment
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
