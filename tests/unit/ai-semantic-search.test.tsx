import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AISemanticSearch } from '../../client/src/components/AISemanticSearch';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = vi.fn();

// Mock API responses
const mockSearchResults = {
  results: [
    {
      id: '1',
      term: 'Neural Networks',
      definition: 'Computational models inspired by biological neural networks',
      relevanceScore: 0.95,
      category: 'Deep Learning',
    },
    {
      id: '2',
      term: 'Machine Learning',
      definition: 'A subset of AI that enables computers to learn from data',
      relevanceScore: 0.87,
      category: 'AI Fundamentals',
    },
  ],
  suggestions: ['deep learning', 'artificial neural networks'],
  totalCount: 2,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AISemanticSearch', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input correctly', () => {
    render(<AISemanticSearch />, { wrapper: createWrapper() });
    
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('performs semantic search when user types', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural networks');
    
    // Wait for debounced search
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/semantic-search'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('neural networks'),
        })
      );
    });
  });

  it('displays search results correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural');
    
    await waitFor(() => {
      expect(screen.getByText('Neural Networks')).toBeInTheDocument();
      expect(screen.getByText(/computational models inspired/i)).toBeInTheDocument();
    });
  });

  it('shows relevance scores for results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch showRelevanceScores={true} />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural');
    
    await waitFor(() => {
      expect(screen.getByText(/95%/)).toBeInTheDocument();
      expect(screen.getByText(/87%/)).toBeInTheDocument();
    });
  });

  it('handles search suggestions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch showSuggestions={true} />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural');
    
    await waitFor(() => {
      expect(screen.getByText('deep learning')).toBeInTheDocument();
      expect(screen.getByText('artificial neural networks')).toBeInTheDocument();
    });
  });

  it('handles empty search results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], suggestions: [], totalCount: 0 }),
    });

    const user = userEvent.setup();
    render(<AISemanticSearch />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'nonexistent term');
    
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<AISemanticSearch />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural');
    
    await waitFor(() => {
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
    });
  });

  it('calls onResultClick when result is clicked', async () => {
    const mockOnResultClick = vi.fn();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch onResultClick={mockOnResultClick} />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural');
    
    await waitFor(() => {
      expect(screen.getByText('Neural Networks')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Neural Networks'));
    expect(mockOnResultClick).toHaveBeenCalledWith('1');
  });

  it('shows loading state during search', async () => {
    // Simulate slow response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => mockSearchResults,
        }), 100)
      )
    );

    const user = userEvent.setup();
    render(<AISemanticSearch />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural');
    
    // Should show loading state
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Neural Networks')).toBeInTheDocument();
    });
  });

  it('debounces search requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSearchResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch debounceMs={300} />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Type multiple characters quickly
    await user.type(searchInput, 'n');
    await user.type(searchInput, 'e');
    await user.type(searchInput, 'u');
    await user.type(searchInput, 'r');
    await user.type(searchInput, 'a');
    await user.type(searchInput, 'l');
    
    // Should not call API for each character
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Wait for debounce
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });

  it('filters results by category when specified', async () => {
    const filteredResults = {
      ...mockSearchResults,
      results: mockSearchResults.results.filter(r => r.category === 'Deep Learning'),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => filteredResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch categoryFilter="Deep Learning" />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural');
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Deep Learning'),
        })
      );
    });
  });

  it('handles semantic search mode toggle', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSearchResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch showModeToggle={true} />, { wrapper: createWrapper() });
    
    // Should have semantic mode toggle
    const semanticToggle = screen.getByRole('checkbox', { name: /semantic search/i });
    expect(semanticToggle).toBeInTheDocument();
    
    // Toggle semantic mode
    await user.click(semanticToggle);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural');
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"semantic":true'),
        })
      );
    });
  });

  it('supports keyboard navigation of results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch enableKeyboardNavigation={true} />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural');
    
    await waitFor(() => {
      expect(screen.getByText('Neural Networks')).toBeInTheDocument();
    });

    // Use arrow keys to navigate
    await user.keyboard('{ArrowDown}');
    
    // First result should be highlighted
    const firstResult = screen.getByText('Neural Networks').closest('[data-testid="search-result"]');
    expect(firstResult).toHaveClass('highlighted');
    
    // Navigate to second result
    await user.keyboard('{ArrowDown}');
    
    const secondResult = screen.getByText('Machine Learning').closest('[data-testid="search-result"]');
    expect(secondResult).toHaveClass('highlighted');
    
    // Press Enter to select
    await user.keyboard('{Enter}');
    
    // Should trigger result click
    expect(mockFetch).toHaveBeenCalled();
  });

  it('tracks search analytics when enabled', async () => {
    const mockAnalytics = vi.fn();
    window.gtag = mockAnalytics;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults,
    });

    const user = userEvent.setup();
    render(<AISemanticSearch enableAnalytics={true} />, { wrapper: createWrapper() });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'neural networks');
    
    await waitFor(() => {
      expect(mockAnalytics).toHaveBeenCalledWith('event', 'search', {
        search_term: 'neural networks',
        search_type: 'semantic',
      });
    });
  });

});
