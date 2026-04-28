const LoginHistoryModal = ({ isOpen, onClose, events = [] }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Login History</h3>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Close</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No login history found.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.success ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                    {event.success ? 'Success' : 'Failed'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(event.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">IP: {event.ip_address || 'Unknown'}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-all">{event.user_agent || 'No user agent recorded'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginHistoryModal;