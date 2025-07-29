import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTermData, useTermActions } from '../useTermData';
import { apiRequest } from '@/lib/queryClient';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn()
}));

describe('useTermData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          gcTime: 0 // Disable caching for tests
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockEnhancedTerm = {
    id: 'term123',
    name: 'Machine Learning',
    definition: 'A type of AI that enables systems to learn from data',
    category: 'AI Fundamentals',
    enhanced: true
  };

  const mockRegularTerm = {
    id: 'term123',
    name: 'Machine Learning',
    definition: 'A type of AI that enables systems to learn from data',
    category: 'AI Fundamentals'
  };

  const mockSections = [
    { id: 'section1', termId: 'term123', title: 'Introduction', content: 'Content here' },
    { id: 'section2', termId: 'term123', title: 'Examples', content: 'Examples here' }
  ];

  const mockInteractiveElements = [
    { id: 'elem1', type: 'quiz', data: {} },
    { id: 'elem2', type: 'code-example', data: {} }
  ];

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useTermData('term123', false), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.term).toBeUndefined();
    expect(result.current.isEnhanced).toBe(false);
  });

  it('should fetch enhanced term data when available', async () => {
    // Set up enhanced term data
    queryClient.setQueryData(['/api/enhanced/terms/term123'], mockEnhancedTerm);
    queryClient.setQueryData(['/api/terms/term123/sections'], mockSections);
    queryClient.setQueryData(['/api/enhanced/terms/term123/interactive'], mockInteractiveElements);

    const { result } = renderHook(() => useTermData('term123', false), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.term).toEqual(mockEnhancedTerm);
    expect(result.current.isEnhanced).toBe(true);
    expect(result.current.sections).toEqual(mockSections);
    expect(result.current.interactiveElements).toEqual(mockInteractiveElements);
  });

  it('should fallback to regular term when enhanced is not available', async () => {
    // Set enhanced term to null to trigger fallback
    queryClient.setQueryData(['/api/enhanced/terms/term123'], null);
    queryClient.setQueryData(['/api/terms/term123'], mockRegularTerm);

    const { result } = renderHook(() => useTermData('term123', false), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.term).toEqual(mockRegularTerm);
    expect(result.current.isEnhanced).toBe(false);
    expect(result.current.sections).toEqual([]);
    expect(result.current.interactiveElements).toEqual([]);
  });

  it('should fetch user-specific data when authenticated', async () => {
    const mockUserSettings = { theme: 'dark', preferredLanguage: 'en' };
    
    queryClient.setQueryData(['/api/enhanced/terms/term123'], mockEnhancedTerm);
    queryClient.setQueryData(['/api/user/enhanced-settings'], mockUserSettings);
    queryClient.setQueryData(['/api/favorites/term123'], true);
    queryClient.setQueryData(['/api/progress/term123'], false);

    const { result } = renderHook(() => useTermData('term123', true), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userSettings).toEqual(mockUserSettings);
    expect(result.current.favorite).toBe(true);
    expect(result.current.learned).toBe(false);
  });

  it('should not fetch user data when not authenticated', () => {
    const { result } = renderHook(() => useTermData('term123', false), { wrapper });

    // User-specific queries should not be enabled
    expect(queryClient.getQueryState(['/api/user/enhanced-settings'])).toBeUndefined();
    expect(queryClient.getQueryState(['/api/favorites/term123'])).toBeUndefined();
    expect(queryClient.getQueryState(['/api/progress/term123'])).toBeUndefined();
  });

  it('should fetch relationships and recommendations for enhanced terms', async () => {
    const mockRelationships = [
      { id: 'rel1', name: 'Deep Learning' },
      { id: 'rel2', name: 'Neural Networks' }
    ];
    const mockRecommended = [
      { id: 'rec1', name: 'Supervised Learning' },
      { id: 'rec2', name: 'Unsupervised Learning' }
    ];

    queryClient.setQueryData(['/api/enhanced/terms/term123'], mockEnhancedTerm);
    queryClient.setQueryData(['/api/enhanced/terms/term123/relationships'], mockRelationships);
    queryClient.setQueryData(['/api/enhanced/terms/term123/recommended'], mockRecommended);

    const { result } = renderHook(() => useTermData('term123', false), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.relationships).toEqual(mockRelationships);
    expect(result.current.recommended).toEqual(mockRecommended);
  });

  it('should handle undefined term ID', () => {
    const { result } = renderHook(() => useTermData(undefined, false), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.term).toBeUndefined();
    expect(result.current.sections).toEqual([]);
    expect(result.current.interactiveElements).toEqual([]);
  });
});

describe('useTermActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should track term view', async () => {
    (apiRequest as unknown).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useTermActions('term123', true));

    await result.current.trackView();

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/enhanced/terms/term123/view',
      null
    );
  });

  it('should handle view tracking errors gracefully', async () => {
    (apiRequest as unknown).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTermActions('term123', true));

    await result.current.trackView();

    expect(console.error).toHaveBeenCalledWith(
      'Failed to log term view',
      expect.any(Error)
    );
  });

  it('should not track view when term ID is undefined', async () => {
    const { result } = renderHook(() => useTermActions(undefined, true));

    await result.current.trackView();

    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('should handle section interaction', async () => {
    (apiRequest as unknown).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useTermActions('term123', true));

    result.current.handleSectionInteraction('section1', 'expand', { expanded: true });

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/enhanced/sections/section1/interaction',
      {
        type: 'expand',
        data: { expanded: true }
      }
    );
  });

  it('should handle interactive element interaction', async () => {
    (apiRequest as unknown).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useTermActions('term123', true));

    result.current.handleInteractiveElementInteraction(
      'elem1',
      'complete',
      { score: 100 }
    );

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/enhanced/interactive/elem1/interaction',
      {
        type: 'complete',
        data: { score: 100 }
      }
    );
  });

  it('should handle interaction errors gracefully', async () => {
    (apiRequest as unknown).mockRejectedValueOnce(new Error('API error'));

    const { result } = renderHook(() => useTermActions('term123', true));

    result.current.handleSectionInteraction('section1', 'click');

    // Wait for the promise to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });
});