import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';
import { signOutUser } from '@/lib/firebase';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/lib/firebase', () => ({
  signOutUser: vi.fn()
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/current-path', vi.fn()]
}));

vi.mock('@/lib/queryClient', () => ({
  getQueryFn: vi.fn(() => async () => null)
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('useAuth', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset fetch mock
    (global.fetch as unknown).mockReset();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle authenticated user', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      role: 'user' as const
    };

    // Mock the query function to return a user
    vi.doMock('@/lib/queryClient', () => ({
      getQueryFn: vi.fn(() => async () => mockUser)
    }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle logout successfully', async () => {
    const mockNavigate = vi.fn();
    vi.doMock('wouter', () => ({
      useLocation: () => ['/current-path', mockNavigate]
    }));

    (global.fetch as unknown).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Set initial authenticated state
    queryClient.setQueryData(['/api/auth/user'], { id: 'user123' });

    await result.current.logout();

    // Verify all cleanup actions
    expect(signOutUser).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    
    // Check that user data is cleared
    const userData = queryClient.getQueryData(['/api/auth/user']);
    expect(userData).toBeNull();
  });

  it('should handle logout errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock Firebase signout to throw error
    (signOutUser as unknown).mockRejectedValueOnce(new Error('Firebase error'));
    
    // Mock backend logout to fail
    (global.fetch as unknown).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Set initial authenticated state
    queryClient.setQueryData(['/api/auth/user'], { id: 'user123' });

    await result.current.logout();

    // Even with errors, local state should be cleared
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    const userData = queryClient.getQueryData(['/api/auth/user']);
    expect(userData).toBeNull();
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Logout error:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });

  it('should clear cookies on logout', async () => {
    // Mock document.cookie
    let mockCookie = 'auth_token=abc123; firebase_token=xyz789; other=value';
    Object.defineProperty(document, 'cookie', {
      get: vi.fn(() => mockCookie),
      set: vi.fn((value) => {
        if (value.includes('expires=Thu, 01 Jan 1970')) {
          // Simulate cookie deletion
          const cookieName = value.split('=')[0];
          mockCookie = mockCookie.replace(new RegExp(`${cookieName}=[^;]+;?\\s*`), '');
        }
      }),
      configurable: true
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.logout();

    // Verify auth-related cookies were cleared
    expect(mockCookie).not.toContain('auth_token');
    expect(mockCookie).not.toContain('firebase_token');
    expect(mockCookie).toContain('other=value'); // Non-auth cookies should remain
  });

  it('should return refetch function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });
});