import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { maskReferenceId } from '../utils/formatId';
import api from '../utils/api';
import BusinessForm from './BusinessForm';
import InlineEditField from './InlineEditField';
import WorkingHoursEditor, { WorkingHoursSummary } from './WorkingHoursEditor';
import ClosuresEditor from './ClosuresEditor';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorDisplay from './ErrorDisplay';

const token = () => localStorage.getItem('authToken');
const authHeaders = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const TABS = [
    { key: 'details', label: 'Details', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'hours', label: 'Working Hours', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'closures', label: 'Closures', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
];

const BusinessManagement = () => {
    const { showSuccess, showError } = useToast();
    const [businesses, setBusinesses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [activeTab, setActiveTab] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchBusinesses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/businesses/', authHeaders());
            setBusinesses(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load businesses');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchBusinesses(); }, []);

    const handleCreateBusiness = async (data) => {
        try {
            const response = await api.post('/businesses/', data, authHeaders());
            setBusinesses([response.data, ...businesses]);
            setShowCreateForm(false);
            showSuccess('Business created!');
        } catch (err) {
            showError(err.response?.data?.error || 'Failed to create business');
            throw err;
        }
    };

    const handleFieldUpdate = async (businessId, field, value) => {
        try {
            const response = await api.patch(`/businesses/${businessId}/`, { [field]: value }, authHeaders());
            setBusinesses(prev => prev.map(b => b.id === businessId ? response.data : b));
            showSuccess('Updated!');
        } catch (err) {
            showError(err.response?.data?.error || `Failed to update ${field}`);
            throw err;
        }
    };

    const handleDeleteBusiness = async (businessId) => {
        try {
            await api.delete(`/businesses/${businessId}/`, authHeaders());
            setBusinesses(prev => prev.filter(b => b.id !== businessId));
            setDeleteConfirm(null);
            setExpandedId(null);
            showSuccess('Business deleted!');
        } catch (err) {
            showError(err.response?.data?.error || 'Failed to delete business');
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
        if (!activeTab[id]) setActiveTab(prev => ({ ...prev, [id]: 'details' }));
    };

    const getTab = (id) => activeTab[id] || 'details';
    const setTab = (id, tab) => setActiveTab(prev => ({ ...prev, [id]: tab }));

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Businesses</h2>
                <LoadingSkeleton.Card count={3} />
            </div>
        );
    }

    if (error && businesses.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Businesses</h2>
                <ErrorDisplay message={error} onRetry={fetchBusinesses} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Businesses</h2>
                    <p className="text-gray-600 mt-1 text-sm">Click a business to expand and edit fields inline</p>
                </div>
                {!showCreateForm && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center text-sm"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        New Business
                    </button>
                )}
            </div>

            {showCreateForm && (
                <div className="mb-6">
                    <BusinessForm
                        business={null}
                        onSubmit={handleCreateBusiness}
                        onCancel={() => setShowCreateForm(false)}
                    />
                </div>
            )}

            {!showCreateForm && businesses.length === 0 && (
                <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses yet</h3>
                    <p className="text-gray-600 mb-6">Create your first business to start accepting appointments</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Create Your First Business
                    </button>
                </div>
            )}

            {!showCreateForm && businesses.length > 0 && (
                <div className="space-y-4">
                    {businesses.map((biz) => {
                        const isExpanded = expandedId === biz.id;
                        const tab = getTab(biz.id);

                        return (
                            <div
                                key={biz.id}
                                className={`border rounded-lg transition-all ${
                                    isExpanded ? 'border-indigo-300 shadow-md' : 'border-gray-200 hover:shadow-sm'
                                }`}
                            >
                                {/* Collapsed header */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer"
                                    onClick={() => toggleExpand(biz.id)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {biz.logo_url ? (
                                            <img src={biz.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-indigo-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {biz.name}
                                                <span className="font-mono text-xs text-gray-400 ml-2 font-normal" title={`Ref: ${biz.reference_id}`}>#{maskReferenceId(biz.reference_id)}</span>
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>{biz.phone}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="hidden sm:inline truncate">{biz.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="hidden sm:block">
                                            <WorkingHoursSummary businessId={biz.id} />
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"
                                        >
                                            <path d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100">
                                        {/* Tabs */}
                                        <div className="flex border-b border-gray-100 px-4">
                                            {TABS.map(t => (
                                                <button
                                                    key={t.key}
                                                    onClick={() => setTab(biz.id, t.key)}
                                                    className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                                        tab === t.key
                                                            ? 'border-indigo-600 text-indigo-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d={t.icon} />
                                                    </svg>
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="p-4">
                                            {tab === 'details' && (
                                                <div className="space-y-3">
                                                    <InlineEditField
                                                        label="Business Name"
                                                        value={biz.name}
                                                        onSave={(v) => handleFieldUpdate(biz.id, 'name', v)}
                                                    />
                                                    <InlineEditField
                                                        label="Summary"
                                                        value={biz.summary || ''}
                                                        onSave={(v) => handleFieldUpdate(biz.id, 'summary', v)}
                                                        placeholder="Describe your business and services..."
                                                        multiline
                                                        maxLength={4096}
                                                    />
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <InlineEditField
                                                            label="Phone"
                                                            value={biz.phone}
                                                            onSave={(v) => handleFieldUpdate(biz.id, 'phone', v)}
                                                            type="tel"
                                                        />
                                                        <InlineEditField
                                                            label="Email"
                                                            value={biz.email}
                                                            onSave={(v) => handleFieldUpdate(biz.id, 'email', v)}
                                                            type="email"
                                                        />
                                                    </div>
                                                    <InlineEditField
                                                        label="Address"
                                                        value={biz.address}
                                                        onSave={(v) => handleFieldUpdate(biz.id, 'address', v)}
                                                        multiline
                                                    />

                                                    <div className="pt-4 mt-4 border-t border-gray-100">
                                                        <button
                                                            onClick={() => setDeleteConfirm(biz)}
                                                            className="text-sm text-red-600 hover:text-red-700 hover:underline"
                                                        >
                                                            Delete this business...
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {tab === 'hours' && (
                                                <WorkingHoursEditor businessId={biz.id} />
                                            )}

                                            {tab === 'closures' && (
                                                <ClosuresEditor businessId={biz.id} />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Business</h3>
                        <p className="text-gray-600 mb-2">
                            Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.name}"</span>?
                        </p>
                        <p className="text-sm text-red-600 mb-6">
                            This will also delete all associated appointments, availability slots, working hours, and closures.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteBusiness(deleteConfirm.id)}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessManagement;
