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
import { maskReferenceId } from '../utils/formatId';
import api from '../utils/api';

const AppointmentManagement = ({ className = '' }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    // Propose modification modal state (provider proposes)
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchAppointments(); }, []);

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
            const isUpA = dateA >= now && a.status !== 'CANCELLED';
            const isUpB = dateB >= now && b.status !== 'CANCELLED';
            if (isUpA && !isUpB) return -1;
            if (!isUpA && isUpB) return 1;
            return isUpA ? dateA - dateB : dateB - dateA;
        });
    };

    // --- Cancel ---
    const handleCancelClick = (appt) => { setAppointmentToCancel(appt); setShowCancelDialog(true); setActionError(null); };
    const handleCancelDialogClose = () => { setShowCancelDialog(false); setAppointmentToCancel(null); };
    const handleCancelConfirm = async () => {
        if (!appointmentToCancel) return;
        setCancellingId(appointmentToCancel.id);
        setShowCancelDialog(false);
        setActionError(null);
        try {
            const token = localStorage.getItem('authToken');
            await api.post(`/appointments/${appointmentToCancel.id}/cancel/`, {}, { headers: { 'Authorization': `Bearer ${token}` } });
            fetchAppointments();
        } catch (err) {
            setActionError(err.response?.data?.error || 'Failed to cancel appointment');
        } finally {
            setCancellingId(null);
            setAppointmentToCancel(null);
        }
    };

    // --- Propose modification (provider side) ---
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

    // --- Respond to customer modification ---
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

    // --- Helpers ---
    const getStatusStyle = (s) => ({
        ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
        CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
        PENDING_MOD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    })[s] || 'bg-gray-100 text-gray-800 border-gray-200';

    const getStatusLabel = (s) => ({ ACTIVE: 'Active', CANCELLED: 'Cancelled', PENDING_MOD: 'Pending Modification' })[s] || s;

    const formatDate = (ds) => new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const formatTime = (ts) => { const [h, m] = ts.split(':'); const hr = parseInt(h, 10); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };

    const isModifiable = (apt) => {
        const isUpcoming = new Date(`${apt.appointment_date}T${apt.appointment_time}`) > new Date();
        return isUpcoming && (apt.status === 'ACTIVE' || apt.status === 'PENDING_MOD');
    };

    const filteredAppointments = statusFilter === 'all'
        ? appointments
        : appointments.filter(a => a.status === statusFilter);

    if (isLoading) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Appointments</h2>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading appointments...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Appointments</h2>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                    <button onClick={fetchAppointments} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Try again</button>
                </div>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Appointments</h2>
                <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No appointments yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">Once customers book with your businesses, their appointments will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Appointments ({appointments.length})
                </h2>
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
                    {[{ key: 'all', label: 'All' }, { key: 'ACTIVE', label: 'Active' }, { key: 'PENDING_MOD', label: 'Pending' }, { key: 'CANCELLED', label: 'Cancelled' }].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3 py-1.5 transition-colors ${statusFilter === tab.key ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {actionError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-red-700 dark:text-red-300">{actionError}</p>
                        <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 text-sm ml-2">Dismiss</button>
                    </div>
                </div>
            )}

            {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No {statusFilter !== 'all' ? getStatusLabel(statusFilter).toLowerCase() : ''} appointments found.
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {filteredAppointments.map((appt) => {
                        const pendingMod = appt.pending_modification;
                        const canRespondToMod = pendingMod && pendingMod.proposed_by === 'CUSTOMER';

                        return (
                            <div key={appt.id} className={`border rounded-lg p-3 sm:p-4 transition-shadow hover:shadow-md ${appt.status === 'CANCELLED' ? 'border-gray-200 dark:border-gray-700 opacity-70' : 'border-gray-200 dark:border-gray-700'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{appt.business_name}</h3>
                                    <span className="font-mono text-xs text-gray-400 dark:text-gray-500 ml-2" title={`Ref: ${appt.reference_id}`}>#{maskReferenceId(appt.reference_id)}</span>
                                    <span className={`self-start sm:self-auto mt-1 sm:mt-0 px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusStyle(appt.status)}`}>
                                        {getStatusLabel(appt.status)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <span>{(appt.customer_names || []).join(', ') || 'No customer'}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        <span>{(appt.customer_emails || []).join(', ') || '—'}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span>{formatDate(appt.appointment_date)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>{formatTime(appt.appointment_time)}{appt.end_time && ` — ${formatTime(appt.end_time)}`}</span>
                                    </div>
                                </div>

                                {appt.notes && (
                                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                        <span className="font-medium not-italic text-gray-600 dark:text-gray-300">Notes:</span> {appt.notes}
                                    </div>
                                )}

                                {/* Pending modification banner */}
                                {pendingMod && (
                                    <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
                                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                                            {pendingMod.proposed_by === 'CUSTOMER' ? 'Customer proposed a change:' : 'You proposed a change (waiting for customer):'}
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                            New date: {formatDate(pendingMod.new_date)} at {formatTime(pendingMod.new_time)}
                                            {pendingMod.new_end_time && ` — ${formatTime(pendingMod.new_end_time)}`}
                                        </p>
                                        {pendingMod.new_notes && <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Notes: {pendingMod.new_notes}</p>}
                                        {canRespondToMod && (
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => handleRespondModification(appt.id, pendingMod.id, true)} className="px-3 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700">Approve</button>
                                                <button onClick={() => handleRespondModification(appt.id, pendingMod.id, false)} className="px-3 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700">Reject</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action buttons */}
                                {isModifiable(appt) && (
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => openEditModal(appt)}
                                            className="flex-1 px-3 py-2 border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-sm font-medium"
                                        >
                                            Propose Change
                                        </button>
                                        {appt.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => handleCancelClick(appt)}
                                                disabled={cancellingId === appt.id}
                                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
                                            >
                                                {cancellingId === appt.id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Cancel Confirmation Dialog */}
            {showCancelDialog && appointmentToCancel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cancel Appointment</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to cancel the appointment with{' '}
                            <span className="font-medium">{(appointmentToCancel.customer_names || []).join(', ')}</span>{' '}
                            on {formatDate(appointmentToCancel.appointment_date)} at {formatTime(appointmentToCancel.appointment_time)}?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={handleCancelDialogClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Keep Appointment</button>
                            <button onClick={handleCancelConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Yes, Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Propose Modification Modal */}
            {editingAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Propose Modification</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Changes must be approved by the customer before taking effect.</p>
                        <form onSubmit={handleProposeModification} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                                    <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                                    <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setEditingAppointment(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Propose Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentManagement;
