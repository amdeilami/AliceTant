/**
 * Tests for API utility functions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios module
vi.mock('axios');

describe('API Utility', () => {
    let mockPost;

    beforeEach(async () => {
        mockPost = vi.fn();
        axios.create = vi.fn(() => ({
            post: mockPost
        }));

        // Clear module cache and re-import
        vi.resetModules();
    });

    describe('signup', () => {
        it('should successfully register a new user', async () => {
            const { signup } = await import('../api');

            const mockUserData = {
                full_name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                role: 'customer'
            };

            const mockResponse = {
                data: {
                    id: 1,
                    full_name: 'John Doe',
                    email: 'john@example.com',
                    username: 'john',
                    role: 'customer'
                }
            };

            mockPost.mockResolvedValue(mockResponse);

            const result = await signup(mockUserData);

            expect(mockPost).toHaveBeenCalledWith('/auth/signup/', mockUserData);
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle signup errors', async () => {
            const { signup } = await import('../api');

            const mockUserData = {
                full_name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                role: 'customer'
            };

            const mockError = {
                response: {
                    status: 409,
                    data: { error: 'Email already exists' }
                }
            };

            mockPost.mockRejectedValue(mockError);

            await expect(signup(mockUserData)).rejects.toEqual(mockError);
        });
    });

    describe('login', () => {
        it('should successfully authenticate a user', async () => {
            const { login } = await import('../api');

            const mockCredentials = {
                email: 'john@example.com',
                password: 'password123'
            };

            const mockResponse = {
                data: {
                    token: 'jwt-token-here',
                    user: {
                        id: 1,
                        full_name: 'John Doe',
                        email: 'john@example.com',
                        username: 'john',
                        role: 'customer'
                    }
                }
            };

            mockPost.mockResolvedValue(mockResponse);

            const result = await login(mockCredentials);

            expect(mockPost).toHaveBeenCalledWith('/auth/login/', mockCredentials);
            expect(result).toEqual(mockResponse.data);
            expect(result.token).toBeDefined();
            expect(result.user).toBeDefined();
        });

        it('should handle invalid credentials', async () => {
            const { login } = await import('../api');

            const mockCredentials = {
                email: 'john@example.com',
                password: 'wrongpassword'
            };

            const mockError = {
                response: {
                    status: 401,
                    data: { error: 'Invalid credentials' }
                }
            };

            mockPost.mockRejectedValue(mockError);

            await expect(login(mockCredentials)).rejects.toEqual(mockError);
        });
    });
});
