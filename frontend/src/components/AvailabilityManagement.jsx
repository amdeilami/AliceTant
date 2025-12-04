/**
 * Availability Management Component
 * 
 * Allows providers to manage their availability slots for each business.
 * 
 * Features:
 * - Business selector to choose which business to manage
 * - Display all availability slots for selected business
 * - Add/edit availability slots with day, start time, and end time
 * - Time validation (end time must be after start time)
 * - Immediate UI updates after saving availability
 * - Empty state when no availability is defined
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

    const daysOfWeek = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' },
    ];

    /**
     * Fetch businesses on component mount
     */
    useEffect(() => {
        fetchBusinesses();
    }, []);

    /**
     * Fetch availability when business is selected
     */
    useEffect(() => {
        if (selectedBusinessId) {
            fetchAvailability(selectedBusinessId);
        }
    }, [selectedBusinessId]);

    /**
     * Fetch provider's businesses from API
     */
    const fetchBusinesses = async () => {
        setIsLoadingBusinesses(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get('/businesses/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setBusinesses(response.data);

            // Auto-select first business if available
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

    /**
     * Fetch availability slots for a specific business
     * @param {number} businessId - ID of the business
     */
    const fetchAvailability = async (businessId) => {
        setIsLoadingAvailability(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken');
            const response = await api.get(`/availability/?business_id=${businessId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setAvailabilitySlots(response.data);
            setEditingSlots(response.data.map(slot => ({ ...slot })));
        } catch (err) {
            console.error('Error fetching availability:', err);
            setError('Failed to load availability. Please try again.');
            setAvailabilitySlots([]);
            setEditingSlots([]);
        } finally {
            setIsLoadingAvailability(false);
        }
    };

    /**
     * Handle business selection change
     * @param {Event} e - Change event
     */
    const handleBusinessChange = (e) => {
        const businessId = parseInt(e.target.value);
        setSelectedBusinessId(businessId);
        setSuccessMessage(null);
        setError(null);
    };

    /**
     * Add a new empty slot to the editing list
     */
    const handleAddSlot = () => {
        setEditingSlots([
            ...editingSlots,
            {
                day_of_week: 1, // Default to Monday
                start_time: '09:00',
                end_time: '17:00',
            }
        ]);
    };

    /**
     * Remove a slot from the editing list
     * @param {number} index - Index of slot to remove
     */
    const handleRemoveSlot = (index) => {
        const newSlots = editingSlots.filter((_, i) => i !== index);
        setEditingSlots(newSlots);
    };

    /**
     * Update a slot in the editing list
     * @param {number} index - Index of slot to update
     * @param {string} field - Field to update
     * @param {any} value - New value
     */
    const handleSlotChange = (index, field, value) => {
        const newSlots = [...editingSlots];
        newSlots[index] = {
            ...newSlots[index],
            [field]: field === 'day_of_week' ? parseInt(value) : value
        };
        setEditingSlots(newSlots);
    };

    /**
     * Validate time ordering for a slot
     * @param {object} slot - Slot to validate
     * @returns {boolean} True if valid
     */
    const validateSlot = (slot) => {
        if (!slot.start_time || !slot.end_time) {
            return false;
        }

        const start = new Date(`2000-01-01T${slot.start_time}`);
        const end = new Date(`2000-01-01T${slot.end_time}`);

        return end > start;
    };

    /**
     * Save availability slots to API
     */
    const handleSaveAvailability = async () => {
        setError(null);
        setSuccessMessage(null);

        // Validate all slots
        for (let i = 0; i < editingSlots.length; i++) {
            if (!validateSlot(editingSlots[i])) {
                setError(`Slot ${i + 1}: End time must be after start time.`);
                return;
            }
        }

        setIsSaving(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post('/availability/', {
                business_id: selectedBusinessId,
                slots: editingSlots.map(slot => ({
                    day_of_week: slot.day_of_week,
                    start_time: slot.start_time,
                    end_time: slot.end_time
                }))
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Update availability slots with response
            setAvailabilitySlots(response.data);
            setEditingSlots(response.data.map(slot => ({ ...slot })));
            setSuccessMessage('Availability saved successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error saving availability:', err);
            const errorMessage = err.response?.data?.error ||
                err.response?.data?.slots?.[0] ||
                'Failed to save availability. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Get day name from day number
     * @param {number} dayNum - Day number (0-6)
     * @returns {string} Day name
     */
    const getDayName = (dayNum) => {
        const day = daysOfWeek.find(d => d.value === dayNum);
        return day ? day.label : 'Unknown';
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

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Availability Management</h2>
            <p className="text-gray-600 mb-6">Set your available time slots for appointments.</p>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Success Message */}
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
                    aria-label="Select business to manage availability"
                >
                    {businesses.map(business => (
                        <option key={business.id} value={business.id}>
                            {business.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Loading State */}
            {isLoadingAvailability && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                    <p className="text-gray-600">Loading availability...</p>
                </div>
            )}

            {/* Availability Slots Editor */}
            {!isLoadingAvailability && selectedBusinessId && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Time Slots</h3>
                        <button
                            onClick={handleAddSlot}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M12 4v16m8-8H4" />
                            </svg>
                            Add Slot
                        </button>
                    </div>

                    {/* Empty State */}
                    {editingSlots.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-600 mb-4">No availability slots defined yet.</p>
                            <p className="text-sm text-gray-500">Click "Add Slot" to create your first availability slot.</p>
                        </div>
                    )}

                    {/* Slots List */}
                    {editingSlots.length > 0 && (
                        <div className="space-y-4 mb-6 max-h-[calc(100vh-400px)] overflow-y-auto" role="list" aria-label="Availability time slots">
                            {editingSlots.map((slot, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50" role="listitem">
                                    <fieldset className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        <legend className="sr-only">Time slot {index + 1}</legend>

                                        {/* Day of Week */}
                                        <div>
                                            <label htmlFor={`day-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                                Day
                                            </label>
                                            <select
                                                id={`day-${index}`}
                                                value={slot.day_of_week}
                                                onChange={(e) => handleSlotChange(index, 'day_of_week', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                aria-label={`Day of week for slot ${index + 1}`}
                                            >
                                                {daysOfWeek.map(day => (
                                                    <option key={day.value} value={day.value}>
                                                        {day.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Start Time */}
                                        <div>
                                            <label htmlFor={`start-time-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                                Start Time
                                            </label>
                                            <input
                                                id={`start-time-${index}`}
                                                type="time"
                                                value={slot.start_time}
                                                onChange={(e) => handleSlotChange(index, 'start_time', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                aria-label={`Start time for slot ${index + 1}`}
                                            />
                                        </div>

                                        {/* End Time */}
                                        <div>
                                            <label htmlFor={`end-time-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                                End Time
                                            </label>
                                            <input
                                                id={`end-time-${index}`}
                                                type="time"
                                                value={slot.end_time}
                                                onChange={(e) => handleSlotChange(index, 'end_time', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                aria-label={`End time for slot ${index + 1}`}
                                            />
                                        </div>

                                        {/* Remove Button */}
                                        <div className="flex items-end sm:col-span-2 lg:col-span-1">
                                            <button
                                                onClick={() => handleRemoveSlot(index)}
                                                className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm sm:text-base"
                                                aria-label={`Remove time slot ${index + 1}`}
                                                type="button"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </fieldset>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Save Button */}
                    {editingSlots.length > 0 && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveAvailability}
                                disabled={isSaving}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Availability
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AvailabilityManagement;
