import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { signOutUser } from '@/lib/firebase';
import { getQueryFn } from '@/lib/queryClient';
import type { IUser } from '../../../shared/types';

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

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Step 1: Immediately clear query cache and set user to null
      queryClient.setQueryData(['/api/auth/user'], null);
      console.log('✅ Query cache cleared');
      
      // Step 2: Clear all local storage immediately
      localStorage.removeItem('authToken');
      localStorage.removeItem('auth_token'); // Also check for alternate cookie name
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Local storage cleared');

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
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        console.log('✅ Backend logout completed');
      } catch (backendError) {
        console.warn('⚠️ Backend logout error (continuing anyway):', backendError);
      }

      // Step 6: Clear ALL queries and invalidate auth
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
      console.log('✅ All queries cleared and invalidated');
      
      // Step 7: Add a small delay and force a hard reset of auth state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force set to null again to ensure UI updates
      queryClient.setQueryData(['/api/auth/user'], null);
      
      // Step 8: Force navigation to login page to prevent any auto-redirect
      navigate('/login');
      window.location.reload(true);
      
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
