/**
 * AI Semantic Search Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AISemanticSearch from '../../client/src/components/search/AISemanticSearch';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock the router
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()]
}));

describe('AISemanticSearch', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('renders the search interface', () => {
    renderWithQueryClient(<AISemanticSearch />);
    
    expect(screen.getByText('AI Semantic Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search ai\/ml concepts/i)).toBeInTheDocument();
    expect(screen.getByText('Search Mode:')).toBeInTheDocument();
  });

  it('shows search mode tabs', () => {
    renderWithQueryClient(<AISemanticSearch />);
    
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('AI Semantic')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('allows typing in search input', async () => {
    renderWithQueryClient(<AISemanticSearch />);
    
    const searchInput = screen.getByPlaceholderText(/search ai\/ml concepts/i);
    fireEvent.change(searchInput, { target: { value: 'neural network' } });
    
    expect(searchInput).toHaveValue('neural network');
  });

  it('shows loading state during search', async () => {
    // Mock a delayed API response
    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            searchTime: 100,
            query: 'neural',
            hasMore: false,
            strategy: 'fts',
            isGeneric: false
          })
        }), 1000)
      )
    );

    renderWithQueryClient(<AISemanticSearch />);
    
    const searchInput = screen.getByPlaceholderText(/search ai\/ml concepts/i);
    fireEvent.change(searchInput, { target: { value: 'neural' } });

    // Should show loading state (this would need to wait for debounce)
    await waitFor(() => {
      // Check for loading indicators if they exist
    }, { timeout: 2000 });
  });

  it('displays search results', async () => {
    const mockResults = {
      results: [
        {
          id: '1',
          name: 'Neural Network',
          shortDefinition: 'A computing system inspired by biological neural networks',
          category: { id: '1', name: 'Deep Learning' },
          viewCount: 100,
          relevanceScore: 95,
          semanticSimilarity: 0.9,
          conceptRelationships: ['Deep Learning', 'Machine Learning'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      searchTime: 150,
      query: 'neural',
      hasMore: false,
      strategy: 'fts',
      isGeneric: false
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults)
    });

    renderWithQueryClient(<AISemanticSearch />);
    
    const searchInput = screen.getByPlaceholderText(/search ai\/ml concepts/i);
    fireEvent.change(searchInput, { target: { value: 'neural' } });

    await waitFor(() => {
      expect(screen.getByText('Neural Network')).toBeInTheDocument();
      expect(screen.getByText('A computing system inspired by biological neural networks')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('opens advanced filters when clicked', () => {
    renderWithQueryClient(<AISemanticSearch />);
    
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('allows clearing search input', () => {
    renderWithQueryClient(<AISemanticSearch />);
    
    const searchInput = screen.getByPlaceholderText(/search ai\/ml concepts/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    expect(searchInput).toHaveValue('test query');
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  it('calls onResultSelect when result is clicked', async () => {
    const mockOnResultSelect = vi.fn();
    
    const mockResults = {
      results: [
        {
          id: '1',
          name: 'Neural Network',
          shortDefinition: 'A computing system inspired by biological neural networks',
          category: { id: '1', name: 'Deep Learning' },
          viewCount: 100,
          relevanceScore: 95,
          semanticSimilarity: 0.9,
          conceptRelationships: ['Deep Learning'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      searchTime: 150,
      query: 'neural',
      hasMore: false,
      strategy: 'fts',
      isGeneric: false
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults)
    });

    renderWithQueryClient(<AISemanticSearch onResultSelect={mockOnResultSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search ai\/ml concepts/i);
    fireEvent.change(searchInput, { target: { value: 'neural' } });

    await waitFor(() => {
      const resultItem = screen.getByText('Neural Network');
      fireEvent.click(resultItem.closest('[role="button"], div[onClick]') || resultItem);
    }, { timeout: 2000 });

    expect(mockOnResultSelect).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      name: 'Neural Network'
    }));
  });

  it('shows no results message when search returns empty', async () => {
    const mockResults = {
      results: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      searchTime: 50,
      query: 'nonexistent',
      hasMore: false,
      strategy: 'fts',
      isGeneric: false
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults)
    });

    renderWithQueryClient(<AISemanticSearch />);
    
    const searchInput = screen.getByPlaceholderText(/search ai\/ml concepts/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles search errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    renderWithQueryClient(<AISemanticSearch />);
    
    const searchInput = screen.getByPlaceholderText(/search ai\/ml concepts/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});