import { useState, useEffect } from 'react';
import api from '../utils/api';

const token = () => localStorage.getItem('authToken');
const authHeaders = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const ClosuresEditor = ({ businessId }) => {
    const [closures, setClosures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', start_date: '', end_date: '', reason: '' });
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => { fetchClosures(); }, [businessId]);

    const fetchClosures = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/closures/?business_id=${businessId}`, authHeaders());
            setClosures(res.data);
        } catch { setError('Failed to load closures'); }
        finally { setLoading(false); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.start_date || !form.end_date) return;
        setSubmitting(true);
        setError(null);
        setFeedback(null);
        try {
            const res = await api.post('/closures/', {
                business: businessId,
                title: form.title || 'Untitled',
                start_date: form.start_date,
                end_date: form.end_date,
                reason: form.reason,
            }, authHeaders());
            setClosures([res.data, ...closures]);
            setShowAdd(false);
            setForm({ title: '', start_date: '', end_date: '', reason: '' });
            if (res.data.cancelled_appointments > 0) {
                setFeedback(`Closure added. ${res.data.cancelled_appointments} appointment(s) were cancelled.`);
            } else {
                setFeedback('Closure added.');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.end_date?.[0] || 'Failed to add closure');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/closures/${id}/`, authHeaders());
            setClosures(closures.filter(c => c.id !== id));
            setDeleteConfirm(null);
        } catch { setError('Failed to delete closure'); }
    };

    const formatDate = (d) => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isUpcoming = (d) => new Date(d + 'T23:59:59') >= new Date();

    if (loading) return <div className="text-sm text-gray-500 py-2">Loading closures...</div>;

    return (
        <div className="space-y-4">
            {error && <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>}
            {feedback && <div className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">{feedback}</div>}

            {/* Existing closures */}
            {closures.length > 0 ? (
                <div className="space-y-3">
                    {closures.map(c => {
                        const upcoming = isUpcoming(c.end_date);
                        return (
                            <div
                                key={c.id}
                                className={`rounded-lg border p-4 ${
                                    upcoming
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-gray-50 border-gray-200 opacity-60'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                                            {c.title || 'Untitled'}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            {formatDate(c.start_date)}
                                            {c.start_date !== c.end_date && ` — ${formatDate(c.end_date)}`}
                                        </p>
                                        {c.reason && (
                                            <p className="text-xs text-gray-500 mt-1 italic">{c.reason}</p>
                                        )}
                                    </div>
                                    {deleteConfirm === c.id ? (
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-md hover:bg-red-700 transition-colors"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-md hover:bg-gray-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(c.id)}
                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded-md px-2.5 py-1 transition-colors flex-shrink-0"
                                            title="Remove closure"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-gray-400 italic">No closures or holidays scheduled</p>
            )}

            {/* Add closure form */}
            {showAdd ? (
                <form onSubmit={handleAdd} className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Summer Holiday, Renovation Break"
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Start Date *</label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={e => setForm({ ...form, start_date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none closure-date-input"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">End Date *</label>
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={e => setForm({ ...form, end_date: e.target.value })}
                                min={form.start_date || new Date().toISOString().split('T')[0]}
                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none closure-date-input"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input
                            type="text"
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                            placeholder="e.g., Public holiday, Staff training"
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 text-sm font-medium bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Adding...' : 'Add Closure'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowAdd(false); setForm({ title: '', start_date: '', end_date: '', reason: '' }); }}
                            className="flex-1 text-sm font-medium border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                    <p className="text-xs text-amber-700">
                        Adding a closure will automatically cancel any active appointments in this period.
                    </p>
                </form>
            ) : (
                <button
                    onClick={() => setShowAdd(true)}
                    className="w-full text-sm font-medium text-amber-700 border border-amber-300 rounded-lg py-2.5 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"
                >
                    <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 4v16m8-8H4" />
                    </svg>
                    Add Holiday / Closure
                </button>
            )}
        </div>
    );
};

export default ClosuresEditor;
