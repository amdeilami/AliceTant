/**
 * Tests for AppointmentHistory Component
 * 
 * Tests the appointment history functionality including:
 * - Fetching and displaying appointments
 * - Sorting appointments (upcoming first, then by date)
 * - Displaying appointment details (date, time, provider, business, status)
 * - Empty state when no appointments exist
 * - Loading and error states
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AppointmentHistory from '../AppointmentHistory';
import api from '../../utils/api';

// Mock the api module
vi.mock('../../utils/api');

describe('AppointmentHistory Component', () => {
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

        render(<AppointmentHistory />);

        expect(screen.getByText(/loading appointments/i)).toBeInTheDocument();
    });

    it('displays appointments after successful fetch', async () => {
        const mockAppointments = [
            {
                id: '1',
                date: '2025-12-10',
                time: '10:00',
                providerName: 'John Smith',
                businessName: 'Smith Hair Salon',
                status: 'upcoming'
            },
            {
                id: '2',
                date: '2025-11-15',
                time: '14:30',
                providerName: 'Jane Doe',
                businessName: 'Doe Tutoring',
                status: 'completed'
            }
        ];

        api.get.mockResolvedValue({ data: mockAppointments });

        render(<AppointmentHistory />);

        // Wait for appointments to load
        await waitFor(() => {
            expect(screen.getByText('Smith Hair Salon')).toBeInTheDocument();
        });

        expect(screen.getByText('Doe Tutoring')).toBeInTheDocument();
        expect(screen.getByText(/Provider: John Smith/i)).toBeInTheDocument();
        expect(screen.getByText(/Provider: Jane Doe/i)).toBeInTheDocument();
    });

    it('displays all required appointment fields', async () => {
        const mockAppointments = [
            {
                id: '1',
                date: '2025-12-10',
                time: '10:00',
                providerName: 'John Smith',
                businessName: 'Smith Hair Salon',
                status: 'upcoming'
            }
        ];

        api.get.mockResolvedValue({ data: mockAppointments });

        render(<AppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText('Smith Hair Salon')).toBeInTheDocument();
        });

        // Check for all required fields
        expect(screen.getByText(/Provider: John Smith/i)).toBeInTheDocument();
        expect(screen.getByText(/Dec.*2025/i)).toBeInTheDocument(); // Date format may vary by timezone
        expect(screen.getByText(/10:00 AM/i)).toBeInTheDocument();
        expect(screen.getByText(/Upcoming/i)).toBeInTheDocument();
    });

    it('displays empty state when no appointments exist', async () => {
        api.get.mockResolvedValue({ data: [] });

        render(<AppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText(/no appointments yet/i)).toBeInTheDocument();
        });

        expect(screen.getByText(/you don't have any appointments/i)).toBeInTheDocument();
    });

    it('displays error state when API call fails', async () => {
        const errorMessage = 'Failed to load appointments';
        api.get.mockRejectedValue({
            response: { data: { message: errorMessage } }
        });

        render(<AppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('sorts appointments with upcoming first', async () => {
        const mockAppointments = [
            {
                id: '1',
                date: '2025-11-15',
                time: '14:30',
                providerName: 'Jane Doe',
                businessName: 'Past Appointment',
                status: 'completed'
            },
            {
                id: '2',
                date: '2025-12-10',
                time: '10:00',
                providerName: 'John Smith',
                businessName: 'Future Appointment',
                status: 'upcoming'
            }
        ];

        api.get.mockResolvedValue({ data: mockAppointments });

        render(<AppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText('Future Appointment')).toBeInTheDocument();
        });

        const appointments = screen.getAllByText(/Provider:/i);
        // The upcoming appointment should appear first
        expect(appointments[0].textContent).toContain('John Smith');
    });

    it('displays status indicators with correct styling', async () => {
        const mockAppointments = [
            {
                id: '1',
                date: '2025-12-10',
                time: '10:00',
                providerName: 'John Smith',
                businessName: 'Smith Hair Salon',
                status: 'upcoming'
            },
            {
                id: '2',
                date: '2025-11-15',
                time: '14:30',
                providerName: 'Jane Doe',
                businessName: 'Doe Tutoring',
                status: 'completed'
            },
            {
                id: '3',
                date: '2025-11-20',
                time: '09:00',
                providerName: 'Bob Johnson',
                businessName: 'Johnson Studio',
                status: 'cancelled'
            }
        ];

        api.get.mockResolvedValue({ data: mockAppointments });

        render(<AppointmentHistory />);

        await waitFor(() => {
            expect(screen.getByText('Upcoming')).toBeInTheDocument();
        });

        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('calls API with correct authorization header', async () => {
        const mockToken = 'test-auth-token';
        Storage.prototype.getItem = vi.fn(() => mockToken);

        api.get.mockResolvedValue({ data: [] });

        render(<AppointmentHistory />);

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith(
                '/appointments/',
                expect.objectContaining({
                    headers: {
                        'Authorization': `Bearer ${mockToken}`
                    }
                })
            );
        });
    });
});
