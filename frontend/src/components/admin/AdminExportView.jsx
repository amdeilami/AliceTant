const AdminExportView = () => {
  const downloads = [
    { label: 'Export Users CSV', href: 'http://localhost:5174/api/admin/export/users.csv' },
    { label: 'Export Businesses CSV', href: 'http://localhost:5174/api/admin/export/businesses.csv' },
    { label: 'Export Appointments CSV', href: 'http://localhost:5174/api/admin/export/appointments.csv' },
  ];

  const token = localStorage.getItem('authToken');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exports</h3>
      <div className="flex flex-wrap gap-3">
        {downloads.map((download) => (
          <a
            key={download.href}
            href={download.href}
            onClick={(event) => {
              event.preventDefault();
              fetch(download.href, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
                .then((response) => response.blob())
                .then((blob) => {
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = download.href.split('/').pop();
                  link.click();
                  window.URL.revokeObjectURL(url);
                });
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {download.label}
          </a>
        ))}
      </div>
    </div>
  );
};

export default AdminExportView;