import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useAnnouncement from '../hooks/useAnnouncement';

const severityClasses = {
  info: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800',
  warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
  critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800',
};

const AnnouncementBanner = () => {
  const announcement = useAnnouncement();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const dismissKey = useMemo(() => `announcement:${announcement.text}:${announcement.severity}`, [announcement.text, announcement.severity]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setDismissed(false);
    } else {
      setDismissed(sessionStorage.getItem(dismissKey) === 'dismissed');
    }
  }, [dismissKey, isAdmin]);

  if (!announcement.visible || !announcement.text || dismissed) {
    return null;
  }

  return (
    <div className={`border-b px-4 py-3 text-sm ${severityClasses[announcement.severity] || severityClasses.info}`}>
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
        <p>{announcement.text}</p>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(dismissKey, 'dismissed');
            setDismissed(true);
          }}
          className="text-xs font-medium underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;