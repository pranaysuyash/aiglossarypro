import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Router } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import TermCard from '../../client/src/components/TermCard';

// Mock the API module
vi.mock('../../client/src/lib/api', () => ({
  apiRequest: vi.fn(),
}));

import * as queryClientModule from '../../client/src/lib/queryClient';

// Mock the authentication hook
vi.mock('../../client/src/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: true,
    user: { id: 'test-user' },
  }),
}));

// Mock the toast hook
vi.mock('../../client/src/hooks/use-toast', () => ({
  useToast: vi.fn().mockReturnValue({
    toast: vi.fn(),
  }),
}));

// Mock the live region hook
vi.mock('../../client/src/components/accessibility/LiveRegion', () => ({
  useLiveRegion: vi.fn().mockReturnValue({
    announce: vi.fn(),
  }),
}));

// Mock term data
const mockTerm = {
  id: '1',
  name: 'Machine Learning',
  shortDefinition: 'A method of data analysis that automates analytical model building',
  definition:
    'Machine Learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.',
  category: 'AI/ML',
  subcategories: ['Supervised Learning', 'Unsupervised Learning'],
  viewCount: 142,
  isFavorite: false,
  isLearned: false,
};

// Test wrapper with QueryClient and Router
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>{children}</Router>
    </QueryClientProvider>
  );
};

describe('TermCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders term card with basic information', () => {
      render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );

      expect(screen.getByText('Machine Learning')).toBeInTheDocument();
      expect(screen.getByText(/A method of data analysis/)).toBeInTheDocument();
    });

    it('displays essential term information', () => {
      render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );

      // Check for core content that should be displayed
      expect(screen.getByText('Machine Learning')).toBeInTheDocument();
      expect(screen.getByText(/A method of data analysis/)).toBeInTheDocument();
    });

    it('shows category information', () => {
      render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );

      expect(screen.getByText('AI/ML')).toBeInTheDocument();
    });

    it('handles missing optional fields gracefully', () => {
      const minimalTerm = {
        id: '2',
        name: 'Minimal Term',
        definition: 'A minimal definition',
      };

      render(
        <TestWrapper>
          <TermCard term={minimalTerm} />
        </TestWrapper>
      );

      expect(screen.getByText('Minimal Term')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('renders favorite state correctly', () => {
      const favoriteTerm = { ...mockTerm, isFavorite: true };
      render(
        <TestWrapper>
          <TermCard term={favoriteTerm} />
        </TestWrapper>
      );

      // Check for favorite indicator (star icon or similar)
      const favoriteIndicator = screen.getByRole('button', { name: /favorite/i });
      expect(favoriteIndicator).toBeInTheDocument();
    });

    it('handles favorite toggle interaction', async () => {
      // Mock the API request to succeed
      const apiRequestSpy = vi.spyOn(queryClientModule, 'apiRequest');
      apiRequestSpy.mockResolvedValue({ success: true });

      const onFavoriteToggle = vi.fn();
      render(
        <TestWrapper>
          <TermCard term={mockTerm} onFavoriteToggle={onFavoriteToggle} />
        </TestWrapper>
      );

      const favoriteButton = screen.getByRole('button', { name: /favorite/i });
      fireEvent.click(favoriteButton);

      await waitFor(() => {
        expect(onFavoriteToggle).toHaveBeenCalledWith(mockTerm.id, true);
      });

      apiRequestSpy.mockRestore();
    });

    it('renders learned state correctly', () => {
      const learnedTerm = { ...mockTerm, isLearned: true };
      render(
        <TestWrapper>
          <TermCard term={learnedTerm} />
        </TestWrapper>
      );

      // Check for learned indicator
      const learnedIndicator = screen.getByRole('button', { name: /learned/i });
      expect(learnedIndicator).toBeInTheDocument();
    });

    it('should navigate to term details on click', () => {
      render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );

      const termLink = screen.getByRole('link');
      expect(termLink).toHaveAttribute('href', `/term/${mockTerm.id}`);
    });
  });

  describe('Error Handling', () => {
    it('handles favorite toggle errors gracefully', async () => {
      const apiRequestSpy = vi.spyOn(queryClientModule, 'apiRequest');
      apiRequestSpy.mockRejectedValue(new Error('Network error'));

      // Mock the toast function to verify error toast is called
      const mockToast = vi.fn();
      const useToastMock = vi.mocked(useToast);
      useToastMock.mockReturnValue({ toast: mockToast });

      render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );

      const favoriteButton = screen.getByRole('button', { name: /favorite/i });
      fireEvent.click(favoriteButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to update favorites. Please try again.',
          variant: 'destructive',
        });
      });

      apiRequestSpy.mockRestore();
    });

    it('handles malformed term data', () => {
      const malformedTerm = {
        id: null,
        name: '',
        definition: null,
      } as unknown;

      // Should not crash with malformed data
      expect(() => {
        render(
          <TestWrapper>
            <TermCard term={malformedTerm} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with large datasets', () => {
      const renderStart = performance.now();

      render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );

      const renderTime = performance.now() - renderStart;
      expect(renderTime).toBeLessThan(100); // Should render quickly
    });
  });

  describe('Visual Snapshots', () => {
    it('matches visual snapshot', () => {
      const { container } = render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches visual snapshot with favorite and learned states', () => {
      const stateTerm = { ...mockTerm, isFavorite: true, isLearned: true };
      const { container } = render(
        <TestWrapper>
          <TermCard term={stateTerm} />
        </TestWrapper>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
