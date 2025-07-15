import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';
import { signOutUser } from '@/lib/firebase';

// Mock firebase module
vi.mock('@/lib/firebase', () => ({
  signOutUser: vi.fn(),
}));

// Mock fetch
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
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set authenticated state when user data is fetched', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    };

    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockUser }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle logout correctly', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    };

    // Set initial user data
    queryClient.setQueryData(['/api/auth/user'], mockUser);

    // Mock logout API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);

    // Trigger logout
    await result.current.logout();

    expect(signOutUser).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('should handle logout errors gracefully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    };

    queryClient.setQueryData(['/api/auth/user'], mockUser);

    // Mock failed logout
    (signOutUser as any).mockRejectedValueOnce(new Error('Logout failed'));
    (global.fetch as any).mockRejectedValueOnce(new Error('API error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.logout();

    // Should still clear user data even if logout fails
    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('should handle premium user access', async () => {
    const mockPremiumUser = {
      id: '1',
      email: 'premium@example.com',
      name: 'Premium User',
      lifetimeAccess: true,
      createdAt: new Date(),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockPremiumUser }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user?.lifetimeAccess).toBe(true);
  });
});