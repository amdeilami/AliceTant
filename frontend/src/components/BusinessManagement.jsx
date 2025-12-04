/**
 * BusinessManagement Component
 * 
 * Interface for providers to create, view, edit, and delete their businesses.
 * 
 * Features:
 * - Display all businesses in a grid/list
 * - Create new businesses
 * - Edit existing businesses
 * - Delete businesses with confirmation
 * - Empty state when no businesses exist
 * - Loading and error states
 * 
 * Props:
 * - None (fetches data internally)
 */
import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';
import BusinessForm from './BusinessForm';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorDisplay from './ErrorDisplay';

const BusinessManagement = () => {
    const { showSuccess, showError } = useToast();
    const [businesses, setBusinesses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    /**
     * Fetch all businesses for the current provider.
     */
    const fetchBusinesses = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.get('/businesses/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setBusinesses(response.data);
        } catch (err) {
            console.error('Error fetching businesses:', err);
            setError(err.response?.data?.error || 'Failed to load businesses');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    /**
     * Handle creating a new business.
     * @param {Object} businessData - Business form data
     */
    const handleCreateBusiness = async (businessData) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.post('/businesses/', businessData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Add new business to list
            setBusinesses([response.data, ...businesses]);
            setShowForm(false);
            showSuccess('Business created successfully!');
        } catch (err) {
            console.error('Error creating business:', err);
            showError(err.response?.data?.error || 'Failed to create business');
            throw err; // Let form handle the error
        }
    };

    /**
     * Handle updating an existing business.
     * @param {Object} businessData - Updated business form data
     */
    const handleUpdateBusiness = async (businessData) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await api.put(
                `/businesses/${editingBusiness.id}/`,
                businessData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Update business in list
            setBusinesses(businesses.map(b =>
                b.id === editingBusiness.id ? response.data : b
            ));
            setEditingBusiness(null);
            setShowForm(false);
            showSuccess('Business updated successfully!');
        } catch (err) {
            console.error('Error updating business:', err);
            showError(err.response?.data?.error || 'Failed to update business');
            throw err; // Let form handle the error
        }
    };

    /**
     * Handle deleting a business.
     * @param {number} businessId - ID of business to delete
     */
    const handleDeleteBusiness = async (businessId) => {
        try {
            const token = localStorage.getItem('authToken');
            await api.delete(`/businesses/${businessId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Remove business from list
            setBusinesses(businesses.filter(b => b.id !== businessId));
            setDeleteConfirm(null);
            showSuccess('Business deleted successfully!');
        } catch (err) {
            console.error('Error deleting business:', err);
            const errorMsg = err.response?.data?.error || 'Failed to delete business';
            setError(errorMsg);
            showError(errorMsg);
        }
    };

    /**
     * Open form for creating a new business.
     */
    const handleCreateClick = () => {
        setEditingBusiness(null);
        setShowForm(true);
    };

    /**
     * Open form for editing an existing business.
     * @param {Object} business - Business to edit
     */
    const handleEditClick = (business) => {
        setEditingBusiness(business);
        setShowForm(true);
    };

    /**
     * Cancel form and close it.
     */
    const handleCancelForm = () => {
        setShowForm(false);
        setEditingBusiness(null);
    };

    /**
     * Show delete confirmation dialog.
     * @param {Object} business - Business to delete
     */
    const handleDeleteClick = (business) => {
        setDeleteConfirm(business);
    };

    /**
     * Cancel delete operation.
     */
    const handleCancelDelete = () => {
        setDeleteConfirm(null);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Businesses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <LoadingSkeleton.Card count={3} />
                </div>
            </div>
        );
    }

    // Error state
    if (error && businesses.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Businesses</h2>
                <ErrorDisplay message={error} onRetry={fetchBusinesses} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Businesses</h2>
                    <p className="text-gray-600 mt-1">Create and manage your service offerings</p>
                </div>
                {!showForm && (
                    <button
                        onClick={handleCreateClick}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        Create Business
                    </button>
                )}
            </div>

            {/* Error message (non-blocking) */}
            {error && businesses.length > 0 && (
                <ErrorDisplay message={error} className="mb-4" />
            )}

            {/* Business Form */}
            {showForm && (
                <div className="mb-6">
                    <BusinessForm
                        business={editingBusiness}
                        onSubmit={editingBusiness ? handleUpdateBusiness : handleCreateBusiness}
                        onCancel={handleCancelForm}
                    />
                </div>
            )}

            {/* Business List */}
            {!showForm && businesses.length === 0 && (
                <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses yet</h3>
                    <p className="text-gray-600 mb-6">Create your first business to start accepting appointments</p>
                    <button
                        onClick={handleCreateClick}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        Create Your First Business
                    </button>
                </div>
            )}

            {!showForm && businesses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {businesses.map((business) => (
                        <div
                            key={business.id}
                            className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                        >
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                                {business.name}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-3">
                                {business.description}
                            </p>
                            <div className="space-y-2 mb-4 text-xs sm:text-sm text-gray-600">
                                <div className="flex items-start">
                                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{business.phone}</span>
                                </div>
                                <div className="flex items-start">
                                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="break-all">{business.email}</span>
                                </div>
                                <div className="flex items-start">
                                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{business.address}</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                <button
                                    onClick={() => handleEditClick(business)}
                                    className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm sm:text-base"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(business)}
                                    className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm sm:text-base"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-modal-title"
                    aria-describedby="delete-modal-description"
                    onClick={handleCancelDelete}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            handleCancelDelete();
                        }
                    }}
                >
                    <div
                        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 id="delete-modal-title" className="text-xl font-bold text-gray-900 mb-4">
                            Delete Business
                        </h3>
                        <p id="delete-modal-description" className="text-gray-600 mb-6">
                            Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                aria-label="Cancel deletion"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteBusiness(deleteConfirm.id)}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                aria-label={`Confirm deletion of ${deleteConfirm.name}`}
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
