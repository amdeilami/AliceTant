/**
 * Tests for SearchBar Component
 * 
 * Tests the search bar functionality including:
 * - Rendering with placeholder text
 * - Accepting text input
 * - Debounced search callback
 * - Focus styling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from '../SearchBar';

describe('SearchBar Component', () => {
    let mockOnSearch;

    beforeEach(() => {
        mockOnSearch = vi.fn();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('renders with default placeholder text', () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText(/search for providers or businesses/i);
        expect(input).toBeInTheDocument();
    });

    it('renders with custom placeholder text', () => {
        const customPlaceholder = 'Find a service provider';
        render(<SearchBar onSearch={mockOnSearch} placeholder={customPlaceholder} />);

        const input = screen.getByPlaceholderText(customPlaceholder);
        expect(input).toBeInTheDocument();
    });

    it('accepts text input without errors', () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByRole('textbox');

        // Type in the search bar
        fireEvent.change(input, { target: { value: 'hair stylist' } });

        // Verify the input value changed
        expect(input.value).toBe('hair stylist');
    });

    it('displays search icon', () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        // Check for SVG search icon
        const searchIcon = document.querySelector('svg');
        expect(searchIcon).toBeInTheDocument();
    });

    it('calls onSearch callback after debounce delay', async () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByRole('textbox');

        // Type in the search bar
        fireEvent.change(input, { target: { value: 'massage' } });

        // onSearch should not be called immediately
        expect(mockOnSearch).not.toHaveBeenCalled();

        // Fast-forward time by 500ms (debounce delay)
        vi.advanceTimersByTime(500);

        // Now onSearch should be called with the search query
        expect(mockOnSearch).toHaveBeenCalledWith('massage');
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    it('debounces multiple rapid inputs', async () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByRole('textbox');

        // Type multiple characters rapidly
        fireEvent.change(input, { target: { value: 'h' } });
        vi.advanceTimersByTime(100);

        fireEvent.change(input, { target: { value: 'ha' } });
        vi.advanceTimersByTime(100);

        fireEvent.change(input, { target: { value: 'hai' } });
        vi.advanceTimersByTime(100);

        fireEvent.change(input, { target: { value: 'hair' } });

        // onSearch should not be called yet
        expect(mockOnSearch).not.toHaveBeenCalled();

        // Fast-forward time by 500ms
        vi.advanceTimersByTime(500);

        // onSearch should only be called once with the final value
        expect(mockOnSearch).toHaveBeenCalledWith('hair');
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    it('has proper focus styling classes', () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByRole('textbox');

        // Check for focus-related CSS classes
        expect(input.className).toContain('focus:ring-2');
        expect(input.className).toContain('focus:ring-indigo-500');
        expect(input.className).toContain('focus:border-indigo-500');
    });

    it('has accessible aria-label', () => {
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByLabelText(/search for providers or businesses/i);
        expect(input).toBeInTheDocument();
    });
});
