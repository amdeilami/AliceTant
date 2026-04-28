import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import AdminActionModal from './AdminActionModal';
import AdminPaginationControls from './AdminPaginationControls';

const AdminBusinessManagement = () => {
  const { showError, showSuccess } = useToast();
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState('');
  const [hidden, setHidden] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [pendingHideBusiness, setPendingHideBusiness] = useState(null);
  const [hideReason, setHideReason] = useState('Administrative action');

  const fetchBusinesses = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (hidden !== '') params.is_hidden = hidden;
      params.page = nextPage;
      const response = await api.get('/admin/businesses/', { params });
      setBusinesses(response.data.results || []);
      setPage(response.data.page || 1);
      setNumPages(response.data.num_pages || 1);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const hideBusiness = async () => {
    if (!pendingHideBusiness) {
      return;
    }

    try {
      await api.post(`/admin/businesses/${pendingHideBusiness.id}/hide/`, { reason: hideReason });
      showSuccess('Business hidden');
      setPendingHideBusiness(null);
      setHideReason('Administrative action');
      fetchBusinesses(page);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update business visibility');
    }
  };

  const unhideBusiness = async (business) => {
    try {
      await api.post(`/admin/businesses/${business.id}/unhide/`);
      showSuccess('Business unhidden');
      fetchBusinesses(page);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update business visibility');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div className="flex flex-col md:flex-row gap-3 md:items-end mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="Business or provider email" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Visibility</label>
          <select value={hidden} onChange={(event) => setHidden(event.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <option value="">All</option>
            <option value="false">Visible</option>
            <option value="true">Hidden</option>
          </select>
        </div>
        <button type="button" onClick={() => fetchBusinesses(1)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Apply</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4">Business</th>
              <th className="py-2 pr-4">Provider</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Reason</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="py-4 text-gray-500 dark:text-gray-400">Loading businesses...</td></tr>
            ) : businesses.length === 0 ? (
              <tr><td colSpan="5" className="py-4 text-gray-500 dark:text-gray-400">No businesses found.</td></tr>
            ) : (
              businesses.map((business) => (
                <tr key={business.id} className="border-b border-gray-100 dark:border-gray-700/60 text-gray-700 dark:text-gray-300">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{business.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{business.email}</div>
                  </td>
                  <td className="py-3 pr-4">{business.provider_name}<div className="text-xs text-gray-500 dark:text-gray-400">{business.provider_email}</div></td>
                  <td className="py-3 pr-4">{business.is_hidden ? <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">Hidden</span> : <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">Visible</span>}</td>
                  <td className="py-3 pr-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs">{business.hidden_reason || '—'}</td>
                  <td className="py-3"><button type="button" onClick={() => business.is_hidden ? unhideBusiness(business) : setPendingHideBusiness(business)} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">{business.is_hidden ? 'Unhide' : 'Hide'}</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AdminPaginationControls page={page} numPages={numPages} onPrevious={() => fetchBusinesses(page - 1)} onNext={() => fetchBusinesses(page + 1)} />
      <AdminActionModal
        isOpen={Boolean(pendingHideBusiness)}
        title="Hide Business"
        description="Hidden businesses disappear from public discovery, but stay visible to admins and their owners."
        confirmLabel="Hide Business"
        confirmDisabled={!hideReason.trim()}
        value={hideReason}
        valueLabel="Hide reason"
        valuePlaceholder="Explain why this business is being hidden"
        onValueChange={setHideReason}
        onClose={() => {
          setPendingHideBusiness(null);
          setHideReason('Administrative action');
        }}
        onConfirm={hideBusiness}
      />
    </div>
  );
};

export default AdminBusinessManagement;