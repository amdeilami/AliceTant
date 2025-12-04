/**
 * Tests for Signup page component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../Signup';
import * as api from '../../utils/api';

// Mock the API module
vi.mock('../../utils/api');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Helper to render component with router
const renderSignup = () => {
    return render(
        <BrowserRouter>
            <Signup />
        </BrowserRouter>
    );
};

describe('Signup Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('Rendering', () => {
        it('should render signup form with all fields', () => {
            renderSignup();

            expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
        });

        it('should render role selection with customer selected by default', () => {
            renderSignup();

            const customerRadio = screen.getByLabelText(/customer role/i);
            const providerRadio = screen.getByLabelText(/provider role/i);

            expect(customerRadio).toBeChecked();
            expect(providerRadio).not.toBeChecked();
        });
    });

    describe('Form Validation', () => {
        it('should show validation errors for empty required fields', async () => {
            renderSignup();

            const submitButton = screen.getByRole('button', { name: /sign up/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
                expect(screen.getByText(/email is required/i)).toBeInTheDocument();
                expect(screen.getByText(/password is required/i)).toBeInTheDocument();
            });
        });

        it('should validate password requirements', async () => {
            renderSignup();

            const passwordInput = screen.getByLabelText(/^password/i);
            fireEvent.change(passwordInput, { target: { value: 'short' } });
            fireEvent.blur(passwordInput);

            await waitFor(() => {
                expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
            });
        });

        it('should validate password confirmation match', async () => {
            renderSignup();

            const passwordInput = screen.getByLabelText(/^password/i);
            const confirmInput = screen.getByLabelText(/confirm password/i);

            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(confirmInput, { target: { value: 'different123' } });
            fireEvent.blur(confirmInput);

            await waitFor(() => {
                expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
            });
        });
    });

    describe('API Integration', () => {
        it('should successfully submit form and navigate to login', async () => {
            const mockResponse = {
                id: 1,
                full_name: 'John Doe',
                email: 'john@example.com',
                username: 'john',
                role: 'customer'
            };

            vi.spyOn(api, 'signup').mockResolvedValue(mockResponse);
            vi.spyOn(window, 'alert').mockImplementation(() => { });

            renderSignup();

            // Fill in form
            fireEvent.change(screen.getByLabelText(/full name/i), {
                target: { value: 'John Doe' }
            });
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'john@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByLabelText(/confirm password/i), {
                target: { value: 'password123' }
            });

            // Submit form
            fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

            await waitFor(() => {
                expect(api.signup).toHaveBeenCalledWith({
                    full_name: 'John Doe',
                    email: 'john@example.com',
                    phone_number: null,
                    password: 'password123',
                    role: 'customer'
                });
            });

            // Verify user data stored in localStorage
            expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse));

            // Verify navigation to login
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });

        it('should handle 409 conflict error (duplicate email)', async () => {
            const mockError = {
                response: {
                    status: 409,
                    data: { error: 'An account with this email already exists' }
                }
            };

            vi.spyOn(api, 'signup').mockRejectedValue(mockError);

            renderSignup();

            // Fill in valid form data
            fireEvent.change(screen.getByLabelText(/full name/i), {
                target: { value: 'John Doe' }
            });
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'existing@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByLabelText(/confirm password/i), {
                target: { value: 'password123' }
            });

            // Submit form
            fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

            await waitFor(() => {
                expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
            });
        });

        it('should handle 400 validation error', async () => {
            const mockError = {
                response: {
                    status: 400,
                    data: { error: 'Invalid input data' }
                }
            };

            vi.spyOn(api, 'signup').mockRejectedValue(mockError);

            renderSignup();

            // Fill in form
            fireEvent.change(screen.getByLabelText(/full name/i), {
                target: { value: 'John Doe' }
            });
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'john@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByLabelText(/confirm password/i), {
                target: { value: 'password123' }
            });

            // Submit form
            fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

            await waitFor(() => {
                expect(screen.getByText(/invalid input data/i)).toBeInTheDocument();
            });
        });

        it('should handle network error', async () => {
            const mockError = {
                request: {}
            };

            vi.spyOn(api, 'signup').mockRejectedValue(mockError);

            renderSignup();

            // Fill in form
            fireEvent.change(screen.getByLabelText(/full name/i), {
                target: { value: 'John Doe' }
            });
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'john@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByLabelText(/confirm password/i), {
                target: { value: 'password123' }
            });

            // Submit form
            fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

            await waitFor(() => {
                expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument();
            });
        });

        it('should disable submit button while submitting', async () => {
            vi.spyOn(api, 'signup').mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            renderSignup();

            // Fill in form
            fireEvent.change(screen.getByLabelText(/full name/i), {
                target: { value: 'John Doe' }
            });
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'john@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'password123' }
            });
            fireEvent.change(screen.getByLabelText(/confirm password/i), {
                target: { value: 'password123' }
            });

            const submitButton = screen.getByRole('button', { name: /sign up/i });
            fireEvent.click(submitButton);

            // Button should be disabled during submission
            expect(submitButton).toBeDisabled();
            expect(screen.getByText(/creating account/i)).toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should clear field error when user starts typing', async () => {
            renderSignup();

            const emailInput = screen.getByLabelText(/email address/i);

            // Trigger validation error
            fireEvent.blur(emailInput);

            await waitFor(() => {
                expect(screen.getByText(/email is required/i)).toBeInTheDocument();
            });

            // Start typing
            fireEvent.change(emailInput, { target: { value: 'j' } });

            // Error should be cleared
            expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
        });

        it('should allow role selection change', () => {
            renderSignup();

            const providerRadio = screen.getByLabelText(/provider role/i);
            fireEvent.click(providerRadio);

            expect(providerRadio).toBeChecked();
        });
    });
});
