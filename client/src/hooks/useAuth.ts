import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { signOutUser } from '@/lib/firebase';
import { getQueryFn } from '@/lib/queryClient';
import type { IUser } from '../../../shared/types';
import { useEffect } from 'react';
import { clearAllAuthData, setupAuthStateMonitor, markLogoutState, isInLogoutState } from '@/lib/authPersistence';

// Create a broadcast channel for cross-tab communication
const authChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('auth_state') 
  : null;

export function useAuth() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<IUser>({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Listen for auth changes from other tabs
  useEffect(() => {
    const handleAuthChange = (event: MessageEvent) => {
      if (event.data?.type === 'logout') {
        console.log('🔄 Logout detected from another tab');
        // Clear local state immediately
        clearAllAuthData();
        queryClient.setQueryData(['/api/auth/user'], null);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
        navigate('/login');
      } else if (event.data?.type === 'login') {
        console.log('🔄 Login detected from another tab');
        // Update local state with the new user
        queryClient.setQueryData(['/api/auth/user'], event.data.user);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    };

    // Listen for broadcast channel messages
    if (authChannel) {
      authChannel.addEventListener('message', handleAuthChange);
    }

    // Listen for storage events (fallback for older browsers)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'authToken' && event.newValue === null) {
        console.log('🔄 Auth token removed from localStorage');
        clearAllAuthData();
        queryClient.setQueryData(['/api/auth/user'], null);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
        navigate('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Setup aggressive auth state monitor
    const cleanup = setupAuthStateMonitor(() => {
      console.log('🔍 Auth state monitor triggered logout');
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      navigate('/login');
    });

    return () => {
      if (authChannel) {
        authChannel.removeEventListener('message', handleAuthChange);
      }
      window.removeEventListener('storage', handleStorageChange);
      cleanup();
    };
  }, [queryClient, navigate]);

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Step 1: Mark logout state
      markLogoutState();
      
      // Step 2: Immediately clear query cache and set user to null
      queryClient.setQueryData(['/api/auth/user'], null);
      console.log('✅ Query cache cleared');
      
      // Step 3: Use aggressive auth cleanup
      clearAllAuthData();
      console.log('✅ All auth data cleared');

      // Step 3: Clear all cookies (including httpOnly ones via backend)
      document.cookie.split(';').forEach((c) => {
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name.includes('auth') || name.includes('token') || name.includes('firebase')) {
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
        }
      });
      console.log('✅ Client cookies cleared');

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
                await indexedDB.deleteDatabase(dbName);
                console.log(`✅ Deleted IndexedDB: ${dbName}`);
              } catch (e) {
                console.warn(`⚠️ Failed to delete IndexedDB ${dbName}:`, e);
              }
            }
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend logout error (continuing anyway):', backendError);
      }
      
      // Step 5.5: Clear all Firebase-related IndexedDB databases
      try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name && (db.name.includes('firebase') || db.name.includes('firebaseLocalStorageDb'))) {
            await indexedDB.deleteDatabase(db.name);
            console.log(`✅ Deleted Firebase IndexedDB: ${db.name}`);
          }
        }
      } catch (e) {
        console.warn('⚠️ Failed to clear Firebase IndexedDB:', e);
      }

      // Step 6: Clear ALL queries and invalidate auth
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
      console.log('✅ All queries cleared and invalidated');
      
      // Step 7: Broadcast logout to other tabs
      if (authChannel) {
        authChannel.postMessage({ type: 'logout' });
        console.log('📡 Broadcasted logout to other tabs');
      }
      
      // Step 8: Add a small delay and force a hard reset of auth state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force set to null again to ensure UI updates
      queryClient.setQueryData(['/api/auth/user'], null);
      
      // Step 9: Force navigation to login page to prevent any auto-redirect
      navigate('/login');
      
      // Add a small delay before reload to ensure navigation completes
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      console.log('✅ Logout process completed successfully');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if logout fails, aggressively clear local state
      queryClient.setQueryData(['/api/auth/user'], null);
      localStorage.clear();
      sessionStorage.clear();
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
      
      // Clear all auth-related cookies
      document.cookie.split(';').forEach((c) => {
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name.includes('auth') || name.includes('token') || name.includes('firebase')) {
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        }
      });
      
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
  };
}
