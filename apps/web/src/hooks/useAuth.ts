import { clearAllAuthData, isInLogoutState, markLogoutState } from '@/lib/authPersistence';
import { authQueryDeduplicator } from '@/lib/authQueryDeduplicator';
import { authQueryKey, getAuthQueryOptions, recordAuthQuery } from '@/lib/authQueryOptions';
import { AuthStateManager } from '@/lib/AuthStateManager';
import { signOutUser } from '@/lib/firebase';
import IndexedDBManager from '@/lib/IndexedDBManager';
import { MemoryMonitor } from '@/lib/MemoryMonitor';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IUser } from '@aiglossarypro/shared';

import { getAuthChannel, getTabId } from '@/lib/authChannel';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const authStateManager = AuthStateManager.getInstance();
  const [authState, setAuthState] = useState(authStateManager.getState());

  // Use refs to track cleanup functions and prevent memory leaks
  const cleanupFunctionsRef = useRef<Set<() => void>>(new Set());
  const isUnmountedRef = useRef(false);

  // Subscribe to auth state changes from AuthStateManager with proper cleanup
  useEffect(() => {
    const unsubscribe = authStateManager.subscribe((newState) => {
      if (isUnmountedRef.current) {return;} // Prevent state updates after unmount

      setAuthState(newState);
      // Update React Query cache when auth state changes (single source of truth)
      queryClient.setQueryData(authQueryKey, newState.user);
    });

    cleanupFunctionsRef.current.add(unsubscribe);
    return unsubscribe;
  }, [queryClient]);

  // Custom query function with deduplication, circuit breaker and rate limiting
  const authQueryFn = useCallback(async () => {
    return authQueryDeduplicator.executeQuery(async () => {
      // Record the query attempt
      recordAuthQuery();

      if (!authStateManager.canMakeAuthRequest()) {
        // Return cached state if circuit breaker is open
        return authState.user;
      }

      authStateManager.setLoading();

      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
        });

        if (response.status === 401) {
          authStateManager.recordSuccess(null);
          return null;
        }

        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const user = data.success && data.data ? data.data : data;
        authStateManager.recordSuccess(user);
        return user;
      } catch (error) {
        authStateManager.recordFailure(error as Error);
        throw error;
      }
    });
  }, [authState.user]);

  const {
    data: user,
    isLoading: queryLoading,
    error,
    refetch,
  } = useQuery<IUser>({
    ...getAuthQueryOptions(),
    queryFn: authQueryFn,
    enabled: !isInLogoutState() && getAuthQueryOptions().enabled,
    refetchInterval: false as const, // Fix TypeScript error
  });

  // Manual refresh function to force auth state update
  const refreshAuth = useCallback(() => {
    authQueryDeduplicator.resetConsecutiveQueries();
    refetch();
  }, [refetch]);

  // Use auth state manager's loading state
  const isLoading = authState.isLoading || queryLoading;

  // Simplified cross-tab communication to prevent loops with proper cleanup
  useEffect(() => {
    const handleAuthChange = (event: MessageEvent) => {
      if (isUnmountedRef.current) {return;} // Prevent actions after unmount

      // Filter out messages from this tab
      if (event.data?.source === getTabId()) {
        return;
      }

      if (event.data?.type === 'logout') {
        console.log('🔄 Logout detected from another tab');
        authStateManager.reset();
        navigate('/login');
      } else if (event.data?.type === 'login' && event.data?.user) {
        console.log('🔄 Login detected from another tab');
        authStateManager.updateFromStorage(event.data.user);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (isUnmountedRef.current) {return;} // Prevent actions after unmount

      if (event.key === 'authToken' && event.newValue === null) {
        console.log('🔄 Auth token removed from localStorage');
        authStateManager.reset();
        navigate('/login');
      }
    };

    // Get or create broadcast channel
    const channel = getAuthChannel();

    // Listen for broadcast channel messages
    if (channel) {
      channel.addEventListener('message', handleAuthChange);
      cleanupFunctionsRef.current.add(() => {
        channel.removeEventListener('message', handleAuthChange);
      });
    }

    // Listen for storage events (fallback for older browsers)
    window.addEventListener('storage', handleStorageChange);
    cleanupFunctionsRef.current.add(() => {
      window.removeEventListener('storage', handleStorageChange);
    });

    return () => {
      // Cleanup all event listeners
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current.clear();
    };
  }, [navigate]);

  // Register cleanup with memory monitor and handle component unmount
  useEffect(() => {
    const memoryCleanup = MemoryMonitor.registerCleanupFunction(async () => {
      console.log('🧹 Auth hook memory cleanup triggered');

      // Clear auth state if memory is critical
      if (!MemoryMonitor.isMemoryUsageSafe()) {
        authStateManager.reset();
        queryClient.removeQueries({ queryKey: authQueryKey });

        // Emergency IndexedDB cleanup
        try {
          await IndexedDBManager.emergencyCleanup();
        } catch (error) {
          console.error('Emergency IndexedDB cleanup failed:', error);
        }
      }
    });

    cleanupFunctionsRef.current.add(memoryCleanup);

    return () => {
      isUnmountedRef.current = true;

      // Run all cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error during auth hook cleanup:', error);
        }
      });
      cleanupFunctionsRef.current.clear();

      // Don't close global channel - managed by global handler

      memoryCleanup();
    };
  }, [queryClient]);

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');

      // Step 1: Mark logout state to prevent new auth queries
      markLogoutState();

      // Step 2: Reset auth state manager and deduplicator
      authStateManager.reset();
      authQueryDeduplicator.clear();

      // Step 3: Clear all auth data
      clearAllAuthData();
      console.log('✅ All auth data cleared');

      // Step 4: Sign out from Firebase
      try {
        await signOutUser();
        console.log('✅ Firebase signout completed');
      } catch (firebaseError) {
        console.warn('⚠️ Firebase signout error (continuing anyway):', firebaseError);
      }

      // Step 5: Call backend logout endpoint
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend logout completed', data);

          // Handle client actions from server response
          if (data.clientActions?.clearIndexedDB) {
            for (const dbName of data.clientActions.clearIndexedDB) {
              try {
                await IndexedDBManager.deleteDatabase(dbName);
                console.log(`✅ Deleted IndexedDB: ${dbName}`);
              } catch (e) {
                console.warn(`⚠️ Failed to delete IndexedDB ${dbName}:`, e);
              }
            }
          }

          // Additional IndexedDB cleanup for auth-related databases
          try {
            await IndexedDBManager.cleanupDatabases({
              keepDatabases: [], // Don't keep any databases during logout
              maxSize: 0, // Delete all databases
            });
            console.log('✅ IndexedDB cleanup completed');
          } catch (e) {
            console.warn('⚠️ IndexedDB cleanup error:', e);
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend logout error (continuing anyway):', backendError);
      }

      // Step 6: Clear React Query cache (single operation, no invalidation)
      queryClient.clear();
      console.log('✅ All queries cleared');

      // Step 7: Broadcast logout to other tabs
      const channel = getAuthChannel();
      if (channel) {
        channel.postMessage({ type: 'logout' });
        console.log('📡 Broadcasted logout to other tabs');
      }

      // Step 8: Navigate to login page
      navigate('/login');

      console.log('✅ Logout process completed successfully');

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Emergency cleanup - reset auth state manager
      authStateManager.reset();
      clearAllAuthData();
      queryClient.clear();
      navigate('/login');
      console.log('✅ Emergency cleanup completed');
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
    refetch,
    refreshAuth,
  };
}