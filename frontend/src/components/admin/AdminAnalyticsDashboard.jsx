import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';

const dayLabels = {
  1: 'Sun',
  2: 'Mon',
  3: 'Tue',
  4: 'Wed',
  5: 'Thu',
  6: 'Fri',
  7: 'Sat',
};

const AdminAnalyticsDashboard = () => {
  const { showError } = useToast();
  const [userAnalytics, setUserAnalytics] = useState({ totals: [], growth: [] });
  const [bookingAnalytics, setBookingAnalytics] = useState({ daily: [], peak_hours: [], peak_days: [], heatmap: [] });
  const [cancellationAnalytics, setCancellationAnalytics] = useState({});
  const [businessPopularity, setBusinessPopularity] = useState({ top: [], bottom: [] });
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [usersResponse, bookingsResponse, cancellationsResponse, popularityResponse] = await Promise.all([
          api.get('/admin/analytics/users/', { params: { days } }),
          api.get('/admin/analytics/bookings/', { params: { days } }),
          api.get('/admin/analytics/cancellations/', { params: { days } }),
          api.get('/admin/analytics/businesses/popularity/', { params: { days } }),
        ]);

        setUserAnalytics(usersResponse.data);
        setBookingAnalytics(bookingsResponse.data);
        setCancellationAnalytics(cancellationsResponse.data);
        setBusinessPopularity(popularityResponse.data);
      } catch (error) {
        showError(error.response?.data?.error || 'Failed to load analytics');
      }
    };

    fetchAnalytics();
  }, [days, showError]);

  const growthData = (userAnalytics.growth || []).map((item) => ({
    period: item.period,
    count: item.count,
  }));

  const bookingData = (bookingAnalytics.daily || []).map((item) => ({
    period: item.period,
    count: item.count,
  }));

  const peakDayData = (bookingAnalytics.peak_days || []).map((item) => ({
    ...item,
    label: dayLabels[item.day] || item.day,
  }));

  const heatmapHours = Array.from(new Set((bookingAnalytics.heatmap || []).map((item) => item.hour))).sort((left, right) => left - right);
  const heatmapDayOrder = [2, 3, 4, 5, 6, 7, 1];
  const heatmapLookup = new Map((bookingAnalytics.heatmap || []).map((item) => [`${item.day}-${item.hour}`, item.count]));
  const maxHeatmapCount = Math.max(0, ...(bookingAnalytics.heatmap || []).map((item) => item.count));

  const heatmapCellClass = (count) => {
    if (count === 0) {
      return 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-500';
    }
    if (maxHeatmapCount <= 1) {
      return 'bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100';
    }

    const ratio = count / maxHeatmapCount;
    if (ratio >= 0.75) {
      return 'bg-indigo-700 text-white';
    }
    if (ratio >= 0.5) {
      return 'bg-indigo-500 text-white';
    }
    if (ratio >= 0.25) {
      return 'bg-indigo-300 text-indigo-900';
    }
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Window</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Switch between the last 30, 90, and 365 days.</p>
        </div>
        <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last 365 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Appointments in window</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{cancellationAnalytics.total_appointments || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cancellation rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{(((cancellationAnalytics.cancellation_rate || 0) * 100).toFixed(1))}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Modification rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{(((cancellationAnalytics.modification_rate || 0) * 100).toFixed(1))}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 h-80">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 h-80">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Volume</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#0f766e" fill="#99f6e4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 h-80">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Peak Hours</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bookingAnalytics.peak_hours || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Peak Days</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {peakDayData.map((day) => (
              <div key={day.day} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{day.label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{day.count}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Peak Time Heatmap</h3>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-gray-500 dark:text-gray-400">Day</th>
                  {heatmapHours.map((hour) => (
                    <th key={hour} className="px-2 py-2 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">{String(hour).padStart(2, '0')}:00</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapDayOrder.map((day) => (
                  <tr key={day}>
                    <td className="px-2 py-2 font-medium text-gray-700 dark:text-gray-300">{dayLabels[day]}</td>
                    {heatmapHours.map((hour) => {
                      const count = heatmapLookup.get(`${day}-${hour}`) || 0;
                      return (
                        <td key={`${day}-${hour}`} className="px-1 py-1">
                          <div className={`rounded px-2 py-2 text-center font-medium ${heatmapCellClass(count)}`}>{count}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Popularity</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Top 10</p>
              <div className="space-y-2">
                {(businessPopularity.top || []).map((business) => (
                  <div key={`top-${business.id}`} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>{business.name}</span>
                    <span>{business.booking_count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bottom 10</p>
              <div className="space-y-2">
                {(businessPopularity.bottom || []).map((business) => (
                  <div key={`bottom-${business.id}`} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>{business.name}</span>
                    <span>{business.booking_count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;