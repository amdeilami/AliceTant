import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import AdminExportView from './AdminExportView';
import AdminActionModal from './AdminActionModal';

const AdminBackupView = () => {
  const { showError, showSuccess } = useToast();
  const [backups, setBackups] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [backupToRestore, setBackupToRestore] = useState(null);

  const fetchBackups = async () => {
    try {
      const response = await api.get('/admin/backups/');
      setBackups(response.data.results || []);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load backups');
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    try {
      await api.post('/admin/backups/');
      showSuccess('Backup created');
      fetchBackups();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to create backup');
    }
  };

  const restoreBackup = async () => {
    if (!backupToRestore) {
      return;
    }

    try {
      await api.post('/admin/backups/restore/', { filename: backupToRestore });
      showSuccess('Backup restored successfully.');
      setBackupToRestore(null);
      fetchBackups();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to restore backup');
    }
  };

  const deleteBackup = async (filename) => {
    try {
      await api.delete(`/admin/backups/${filename}/`);
      showSuccess('Backup deleted');
      fetchBackups();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete backup');
    }
  };

  const uploadAndRestore = async () => {
    if (!uploadFile) {
      showError('Select a backup file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await api.post('/admin/backups/restore/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showSuccess('Uploaded backup restored successfully.');
      setUploadFile(null);
      fetchBackups();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to upload backup');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button type="button" onClick={createBackup} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Create Backup Now</button>
        </div>

        <div className="mb-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Restore from file</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Upload a previously downloaded backup to restore. Only <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">.sqlite3</code> files are accepted.</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              Browse&hellip;
              <input type="file" accept=".sqlite3" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} className="hidden" />
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">{uploadFile ? uploadFile.name : 'No file selected'}</span>
            <button type="button" onClick={uploadAndRestore} disabled={!uploadFile} className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">Upload & Restore</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4">Filename</th>
                <th className="py-2 pr-4">Size</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr><td colSpan="4" className="py-4 text-gray-500 dark:text-gray-400">No backups found.</td></tr>
              ) : backups.map((backup) => (
                <tr key={backup.filename} className="border-b border-gray-100 dark:border-gray-700/60 text-gray-700 dark:text-gray-300">
                  <td className="py-3 pr-4">{backup.filename}</td>
                  <td className="py-3 pr-4">{backup.size} bytes</td>
                  <td className="py-3 pr-4">{new Date(backup.created_at).toLocaleString()}</td>
                  <td className="py-3 space-x-2">
                    <a href={`http://localhost:5174/api/admin/backups/${backup.filename}/download/`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Download</a>
                    <button type="button" onClick={() => setBackupToRestore(backup.filename)} className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700">Restore</button>
                    <button type="button" onClick={() => deleteBackup(backup.filename)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminExportView />
      <AdminActionModal
        isOpen={Boolean(backupToRestore)}
        title="Restore Backup"
        description="This uses the selected backup file to overwrite the current application database."
        warning="Restoring a backup will replace the current database with the selected backup. Any data created after this backup was taken will be lost."
        confirmLabel="Restore Backup"
        onClose={() => setBackupToRestore(null)}
        onConfirm={restoreBackup}
      />
    </div>
  );
};

export default AdminBackupView;