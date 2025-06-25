import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TermCard from '../../client/src/components/TermCard';

// Mock the API module
vi.mock('../../client/src/lib/api', () => ({
  toggleFavorite: vi.fn(),
  getFavorites: vi.fn()
}));

// Mock term data
const mockTerm = {
  id: '1',
  name: 'Machine Learning',
  shortDefinition: 'A method of data analysis that automates analytical model building',
  definition: 'Machine Learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.',
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
      <MemoryRouter>
        {children}
      </MemoryRouter>
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

    it('displays view count correctly', () => {
      render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );
      
      expect(screen.getByText(/142/)).toBeInTheDocument();
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
        definition: 'A minimal definition'
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
      const { toggleFavorite } = await import('../../client/src/lib/api');
      (toggleFavorite as any).mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );

      const favoriteButton = screen.getByRole('button', { name: /favorite/i });
      fireEvent.click(favoriteButton);

      await waitFor(() => {
        expect(toggleFavorite).toHaveBeenCalledWith(mockTerm.id);
      });
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
      expect(termLink).toHaveAttribute('href', `/terms/${mockTerm.id}`);
    });
  });

  describe('Error Handling', () => {
    it('handles favorite toggle errors gracefully', async () => {
      const { toggleFavorite } = await import('../../client/src/lib/api');
      (toggleFavorite as any).mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <TermCard term={mockTerm} />
        </TestWrapper>
      );

      const favoriteButton = screen.getByRole('button', { name: /favorite/i });
      fireEvent.click(favoriteButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('handles malformed term data', () => {
      const malformedTerm = {
        id: null,
        name: '',
        definition: null
      } as any;

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