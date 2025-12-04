/**
 * Tests for ProviderAppointmentHistory Component
 * 
 * Tests the provider appointment history functionality including:
 * - Fetching and displaying past appointments
 * - Sorting appointments by date in descending order (newest first)
 * - Displaying appointment details (customer name, date, time, business name)
 * - Empty state when no past appointments exist
 * - Loading and error states
 * - Filtering to show only past appointments
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProviderAppointmentHistory from '../ProviderAppointmentHistory';
import api from '../../utils/api';

// Mock the api module
vi.mock('../../utils/api');

describe('ProviderAppointmentHistory Component', () => {
    beforeEach(() => {
        // Mock localStorage
        Storage.prototype.getItem = vi.fn(() => 'mock-token');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('displays loading state initially', () => {
        // Mock API to never resolve
        api.get.mockImplementation(() => new Promise(() => { }));

        render(<ProviderAppointmentHistory />);

        expect(screen.getByText(/loading appointment history/i)).toBeInTheDocument();
    });

    it('displays past appointments after successful fetch', async () => {
        const mockAppointments = [
            {
                id: '1',
                customerName: 'Alice Johnson',
                customerEmail: 'alice@example.com',
                businessName: 'Smith Hair Salon',
                date: '2025-11-20',
                time: '11:00',
                status: 'completed'
            },
            {
                id: '2',
                customerName: 'Bob Williams',
                customerEmail: 'bob@example.com',
                businessName: 'Smith Tutoring',
                date: '2025-11-15',
                time: '14:30',
                status: 'completed'
            }
        ];

        api.get.mockResolvedValue({ data: mockAppointments });

        render(<ProviderAppointmentHistory />);

        // Wait for appointments to load
        await waitFor(() => {
            expect(screen.getByText('Smith Hair Salon')).toBeInTheDocument();
        });

        expect(screen.getByText('Smith Tutoring')).toBeInTheDocument();
        expect(screen.getByText(/Customer: Alice Johnson/i)).toBeInTheDocument();
        expect(screen.getByText(/Customer: Bob Williams/i)).toBeInTheDocument();
    });

    it('displays all required appointment fields', async () => {
        const mockAppointments = [
            {
                id: '1',
                customerName: 'Alice Johnson',
                customerEmail: 'alice@example.com',
                businessName: 'Smith Hair Salon',
                date: '2025-11-20',
                time: '11:00',
                status: 'completed'
            }
        ];

        api.get.mockResolvedValue({ data: mockAppointments });

        render(<ProviderAppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText('Smith Hair Salon')).toBeInTheDocument();
        });

        // Check for all required fields
        expect(screen.getByText(/Customer: Alice Johnson/i)).toBeInTheDocument();
        expect(screen.getByText(/Nov.*2025/i)).toBeInTheDocument(); // Date format may vary
        expect(screen.getByText(/11:00 AM/i)).toBeInTheDocument();
        expect(screen.getByText(/Completed/i)).toBeInTheDocument();
    });

    it('displays empty state when no past appointments exist', async () => {
        api.get.mockResolvedValue({ data: [] });

        render(<ProviderAppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText(/no past appointments/i)).toBeInTheDocument();
        });

        expect(screen.getByText(/you don't have any past appointments yet/i)).toBeInTheDocument();
    });

    it('displays error state when API call fails', async () => {
        const errorMessage = 'Failed to load appointment history';
        api.get.mockRejectedValue({
            response: { data: { message: errorMessage } }
        });

        render(<ProviderAppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('sorts appointments by date in descending order (newest first)', async () => {
        const mockAppointments = [
            {
                id: '1',
                customerName: 'Alice Johnson',
                customerEmail: 'alice@example.com',
                businessName: 'Older Appointment',
                date: '2025-11-10',
                time: '10:00',
                status: 'completed'
            },
            {
                id: '2',
                customerName: 'Bob Williams',
                customerEmail: 'bob@example.com',
                businessName: 'Newer Appointment',
                date: '2025-11-20',
                time: '14:00',
                status: 'completed'
            }
        ];

        api.get.mockResolvedValue({ data: mockAppointments });

        render(<ProviderAppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText('Newer Appointment')).toBeInTheDocument();
        });

        const appointments = screen.getAllByText(/Customer:/i);
        // The newer appointment should appear first
        expect(appointments[0].textContent).toContain('Bob Williams');
    });

    it('filters to show only past appointments', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);
        const pastDateStr = pastDate.toISOString().split('T')[0];

        const mockAppointments = [
            {
                id: '1',
                customerName: 'Alice Johnson',
                customerEmail: 'alice@example.com',
                businessName: 'Past Appointment',
                date: pastDateStr,
                time: '10:00',
                status: 'completed'
            },
            {
                id: '2',
                customerName: 'Bob Williams',
                customerEmail: 'bob@example.com',
                businessName: 'Future Appointment',
                date: futureDateStr,
                time: '14:00',
                status: 'confirmed'
            }
        ];

        api.get.mockResolvedValue({ data: mockAppointments });

        render(<ProviderAppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText('Past Appointment')).toBeInTheDocument();
        });

        // Future appointment should not be displayed
        expect(screen.queryByText('Future Appointment')).not.toBeInTheDocument();
    });

    it('displays status indicators with correct styling', async () => {
        const mockAppointments = [
            {
                id: '1',
                customerName: 'Alice Johnson',
                customerEmail: 'alice@example.com',
                businessName: 'Smith Hair Salon',
                date: '2025-11-20',
                time: '11:00',
                status: 'completed'
            },
            {
                id: '2',
                customerName: 'Bob Williams',
                customerEmail: 'bob@example.com',
                businessName: 'Smith Tutoring',
                date: '2025-11-15',
                time: '14:30',
                status: 'cancelled'
            }
        ];

        api.get.mockResolvedValue({ data: mockAppointments });

        render(<ProviderAppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText('Completed')).toBeInTheDocument();
        });

        expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('calls API with correct authorization header', async () => {
        const mockToken = 'test-auth-token';
        Storage.prototype.getItem = vi.fn(() => mockToken);

        api.get.mockResolvedValue({ data: [] });

        render(<ProviderAppointmentHistory />);

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith(
                '/appointments/provider/',
                expect.objectContaining({
                    headers: {
                        'Authorization': `Bearer ${mockToken}`
                    }
                })
            );
        });
    });
});
