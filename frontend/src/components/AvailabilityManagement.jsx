/**
 * Availability Management Component
 *
 * Allows providers to manage their availability slots for each business.
 * Slots are date-specific and can optionally recur weekly for up to 64 weeks.
 */
import { useState, useEffect } from 'react';
import api from '../utils/api';

const AvailabilityManagement = () => {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState(null);
    const [availabilitySlots, setAvailabilitySlots] = useState([]);
    const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(false);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editingSlots, setEditingSlots] = useState([]);
    const [activeTab, setActiveTab] = useState('view');
    const [overlapWarning, setOverlapWarning] = useState(null); // { conflicts, pendingPayload }

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchBusinesses();
    }, []);

    useEffect(() => {
        if (selectedBusinessId) {
            fetchAvailability(selectedBusinessId);
        }
    }, [selectedBusinessId]);

    const fetchBusinesses = async () => {
        setIsLoadingBusinesses(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get('/businesses/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBusinesses(response.data);
            if (response.data.length > 0 && !selectedBusinessId) {
                setSelectedBusinessId(response.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching businesses:', err);
            setError('Failed to load businesses. Please try again.');
        } finally {
            setIsLoadingBusinesses(false);
        }
    };

    const fetchAvailability = async (businessId) => {
        setIsLoadingAvailability(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get(`/availability/?business_id=${businessId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAvailabilitySlots(response.data);
        } catch (err) {
            console.error('Error fetching availability:', err);
            setError('Failed to load availability. Please try again.');
            setAvailabilitySlots([]);
        } finally {
            setIsLoadingAvailability(false);
        }
    };

    const handleBusinessChange = (e) => {
        const businessId = parseInt(e.target.value);
        setSelectedBusinessId(businessId);
        setSuccessMessage(null);
        setError(null);
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const handleAddSlot = () => {
        setEditingSlots([
            ...editingSlots,
            { date: todayStr, start_time: '09:00', end_time: '17:00', capacity: '', is_recurring: false, num_weeks: 1 }
        ]);
    };

    const handleRemoveSlot = (index) => {
        setEditingSlots(editingSlots.filter((_, i) => i !== index));
    };

    const handleSlotChange = (index, field, value) => {
        const newSlots = [...editingSlots];
        if (field === 'is_recurring') {
            newSlots[index] = { ...newSlots[index], is_recurring: value };
            if (!value) newSlots[index].num_weeks = 1;
        } else if (field === 'num_weeks') {
            const n = Math.max(1, Math.min(64, parseInt(value) || 1));
            newSlots[index] = { ...newSlots[index], num_weeks: n };
        } else {
            newSlots[index] = { ...newSlots[index], [field]: value };
        }
        setEditingSlots(newSlots);
    };

    const validateSlot = (slot) => {
        if (!slot.date || !slot.start_time || !slot.end_time) return false;
        return slot.end_time > slot.start_time;
    };

    const buildPayload = (forceOverwrite = false) => ({
        business_id: selectedBusinessId,
        force_overwrite: forceOverwrite,
        slots: editingSlots.map(slot => ({
            date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            capacity: slot.capacity ? parseInt(slot.capacity) : null,
            is_recurring: slot.is_recurring,
            num_weeks: slot.is_recurring ? slot.num_weeks : 1,
        }))
    });

    const submitSlots = async (payload) => {
        setIsSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post('/availability/', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const created = response.data.created || response.data;
            // If we overwrote, remove the old conflicting slots from local state
            if (payload.force_overwrite && overlapWarning?.conflicts) {
                const removedIds = new Set(overlapWarning.conflicts.map(c => c.existing_id));
                setAvailabilitySlots(prev => [...prev.filter(s => !removedIds.has(s.id)), ...created]);
            } else {
                setAvailabilitySlots(prev => [...prev, ...created]);
            }
            setEditingSlots([]);
            setOverlapWarning(null);
            setSuccessMessage(`${created.length} slot(s) created successfully!`);
            setActiveTab('view');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            // 409 = overlap warning from backend
            if (err.response?.status === 409 && err.response?.data?.conflicts) {
                setOverlapWarning({
                    conflicts: err.response.data.conflicts,
                    pendingPayload: { ...payload, force_overwrite: true },
                });
            } else {
                const errorMessage = err.response?.data?.error ||
                    err.response?.data?.slots?.[0] ||
                    'Failed to save availability. Please try again.';
                setError(errorMessage);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAvailability = async () => {
        setError(null);
        setSuccessMessage(null);
        setOverlapWarning(null);

        if (editingSlots.length === 0) {
            setError('Add at least one slot before saving.');
            return;
        }

        for (let i = 0; i < editingSlots.length; i++) {
            if (!validateSlot(editingSlots[i])) {
                setError(`Slot ${i + 1}: End time must be after start time and date is required.`);
                return;
            }
        }

        await submitSlots(buildPayload(false));
    };

    const handleConfirmOverwrite = async () => {
        if (!overlapWarning?.pendingPayload) return;
        await submitSlots(overlapWarning.pendingPayload);
    };

    const handleCancelOverwrite = () => {
        setOverlapWarning(null);
    };

    const handleDeleteSlot = async (slotId) => {
        setError(null);
        setSuccessMessage(null);
        try {
            const token = localStorage.getItem('authToken');
            await api.delete(`/availability/${slotId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAvailabilitySlots(availabilitySlots.filter(s => s.id !== slotId));
            setSuccessMessage('Slot deleted.');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error deleting slot:', err);
            setError('Failed to delete slot. Please try again.');
        }
    };

    const handleDeleteRecurringGroup = async (groupId) => {
        setError(null);
        setSuccessMessage(null);
        const groupSlots = availabilitySlots.filter(s => s.recurring_group === groupId);
        if (!window.confirm(`Delete all ${groupSlots.length} slots in this recurring series?`)) return;
        try {
            const token = localStorage.getItem('authToken');
            for (const s of groupSlots) {
                await api.delete(`/availability/${s.id}/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            setAvailabilitySlots(prev => prev.filter(s => s.recurring_group !== groupId));
            setSuccessMessage(`Deleted ${groupSlots.length} recurring slot(s).`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error deleting recurring group:', err);
            setError('Failed to delete recurring group. Please try again.');
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${m} ${ampm}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const groupSlotsByDate = (slots) => {
        const grouped = {};
        slots.forEach(slot => {
            const key = slot.date;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(slot);
        });
        const sortedKeys = Object.keys(grouped).sort();
        const sorted = {};
        sortedKeys.forEach(k => { sorted[k] = grouped[k]; });
        return sorted;
    };

    if (isLoadingBusinesses) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                    <p className="text-gray-600">Loading businesses...</p>
                </div>
            </div>
        );
    }

    if (businesses.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Availability Management</h2>
                <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-600 mb-4">You need to create a business first before setting availability.</p>
                    <p className="text-sm text-gray-500">Go to the Businesses section to create your first business.</p>
                </div>
            </div>
        );
    }

    const groupedByDate = groupSlotsByDate(availabilitySlots);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Availability Management</h2>
            <p className="text-gray-600 mb-6">
                Define time windows on specific dates when customers can book. You can make a slot repeat weekly for up to 64 weeks.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-700">{successMessage}</p>
                </div>
            )}

            {/* Business Selector */}
            <div className="mb-6">
                <label htmlFor="business-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Business
                </label>
                <select
                    id="business-select"
                    value={selectedBusinessId || ''}
                    onChange={handleBusinessChange}
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    {businesses.map(business => (
                        <option key={business.id} value={business.id}>{business.name}</option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px space-x-8" aria-label="Availability tabs">
                    <button
                        onClick={() => { setActiveTab('view'); setError(null); }}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'view'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Current Slots
                    </button>
                    <button
                        onClick={() => { setActiveTab('add'); setError(null); setSuccessMessage(null); }}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'add'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Add Slots
                    </button>
                </nav>
            </div>

            {isLoadingAvailability ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                    <p className="text-gray-600">Loading availability...</p>
                </div>
            ) : activeTab === 'view' ? (
                /* ========== CURRENT SLOTS TAB ========== */
                <div>
                    {availabilitySlots.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500 mb-4">No availability slots set yet.</p>
                            <button
                                onClick={() => setActiveTab('add')}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 4v16m8-8H4" />
                                </svg>
                                Add Your First Slot
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedByDate).map(([dateStr, dateSlots]) => (
                                <div key={dateStr} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                        <h4 className="font-semibold text-gray-700">
                                            {formatDate(dateStr)}
                                            <span className="ml-2 text-xs font-normal text-gray-500">
                                                {daysOfWeek[dateSlots[0]?.day_of_week]}
                                            </span>
                                        </h4>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {dateSlots.map(slot => (
                                            <div key={slot.id} className="flex items-center justify-between px-4 py-3">
                                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                                    <svg className="w-4 h-4 text-indigo-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-gray-700 font-medium">
                                                        {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                                                    </span>
                                                    {slot.capacity && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                                            Cap: {slot.capacity}
                                                        </span>
                                                    )}
                                                    {slot.recurring_group && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                            Recurring
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    {slot.recurring_group && (
                                                        <button
                                                            onClick={() => handleDeleteRecurringGroup(slot.recurring_group)}
                                                            className="inline-flex items-center gap-1 text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 text-xs"
                                                            title="Delete all slots in this recurring series"
                                                            aria-label="Delete entire recurring series"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete series
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                                        aria-label="Delete this slot"
                                                        title="Delete this slot"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="pt-2">
                                <button
                                    onClick={() => setActiveTab('add')}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add More Slots
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* ========== ADD SLOTS TAB ========== */
                <div>
                    {/* Existing slots summary */}
                    {availabilitySlots.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-700 font-medium mb-2">
                                Existing slots ({availabilitySlots.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {availabilitySlots.map(slot => (
                                    <span key={slot.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {formatDate(slot.date)} {formatTime(slot.start_time)}-{formatTime(slot.end_time)}
                                        {slot.capacity && ` (cap: ${slot.capacity})`}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                New slots will be added alongside these. If there are overlapping times you&apos;ll be asked to confirm before overwriting.
                            </p>
                        </div>
                    )}

                    {/* Overlap warning dialog */}
                    {overlapWarning && (
                        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-amber-800 mb-2">Overlapping Slots Detected</h4>
                                    <p className="text-sm text-amber-700 mb-3">
                                        The following new slots conflict with existing availability. You can overwrite them or cancel.
                                    </p>
                                    <ul className="text-sm text-amber-700 space-y-1 mb-4">
                                        {overlapWarning.conflicts.map((c, i) => (
                                            <li key={i} className="flex items-center gap-1">
                                                <span className="font-medium">{c.date}:</span>
                                                <span>New {c.new_time}</span>
                                                <span className="text-amber-500">conflicts with</span>
                                                <span>existing {c.existing_time}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleConfirmOverwrite}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                                        >
                                            {isSaving ? 'Overwriting...' : 'Overwrite Existing'}
                                        </button>
                                        <button
                                            onClick={handleCancelOverwrite}
                                            disabled={isSaving}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 mb-6">
                        {editingSlots.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-500 mb-3">Click the button below to add an availability slot.</p>
                            </div>
                        ) : (
                            editingSlots.map((slot, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex flex-wrap items-end gap-3 mb-3">
                                        <div className="min-w-[160px]">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                                            <input
                                                type="date"
                                                value={slot.date}
                                                min={todayStr}
                                                onChange={(e) => handleSlotChange(index, 'date', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="min-w-[120px]">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                                            <input
                                                type="time"
                                                value={slot.start_time}
                                                onChange={(e) => handleSlotChange(index, 'start_time', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="min-w-[120px]">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                                            <input
                                                type="time"
                                                value={slot.end_time}
                                                onChange={(e) => handleSlotChange(index, 'end_time', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="min-w-[90px]">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={slot.capacity}
                                                onChange={(e) => handleSlotChange(index, 'capacity', e.target.value)}
                                                placeholder="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleRemoveSlot(index)}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                                            aria-label={`Remove slot ${index + 1}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Recurring toggle */}
                                    <div className="flex items-center gap-4">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={slot.is_recurring}
                                                onChange={(e) => handleSlotChange(index, 'is_recurring', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                            <span className="ml-2 text-sm text-gray-700">Repeat weekly</span>
                                        </label>
                                        {slot.is_recurring && (
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-600">for</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="64"
                                                    value={slot.num_weeks}
                                                    onChange={(e) => handleSlotChange(index, 'num_weeks', e.target.value)}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                />
                                                <span className="text-xs text-gray-600">week{slot.num_weeks !== 1 ? 's' : ''}</span>
                                                <span className="text-xs text-gray-400">
                                                    ({slot.num_weeks} slot{slot.num_weeks !== 1 ? 's' : ''} will be created)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleAddSlot}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M12 4v16m8-8H4" />
                            </svg>
                            Add Slot
                        </button>

                        {editingSlots.length > 0 && (
                            <button
                                onClick={handleSaveAvailability}
                                disabled={isSaving}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Slots
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={() => { setActiveTab('view'); setEditingSlots([]); setError(null); }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityManagement;
