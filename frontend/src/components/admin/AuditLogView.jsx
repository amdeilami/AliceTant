import AdminPaginationControls from './AdminPaginationControls';

const AuditLogView = ({
  logs = [],
  actionFilter = '',
  onActionFilterChange,
  page = 1,
  numPages = 1,
  onPreviousPage,
  onNextPage,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Recent administrative actions across users, businesses, appointments, backups, and settings.</p>
        </div>
        {onActionFilterChange && (
          <div className="w-full md:w-72">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Filter by action</label>
            <input
              value={actionFilter}
              onChange={(event) => onActionFilterChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder="SUSPEND, UPDATE, BACKUP..."
            />
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4">When</th>
              <th className="py-2 pr-4">Actor</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">Target</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-4 text-gray-500 dark:text-gray-400">No audit log entries yet.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700/60 text-gray-700 dark:text-gray-300">
                  <td className="py-3 pr-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 pr-4">{log.actor_email || 'System'}</td>
                  <td className="py-3 pr-4">{log.action}</td>
                  <td className="py-3 pr-4">{log.target_type}{log.target_id ? ` #${log.target_id}` : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AdminPaginationControls page={page} numPages={numPages} onPrevious={onPreviousPage} onNext={onNextPage} />
    </div>
  );
};

export default AuditLogView;