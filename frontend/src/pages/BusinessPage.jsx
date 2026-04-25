import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

const BusinessPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();

    const [business, setBusiness] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [workingHours, setWorkingHours] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Booking form state
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [appointmentTime, setAppointmentTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [isBooking, setIsBooking] = useState(false);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchBusinessDetails();
    }, [id]);

    const fetchBusinessDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [bizRes, availRes, whRes] = await Promise.all([
                api.get(`/businesses/${id}/`, { headers }),
                api.get(`/availability/?business_id=${id}`, { headers }),
                api.get(`/working-hours/?business_id=${id}`, { headers }),
            ]);

            setBusiness(bizRes.data);
            // Only show future availability
            const today = new Date().toISOString().split('T')[0];
            setAvailability(
                (availRes.data || []).filter(s => s.date >= today)
            );
            setWorkingHours(whRes.data?.working_hours || whRes.data || []);
        } catch (err) {
            console.error('Error fetching business:', err);
            setError('Business not found or failed to load.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        if (!selectedSlot || !appointmentTime) {
            showError('Please select a slot and enter your appointment time.');
            return;
        }

        setIsBooking(true);
        try {
            const token = localStorage.getItem('authToken');
            // Get customer id from user
            const meRes = await api.get('/auth/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const customerId = meRes.data.id;

            await api.post('/appointments/', {
                business: parseInt(id),
                customers: [customerId],
                appointment_date: selectedSlot.date,
                appointment_time: appointmentTime,
                end_time: endTime || undefined,
                availability: selectedSlot.id,
                notes,
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            showSuccess('Appointment booked successfully!');
            setSelectedSlot(null);
            setAppointmentTime('');
            setEndTime('');
            setNotes('');
            // Refresh availability (capacity may have changed)
            fetchBusinessDetails();
        } catch (err) {
            console.error('Booking error:', err);
            showError(err.response?.data?.error || 'Failed to book appointment.');
        } finally {
            setIsBooking(false);
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !business) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Business not found.'}</p>
                    <button
                        onClick={() => navigate('/dashboard/customer')}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        &larr; Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Group availability by date
    const groupedAvailability = {};
    availability.forEach(slot => {
        if (!groupedAvailability[slot.date]) groupedAvailability[slot.date] = [];
        groupedAvailability[slot.date].push(slot);
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top bar */}
            <div className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
                    <button
                        onClick={() => navigate('/dashboard/customer')}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mr-4"
                    >
                        <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{business.name}</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Business Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex flex-col sm:flex-row gap-5">
                        {business.logo_url ? (
                            <img
                                src={business.logo_url}
                                alt={`${business.name} logo`}
                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {business.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{business.name}</h2>
                            {business.summary && (
                                <p className="mt-2 text-gray-600 dark:text-gray-400">{business.summary}</p>
                            )}
                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                {business.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {business.phone}
                                    </span>
                                )}
                                {business.email && (
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {business.email}
                                    </span>
                                )}
                                {business.address && (
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {business.address}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Working Hours */}
                {workingHours.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Working Hours</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
                            {/* Left column: Mon–Thu, Right column: Fri–Sun */}
                            {(() => {
                                const sorted = [...workingHours].sort((a, b) => ((a.day_of_week + 6) % 7) - ((b.day_of_week + 6) % 7));
                                const leftCol = sorted.filter(wh => [1, 2, 3, 4].includes(wh.day_of_week));
                                const rightCol = sorted.filter(wh => [5, 6, 0].includes(wh.day_of_week));
                                const renderDay = (wh) => (
                                    <div key={wh.id || wh.day_of_week} className="flex justify-between text-sm py-1">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{daysOfWeek[wh.day_of_week]}</span>
                                        {wh.is_closed ? (
                                            <span className="text-red-500">Closed</span>
                                        ) : (
                                            <span className="text-gray-600 dark:text-gray-400">{formatTime(wh.open_time)} – {formatTime(wh.close_time)}</span>
                                        )}
                                    </div>
                                );
                                return (
                                    <>
                                        <div>{leftCol.map(renderDay)}</div>
                                        <div>{rightCol.map(renderDay)}</div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* Available Slots + Booking */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Book an Appointment</h3>

                    {availability.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-6">No available slots at the moment.</p>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedAvailability).map(([dateStr, slots]) => (
                                <div key={dateStr}>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{formatDate(dateStr)}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {slots.map(slot => (
                                            <button
                                                key={slot.id}
                                                onClick={() => {
                                                    setSelectedSlot(slot);
                                                    setAppointmentTime(slot.start_time?.slice(0, 5) || '');
                                                    setEndTime(slot.end_time?.slice(0, 5) || '');
                                                }}
                                                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                                                    selectedSlot?.id === slot.id
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                                                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500'
                                                }`}
                                            >
                                                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                                {slot.capacity && (
                                                    <span className="ml-1.5 text-xs text-gray-400">({slot.capacity} spots)</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Booking form — shown when a slot is selected */}
                            {selectedSlot && (
                                <form onSubmit={handleBookAppointment} className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-5 space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Booking for <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedSlot.date)}</span>,{' '}
                                        <span className="font-medium text-gray-900 dark:text-white">{formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}</span>
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
                                            <input
                                                type="time"
                                                value={appointmentTime}
                                                onChange={e => setAppointmentTime(e.target.value)}
                                                min={selectedSlot.start_time?.slice(0, 5)}
                                                max={selectedSlot.end_time?.slice(0, 5)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Time (optional)</label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                min={appointmentTime || selectedSlot.start_time?.slice(0, 5)}
                                                max={selectedSlot.end_time?.slice(0, 5)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes (optional)</label>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={2}
                                            placeholder="Any notes for the provider..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={isBooking}
                                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isBooking ? 'Booking...' : 'Confirm Booking'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSlot(null)}
                                            className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessPage;
