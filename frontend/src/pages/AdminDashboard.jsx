import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import AdminBusinessManagement from '../components/admin/AdminBusinessManagement';
import AdminAppointmentManagement from '../components/admin/AdminAppointmentManagement';
import AdminAnalyticsDashboard from '../components/admin/AdminAnalyticsDashboard';
import AdminBackupView from '../components/admin/AdminBackupView';
import AdminSettingsView from '../components/admin/AdminSettingsView';

const sectionMeta = {
  home: {
    title: 'Admin Overview',
    description: 'Monitor the platform and manage operational controls from one place.',
  },
  users: {
    title: 'Users',
    icon: '👥',
    description: 'Search, suspend, and manage user accounts.',
  },
  businesses: {
    title: 'Businesses',
    icon: '🏢',
    description: 'Moderate listings and control business visibility.',
  },
  appointments: {
    title: 'Appointments',
    icon: '📅',
    description: 'Review and force-cancel appointments platform-wide.',
  },
  analytics: {
    title: 'Analytics',
    icon: '📊',
    description: 'View platform metrics, trends, and booking heatmaps.',
  },
  settings: {
    title: 'Settings',
    icon: '⚙️',
    description: 'Configure booking limits, announcements, and system defaults.',
  },
  backups: {
    title: 'Backups',
    icon: '💾',
    description: 'Create, restore, and download database backups and exports.',
  },
};

function AdminDashboard() {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [userDataError, setUserDataError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          return;
        }

        const response = await api.get('/auth/me/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        updateUser({
          ...response.data,
          role: response.data.role?.toLowerCase(),
        });
      } catch (error) {
        setUserDataError(error.response?.data?.error || 'Failed to load admin data');
      }
    };

    fetchUserData();
  }, [updateUser]);

  const meta = sectionMeta[activeSection] || sectionMeta.home;

  const sectionContent = {
    home: (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(sectionMeta)
          .filter(([key]) => key !== 'home')
          .map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5 text-left hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{value.icon}</span>
                <h4 className="font-semibold text-gray-900 dark:text-white">{value.title}</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{value.description}</p>
              <span className="inline-block mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Open &rarr;
              </span>
            </button>
          ))}
      </div>
    ),
    users: <AdminUserManagement />,
    businesses: <AdminBusinessManagement />,
    appointments: <AdminAppointmentManagement />,
    analytics: <AdminAnalyticsDashboard />,
    settings: <AdminSettingsView />,
    backups: <AdminBackupView />,
  };

  return (
    <DashboardLayout role="admin" activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.full_name || user?.username}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Administrative controls for AliceTant</p>
          {user?.email && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{user.email}</p>
          )}
          {userDataError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3">{userDataError}</p>
          )}
          {user?.must_change_password && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              This account is flagged for a password change. Open your profile screen after sign-in and update the password before continuing normal use.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{meta.title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{meta.description}</p>
        </div>

        {sectionContent[activeSection] || sectionContent.home}
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;