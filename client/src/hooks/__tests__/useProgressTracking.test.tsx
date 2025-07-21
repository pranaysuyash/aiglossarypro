import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProgressTracking } from '../useProgressTracking';
import { useAuth } from '../useAuth';
import { useToast } from '../use-toast';

// Mock dependencies
vi.mock('../useAuth');
vi.mock('../use-toast');

// Mock fetch globally
global.fetch = vi.fn();

describe('useProgressTracking', () => {
  const mockToast = vi.fn();
  const mockUser = { id: 'user123', token: 'auth-token', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
    
    // Setup default mocks
    (useToast as any).mockReturnValue({ toast: mockToast });
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  describe('trackTermInteraction', () => {
    it('should skip tracking for unauthenticated users', async () => {
      (useAuth as any).mockReturnValue({ user: null });
      
      const { result } = renderHook(() => useProgressTracking());

      await act(async () => {
        await result.current.trackTermInteraction('term123');
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should track term interaction successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useProgressTracking());

      await act(async () => {
        await result.current.trackTermInteraction(
          'term123',
          ['section1', 'section2'],
          300,
          { onSuccess }
        );
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/progress/track-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer auth-token',
        },
        body: JSON.stringify({
          termId: 'term123',
          sectionsViewed: ['section1', 'section2'],
          timeSpentSeconds: 300,
        }),
      });

      expect(onSuccess).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle tracking errors silently by default', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const onError = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const { result } = renderHook(() => useProgressTracking());

      await act(async () => {
        await result.current.trackTermInteraction('term123', [], 0, { onError });
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockToast).not.toHaveBeenCalled(); // Silent failure
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to track term interaction:', expect.any(Error));
      
      consoleWarnSpy.mockRestore();
    });

    it('should show error toast when silentFailure is false', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useProgressTracking());

      await act(async () => {
        await result.current.trackTermInteraction(
          'term123',
          [],
          0,
          { silentFailure: false }
        );
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to track your progress. Please try again.',
        variant: 'destructive',
      });
    });
  });

  describe('toggleBookmark', () => {
    it('should show authentication required toast for unauthenticated users', async () => {
      (useAuth as any).mockReturnValue({ user: null });
      
      const { result } = renderHook(() => useProgressTracking());

      let response;
      await act(async () => {
        response = await result.current.toggleBookmark('term123', true);
      });

      expect(response).toEqual({ success: false });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Authentication required',
        description: 'Please sign in to bookmark terms',
        variant: 'destructive',
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should add bookmark successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, bookmarkCount: 5 })
      });

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useProgressTracking());

      let response;
      await act(async () => {
        response = await result.current.toggleBookmark('term123', true, { onSuccess });
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/progress/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer auth-token',
        },
        body: JSON.stringify({
          termId: 'term123',
          isBookmarked: true,
        }),
      });

      expect(response).toEqual({ success: true, bookmarkCount: 5 });
      expect(onSuccess).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Added to bookmarks',
        description: 'Term has been bookmarked successfully',
      });
    });

    it('should remove bookmark successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, bookmarkCount: 3 })
      });

      const { result } = renderHook(() => useProgressTracking());

      let response;
      await act(async () => {
        response = await result.current.toggleBookmark('term123', false);
      });

      expect(response).toEqual({ success: true, bookmarkCount: 3 });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Removed from bookmarks',
        description: 'Term has been removed from bookmarks',
      });
    });

    it('should handle bookmark errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bookmark limit exceeded' })
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useProgressTracking());

      let response;
      await act(async () => {
        response = await result.current.toggleBookmark('term123', true, { onError });
      });

      expect(response).toEqual({ success: false });
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Bookmark limit exceeded',
        variant: 'destructive',
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

      const { result } = renderHook(() => useProgressTracking());

      let response;
      await act(async () => {
        response = await result.current.toggleBookmark('term123', true);
      });

      expect(response).toEqual({ success: false });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Network failure',
        variant: 'destructive',
      });
    });
  });

  describe('isLoading state', () => {
    it('should manage loading state during trackTermInteraction', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as any).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useProgressTracking());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.trackTermInteraction('term123');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!();
        await promise;
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should manage loading state during toggleBookmark', async () => {
      let resolvePromise: () => void;
      const promise = new Promise((resolve) => {
        resolvePromise = () => resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      });

      (global.fetch as any).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useProgressTracking());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.toggleBookmark('term123', true);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!();
        await promise;
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});