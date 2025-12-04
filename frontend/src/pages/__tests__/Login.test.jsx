/**
 * Tests for Login page component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
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
const renderLogin = () => {
    return render(
        <BrowserRouter>
            <Login />
        </BrowserRouter>
    );
};

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('Rendering', () => {
        it('should render login form with all fields', () => {
            renderLogin();

            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /login to alicetant/i })).toBeInTheDocument();
        });

        it('should render OAuth login options', () => {
            renderLogin();

            expect(screen.getByRole('button', { name: /login with google/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /login with facebook/i })).toBeInTheDocument();
        });
    });

    describe('Form Validation', () => {
        it('should show validation errors for empty required fields', async () => {
            renderLogin();

            const submitButton = screen.getByRole('button', { name: /login to alicetant/i });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/email is required/i)).toBeInTheDocument();
                expect(screen.getByText(/password is required/i)).toBeInTheDocument();
            });
        });

        it('should validate email format', async () => {
            renderLogin();

            const emailInput = screen.getByLabelText(/email address/i);
            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            fireEvent.blur(emailInput);

            await waitFor(() => {
                expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
            });
        });
    });

    describe('API Integration', () => {
        it('should successfully submit form and store token and user data', async () => {
            const mockResponse = {
                token: 'mock-jwt-token-12345',
                user: {
                    id: 1,
                    username: 'john',
                    email: 'john@example.com',
                    role: 'CUSTOMER',
                    full_name: 'John Doe'
                }
            };

            vi.spyOn(api, 'login').mockResolvedValue(mockResponse);

            renderLogin();

            // Fill in form
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'john@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'password123' }
            });

            // Submit form
            fireEvent.click(screen.getByRole('button', { name: /login to alicetant/i }));

            await waitFor(() => {
                expect(api.login).toHaveBeenCalledWith({
                    email: 'john@example.com',
                    password: 'password123'
                });
            });

            // Verify token stored in localStorage
            expect(localStorage.getItem('authToken')).toBe('mock-jwt-token-12345');

            // Verify user data stored in localStorage
            expect(localStorage.getItem('userData')).toBe(JSON.stringify(mockResponse.user));

            // Verify navigation to home page
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });

        it('should handle 401 unauthorized error (invalid credentials)', async () => {
            const mockError = {
                response: {
                    status: 401,
                    data: { error: 'Invalid email or password' }
                }
            };

            vi.spyOn(api, 'login').mockRejectedValue(mockError);

            renderLogin();

            // Fill in form
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'john@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'wrongpassword' }
            });

            // Submit form
            fireEvent.click(screen.getByRole('button', { name: /login to alicetant/i }));

            await waitFor(() => {
                expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
            });
        });

        it('should handle 400 validation error', async () => {
            const mockError = {
                response: {
                    status: 400,
                    data: { error: 'Please check your input and try again.' }
                }
            };

            vi.spyOn(api, 'login').mockRejectedValue(mockError);

            renderLogin();

            // Fill in form
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'john@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'pass' }
            });

            // Submit form
            fireEvent.click(screen.getByRole('button', { name: /login to alicetant/i }));

            await waitFor(() => {
                expect(screen.getByText(/please check your input and try again/i)).toBeInTheDocument();
            });
        });

        it('should handle network error', async () => {
            const mockError = {
                request: {}
            };

            vi.spyOn(api, 'login').mockRejectedValue(mockError);

            renderLogin();

            // Fill in form
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'john@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'password123' }
            });

            // Submit form
            fireEvent.click(screen.getByRole('button', { name: /login to alicetant/i }));

            await waitFor(() => {
                expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument();
            });
        });

        it('should disable submit button while submitting', async () => {
            vi.spyOn(api, 'login').mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            renderLogin();

            // Fill in form
            fireEvent.change(screen.getByLabelText(/email address/i), {
                target: { value: 'john@example.com' }
            });
            fireEvent.change(screen.getByLabelText(/^password/i), {
                target: { value: 'password123' }
            });

            const submitButton = screen.getByRole('button', { name: /login to alicetant/i });
            fireEvent.click(submitButton);

            // Button should be disabled during submission
            expect(submitButton).toBeDisabled();
            expect(screen.getByText(/logging in\.\.\./i)).toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should clear field error when user starts typing', async () => {
            renderLogin();

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
    });
});
