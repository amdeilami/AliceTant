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
import { maskReferenceId } from '../utils/formatId';
import api from '../utils/api';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorDisplay from './ErrorDisplay';

const AppointmentHistory = ({ className = '' }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit modal state
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAppointments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');
            const response = await api.get('/appointments/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAppointments(sortAppointments(response.data));
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError(err.response?.data?.message || 'Failed to load appointments');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAppointments(); }, []);

    const sortAppointments = (appts) => {
        const now = new Date();
        return [...appts].sort((a, b) => {
            const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
            const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
            const isUpA = dateA >= now;
            const isUpB = dateB >= now;
            if (isUpA && !isUpB) return -1;
            if (!isUpA && isUpB) return 1;
            return isUpA ? dateA - dateB : dateB - dateA;
        });
    };

    const getStatusStyle = (status) => {
        const styles = {
            ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
            CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
            PENDING_MOD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
        };
        return styles[status] || styles.ACTIVE;
    };

    const getStatusLabel = (status) => {
        const labels = { ACTIVE: 'Active', CANCELLED: 'Cancelled', PENDING_MOD: 'Pending Modification' };
        return labels[status] || status;
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${minutes} ${ampm}`;
    };

    const handleCancel = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            const token = localStorage.getItem('authToken');
            await api.post(`/appointments/${appointmentId}/cancel/`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchAppointments();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to cancel appointment');
        }
    };

    const openEditModal = (appt) => {
        setEditingAppointment(appt);
        setEditDate(appt.appointment_date);
        setEditTime(appt.appointment_time?.slice(0, 5));
        setEditEndTime(appt.end_time?.slice(0, 5) || '');
        setEditNotes(appt.notes || '');
    };

    const handleProposeModification = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            await api.post(`/appointments/${editingAppointment.id}/propose-modification/`, {
                appointment_date: editDate,
                appointment_time: editTime,
                end_time: editEndTime || undefined,
                notes: editNotes,
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            setEditingAppointment(null);
            fetchAppointments();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to propose modification');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRespondModification = async (appointmentId, modificationId, approve) => {
        const action = approve ? 'approve' : 'reject';
        if (!window.confirm(`Are you sure you want to ${action} this modification?`)) return;
        try {
            const token = localStorage.getItem('authToken');
            await api.post(`/appointments/${appointmentId}/respond-modification/`, {
                modification_id: modificationId,
                approve,
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            fetchAppointments();
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${action} modification`);
        }
    };

    if (isLoading) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Appointments</h2>
                <LoadingSkeleton.ListItem count={3} />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Appointments</h2>
                <ErrorDisplay message={error} onRetry={fetchAppointments} />
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Appointments</h2>
                <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No appointments yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">Search for businesses to book your first appointment!</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 ${className}`}>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">My Appointments</h2>

            <ul className="space-y-3 sm:space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto" role="list">
                {appointments.map((appt) => {
                    const isUpcoming = new Date(`${appt.appointment_date}T${appt.appointment_time}`) > new Date();
                    const canModify = isUpcoming && (appt.status === 'ACTIVE' || appt.status === 'PENDING_MOD');
                    const canCancel = isUpcoming && (appt.status === 'ACTIVE' || appt.status === 'PENDING_MOD');
                    const pendingMod = appt.pending_modification;
                    // Customer should see approve/reject if modification was proposed by provider
                    const canRespondToMod = pendingMod && pendingMod.proposed_by === 'PROVIDER';

                    return (
                        <li key={appt.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                            <article className="flex flex-col">
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-0">
                                            {appt.business_name}
                                        </h3>
                                        <span className="font-mono text-xs text-gray-400 dark:text-gray-500 ml-2" title={`Ref: ${appt.reference_id}`}>#{maskReferenceId(appt.reference_id)}</span>
                                        <span className={`self-start sm:ml-3 px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(appt.status)}`}>
                                            {getStatusLabel(appt.status)}
                                        </span>
                                    </div>

                                    <dl className="space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <dd><time dateTime={appt.appointment_date}>{formatDate(appt.appointment_date)}</time></dd>
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <dd>
                                                <time>{formatTime(appt.appointment_time)}{appt.end_time && ` — ${formatTime(appt.end_time)}`}</time>
                                            </dd>
                                        </div>
                                        {appt.notes && (
                                            <div className="flex items-start">
                                                <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <dd className="italic">{appt.notes}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Pending modification banner */}
                                {pendingMod && (
                                    <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
                                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                                            {pendingMod.proposed_by === 'PROVIDER'
                                                ? 'Provider proposed a change:'
                                                : appt.status === 'CANCELLED'
                                                    ? 'You had proposed a change:'
                                                    : 'You proposed a change (waiting for provider):'}
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                            New date: {formatDate(pendingMod.new_date)} at {formatTime(pendingMod.new_time)}
                                            {pendingMod.new_end_time && ` — ${formatTime(pendingMod.new_end_time)}`}
                                        </p>
                                        {pendingMod.new_notes && (
                                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Notes: {pendingMod.new_notes}</p>
                                        )}
                                        {canRespondToMod && (
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleRespondModification(appt.id, pendingMod.id, true)}
                                                    className="px-3 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRespondModification(appt.id, pendingMod.id, false)}
                                                    className="px-3 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action buttons */}
                                {(canCancel || canModify) && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        {canModify && (
                                            <button
                                                onClick={() => openEditModal(appt)}
                                                className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 transition-colors"
                                            >
                                                Modify
                                            </button>
                                        )}
                                        {canCancel && (
                                            <button
                                                onClick={() => handleCancel(appt.id)}
                                                className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                )}
                            </article>
                        </li>
                    );
                })}
            </ul>

            {/* Modification Modal */}
            {editingAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Propose Modification
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Changes must be approved by the provider before taking effect.
                        </p>
                        <form onSubmit={handleProposeModification} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={editTime}
                                        onChange={(e) => setEditTime(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={editEndTime}
                                        onChange={(e) => setEditEndTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingAppointment(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Propose Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentHistory;
