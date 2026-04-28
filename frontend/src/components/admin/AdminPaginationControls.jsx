const AdminPaginationControls = ({ page = 1, numPages = 1, onPrevious, onNext }) => {
  if (numPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {numPages}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onPrevious} disabled={page <= 1} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700">Previous</button>
        <button type="button" onClick={onNext} disabled={page >= numPages} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700">Next</button>
      </div>
    </div>
  );
};

export default AdminPaginationControls;