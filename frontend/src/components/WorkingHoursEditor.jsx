import { useState, useEffect } from 'react';
import api from '../utils/api';

const DAYS = [
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
    { value: 0, label: 'Sunday', short: 'Sun' },
];

const token = () => localStorage.getItem('authToken');
const authHeaders = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const WorkingHoursEditor = ({ businessId, onChange }) => {
    const [hours, setHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { fetchHours(); }, [businessId]);

    const fetchHours = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/working-hours/?business_id=${businessId}`, authHeaders());
            setHours(res.data);
        } catch { setError('Failed to load working hours'); }
        finally { setLoading(false); }
    };

    // Build a map: day_of_week -> entry or null
    const hoursByDay = {};
    hours.forEach(h => { hoursByDay[h.day_of_week] = h; });

    const handleToggleDay = (day) => {
        const existing = hoursByDay[day];
        if (existing) {
            // Toggle is_closed or remove
            const updated = hours.map(h =>
                h.day_of_week === day ? { ...h, is_closed: !h.is_closed } : h
            );
            setHours(updated);
        } else {
            // Add default open hours
            setHours([...hours, {
                day_of_week: day,
                open_time: '09:00',
                close_time: '17:00',
                is_closed: false,
                business: businessId,
            }]);
        }
    };

    const handleTimeChange = (day, field, value) => {
        setHours(hours.map(h =>
            h.day_of_week === day ? { ...h, [field]: value } : h
        ));
    };

    const handleRemoveDay = (day) => {
        setHours(hours.filter(h => h.day_of_week !== day));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const payload = {
                business_id: businessId,
                hours: hours.map(h => ({
                    day_of_week: h.day_of_week,
                    open_time: h.is_closed ? '00:00' : h.open_time,
                    close_time: h.is_closed ? '00:01' : h.close_time,
                    is_closed: h.is_closed,
                    business: businessId,
                })),
            };
            const res = await api.put('/working-hours/', payload, authHeaders());
            setHours(res.data);
            if (onChange) onChange(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save working hours');
        } finally { setSaving(false); }
    };

    if (loading) {
        return <div className="text-sm text-gray-500 py-2">Loading working hours...</div>;
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
            )}

            <div className="space-y-3">
                {DAYS.map(day => {
                    const entry = hoursByDay[day.value];
                    const isActive = !!entry && !entry.is_closed;
                    const isClosed = entry?.is_closed;

                    return (
                        <div key={day.value} className="flex items-center gap-3 py-1.5">
                            {/* Day toggle */}
                            <button
                                type="button"
                                onClick={() => entry ? handleRemoveDay(day.value) : handleToggleDay(day.value)}
                                className={`w-24 text-sm font-medium py-1.5 rounded-md transition-colors ${
                                    entry
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                            >
                                {day.label}
                            </button>

                            {entry ? (
                                <>
                                    {/* Closed toggle */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleDay(day.value)}
                                        className={`text-sm px-3 py-1.5 rounded transition-colors ${
                                            isClosed
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                        }`}
                                    >
                                        {isClosed ? 'Closed' : 'Open'}
                                    </button>

                                    {!isClosed && (
                                        <>
                                            <input
                                                type="time"
                                                value={entry.open_time?.slice(0, 5) || '09:00'}
                                                onChange={e => handleTimeChange(day.value, 'open_time', e.target.value)}
                                                className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5"
                                            />
                                            <span className="text-gray-400 text-sm">to</span>
                                            <input
                                                type="time"
                                                value={entry.close_time?.slice(0, 5) || '17:00'}
                                                onChange={e => handleTimeChange(day.value, 'close_time', e.target.value)}
                                                className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5"
                                            />
                                        </>
                                    )}
                                </>
                            ) : (
                                <span className="text-sm text-gray-400 italic">Not set — click day to add</span>
                            )}
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full text-sm bg-indigo-600 text-white py-2.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
            >
                {saving ? 'Saving...' : 'Save Working Hours'}
            </button>
        </div>
    );
};

/** Read-only compact display of working hours for the business card */
export const WorkingHoursSummary = ({ businessId }) => {
    const [hours, setHours] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/working-hours/?business_id=${businessId}`, authHeaders())
            .then(res => setHours(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [businessId]);

    if (loading) return null;
    if (hours.length === 0) return <span className="text-xs text-gray-400 italic">No hours set</span>;

    const mondayFirst = (dayNum) => dayNum === 0 ? 7 : dayNum;
    const sorted = [...hours].sort((a, b) => mondayFirst(a.day_of_week) - mondayFirst(b.day_of_week));

    return (
        <div className="space-y-0.5">
            {sorted.map(h => {
                const dayName = DAYS.find(d => d.value === h.day_of_week)?.short || '?';
                return (
                    <div key={h.day_of_week} className="flex items-center text-xs gap-2">
                        <span className="w-8 font-medium text-gray-600">{dayName}</span>
                        {h.is_closed ? (
                            <span className="text-red-500">Closed</span>
                        ) : (
                            <span className="text-gray-700">
                                {h.open_time?.slice(0, 5)} – {h.close_time?.slice(0, 5)}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default WorkingHoursEditor;
