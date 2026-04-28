import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import AdminActionModal from './AdminActionModal';
import AdminPaginationControls from './AdminPaginationControls';

const AdminAppointmentManagement = () => {
  const { showError, showSuccess } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [businessId, setBusinessId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [pendingCancelAppointmentId, setPendingCancelAppointmentId] = useState(null);
  const [cancelReason, setCancelReason] = useState('Administrative cancellation');
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);

  const fetchAppointments = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (search) params.q = search;
      if (businessId) params.business_id = businessId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      params.page = nextPage;
      const response = await api.get('/admin/appointments/', { params });
      setAppointments(response.data.results || []);
      setPage(response.data.page || 1);
      setNumPages(response.data.num_pages || 1);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await api.get('/admin/businesses/', { params: { page_size: 100 } });
        setBusinesses(response.data.results || []);
      } catch (error) {
        showError(error.response?.data?.error || 'Failed to load businesses');
      }
    };

    fetchBusinesses();
    fetchAppointments();
  }, []);

  const forceCancel = async () => {
    if (!pendingCancelAppointmentId) {
      return;
    }

    try {
      await api.post(`/admin/appointments/${pendingCancelAppointmentId}/force-cancel/`, { reason: cancelReason });
      showSuccess('Appointment cancelled');
      setPendingCancelAppointmentId(null);
      setCancelReason('Administrative cancellation');
      fetchAppointments(page);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div className="flex flex-col md:flex-row gap-3 md:items-end mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="Business, customer, or notes" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Business</label>
          <select value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <option value="">All</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>{business.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_MOD">Pending Modification</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start date</label>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End date</label>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
        </div>
        <button type="button" onClick={() => fetchAppointments(1)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Apply</button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No appointments found.</p>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{appointment.business_name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{(appointment.customer_names || []).join(', ') || 'No customers'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(appointment.customer_emails || []).join(', ') || 'No customer emails recorded'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{appointment.appointment_date} {appointment.appointment_time}{appointment.end_time ? ` - ${appointment.end_time}` : ''}</p>
                  {appointment.notes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{appointment.notes}</p>}
                  {appointment.pending_modification && (
                    <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Pending modification proposed by {appointment.pending_modification.proposed_by.toLowerCase()} for {appointment.pending_modification.new_date} {appointment.pending_modification.new_time}{appointment.pending_modification.new_end_time ? ` - ${appointment.pending_modification.new_end_time}` : ''}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : appointment.status === 'PENDING_MOD' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                    {appointment.status}
                  </span>
                  {appointment.status !== 'CANCELLED' && (
                    <button type="button" onClick={() => setPendingCancelAppointmentId(appointment.id)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Force Cancel</button>
                  )}
                  <button type="button" onClick={() => setExpandedAppointmentId(expandedAppointmentId === appointment.id ? null : appointment.id)} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">{expandedAppointmentId === appointment.id ? 'Hide Details' : 'View Details'}</button>
                </div>
              </div>
              {expandedAppointmentId === appointment.id && (
                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Participants</p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {(appointment.customer_names || []).map((name, index) => (
                        <li key={`${appointment.id}-customer-${index}`}>{name} <span className="text-gray-500 dark:text-gray-400">({appointment.customer_emails?.[index] || 'No email'})</span></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">History</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <p>Created: {new Date(appointment.created_at).toLocaleString()}</p>
                      <p>Updated: {new Date(appointment.updated_at).toLocaleString()}</p>
                      <p>Current status: {appointment.status}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <AdminPaginationControls page={page} numPages={numPages} onPrevious={() => fetchAppointments(page - 1)} onNext={() => fetchAppointments(page + 1)} />
      <AdminActionModal
        isOpen={Boolean(pendingCancelAppointmentId)}
        title="Force Cancel Appointment"
        description="This immediately marks the appointment as cancelled across the platform."
        confirmLabel="Force Cancel"
        confirmDisabled={!cancelReason.trim()}
        value={cancelReason}
        valueLabel="Cancellation reason"
        valuePlaceholder="Explain why this appointment is being cancelled"
        onValueChange={setCancelReason}
        onClose={() => {
          setPendingCancelAppointmentId(null);
          setCancelReason('Administrative cancellation');
        }}
        onConfirm={forceCancel}
      />
    </div>
  );
};

export default AdminAppointmentManagement;