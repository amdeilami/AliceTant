import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import LoginHistoryModal from './LoginHistoryModal';
import AuditLogView from './AuditLogView';
import AdminActionModal from './AdminActionModal';
import AdminPaginationControls from './AdminPaginationControls';

const AdminUserManagement = () => {
  const { showError, showSuccess } = useToast();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [suspended, setSuspended] = useState('');
  const [loading, setLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [userNumPages, setUserNumPages] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [auditNumPages, setAuditNumPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [loginHistory, setLoginHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pendingSuspendUserId, setPendingSuspendUserId] = useState(null);
  const [suspendReason, setSuspendReason] = useState('Administrative suspension');

  const fetchUsers = async (nextUserPage = userPage, nextAuditPage = auditPage, nextAuditAction = auditActionFilter) => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (role) params.role = role;
      if (suspended !== '') params.is_suspended = suspended;
      params.page = nextUserPage;
      const [usersResponse, auditResponse] = await Promise.all([
        api.get('/admin/users/', { params }),
        api.get('/admin/audit-log/', { params: { page_size: 8, page: nextAuditPage, action: nextAuditAction } }),
      ]);
      setUsers(usersResponse.data.results || []);
      setUserPage(usersResponse.data.page || 1);
      setUserNumPages(usersResponse.data.num_pages || 1);
      setAuditLogs(auditResponse.data.results || []);
      setAuditPage(auditResponse.data.page || 1);
      setAuditNumPages(auditResponse.data.num_pages || 1);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const runAction = async (url, successMessage) => {
    try {
      await api.post(url);
      showSuccess(successMessage);
      fetchUsers(userPage, auditPage, auditActionFilter);
    } catch (error) {
      showError(error.response?.data?.error || 'Action failed');
    }
  };

  const handleSuspend = async () => {
    if (!pendingSuspendUserId) {
      return;
    }

    try {
      await api.post(`/admin/users/${pendingSuspendUserId}/suspend/`, { reason: suspendReason });
      showSuccess('User suspended');
      setPendingSuspendUserId(null);
      setSuspendReason('Administrative suspension');
      fetchUsers(userPage, auditPage, auditActionFilter);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to suspend user');
    }
  };

  const handleLoginHistory = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}/login-history/`);
      setLoginHistory(response.data.results || []);
      setIsHistoryOpen(true);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load login history');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end mb-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" placeholder="Email, username, or profile name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Role</label>
            <select value={role} onChange={(event) => setRole(event.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option value="">All</option>
              <option value="ADMIN">Admin</option>
              <option value="PROVIDER">Provider</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Suspended</label>
            <select value={suspended} onChange={(event) => setSuspended(event.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <option value="">All</option>
              <option value="true">Suspended</option>
              <option value="false">Active</option>
            </select>
          </div>
          <button type="button" onClick={() => fetchUsers(1, 1, auditActionFilter)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Apply</button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Flags</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="py-4 text-gray-500 dark:text-gray-400">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="py-4 text-gray-500 dark:text-gray-400">No users found.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                    </td>
                    <td className="py-3 pr-4">{user.role}</td>
                    <td className="py-3 pr-4">{user.is_suspended ? 'Suspended' : 'Active'}</td>
                    <td className="py-3 pr-4">{user.must_change_password ? 'Password reset required' : '—'}</td>
                    <td className="py-3 space-x-2">
                      {user.is_suspended ? (
                        <button type="button" onClick={() => runAction(`/admin/users/${user.id}/reactivate/`, 'User reactivated')} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Reactivate</button>
                      ) : (
                        <button type="button" onClick={() => setPendingSuspendUserId(user.id)} className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700">Suspend</button>
                      )}
                      <button type="button" onClick={() => runAction(`/admin/users/${user.id}/force-password-reset/`, 'Password reset requirement enabled')} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Force Reset</button>
                      <button type="button" onClick={() => handleLoginHistory(user.id)} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Logins</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPaginationControls page={userPage} numPages={userNumPages} onPrevious={() => fetchUsers(userPage - 1, auditPage, auditActionFilter)} onNext={() => fetchUsers(userPage + 1, auditPage, auditActionFilter)} />
      </div>

      <AuditLogView
        logs={auditLogs}
        actionFilter={auditActionFilter}
        onActionFilterChange={(value) => {
          setAuditActionFilter(value);
          fetchUsers(userPage, 1, value);
        }}
        page={auditPage}
        numPages={auditNumPages}
        onPreviousPage={() => fetchUsers(userPage, auditPage - 1, auditActionFilter)}
        onNextPage={() => fetchUsers(userPage, auditPage + 1, auditActionFilter)}
      />
      <LoginHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} events={loginHistory} />
      <AdminActionModal
        isOpen={Boolean(pendingSuspendUserId)}
        title="Suspend User"
        description="Suspended users are blocked from login and from protected API access until an admin reactivates them."
        confirmLabel="Suspend User"
        confirmDisabled={!suspendReason.trim()}
        value={suspendReason}
        valueLabel="Suspension reason"
        valuePlaceholder="Explain why this account is being suspended"
        onValueChange={setSuspendReason}
        onClose={() => {
          setPendingSuspendUserId(null);
          setSuspendReason('Administrative suspension');
        }}
        onConfirm={handleSuspend}
      />
    </div>
  );
};

export default AdminUserManagement;