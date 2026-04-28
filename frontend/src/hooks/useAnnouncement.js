import { useEffect, useState } from 'react';
import api from '../utils/api';

const useAnnouncement = () => {
  const [announcement, setAnnouncement] = useState({ text: '', visible: false, severity: 'info' });

  useEffect(() => {
    let isMounted = true;

    const fetchAnnouncement = async () => {
      try {
        const response = await api.get('/announcement/');
        if (isMounted) {
          setAnnouncement(response.data);
        }
      } catch {
        if (isMounted) {
          setAnnouncement({ text: '', visible: false, severity: 'info' });
        }
      }
    };

    fetchAnnouncement();
    const interval = window.setInterval(fetchAnnouncement, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return announcement;
};

export default useAnnouncement;