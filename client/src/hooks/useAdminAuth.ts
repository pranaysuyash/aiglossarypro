import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  isAuthorized: boolean;
}

export function useAdminAuth() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [adminState, setAdminState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    error: null,
    isAuthorized: false,
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) {
        return; // Still loading auth
      }

      if (!isAuthenticated) {
        setAdminState({
          isAdmin: false,
          isLoading: false,
          error: 'Authentication required',
          isAuthorized: false,
        });
        return;
      }

      // Check if user has admin privileges
      try {
        const response = await fetch('/api/admin/health', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });

        if (response.status === 401) {
          setAdminState({
            isAdmin: false,
            isLoading: false,
            error: 'Authentication expired. Please log in again.',
            isAuthorized: false,
          });
          
          toast({
            title: 'Authentication Required',
            description: 'Please log in to access admin features',
            variant: 'destructive',
          });
          return;
        }

        if (response.status === 403) {
          setAdminState({
            isAdmin: false,
            isLoading: false,
            error: 'Admin access required',
            isAuthorized: false,
          });
          
          toast({
            title: 'Access Denied',
            description: 'You do not have admin privileges',
            variant: 'destructive',
          });
          return;
        }

        if (response.ok) {
          setAdminState({
            isAdmin: true,
            isLoading: false,
            error: null,
            isAuthorized: true,
          });
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (error) {
        console.error('Admin auth check failed:', error);
        setAdminState({
          isAdmin: false,
          isLoading: false,
          error: 'Failed to verify admin access',
          isAuthorized: false,
        });
        
        toast({
          title: 'Auth Check Failed',
          description: 'Unable to verify admin access. Please try again.',
          variant: 'destructive',
        });
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, authLoading, toast]);

  const redirectToLogin = () => {
    // Redirect to login page or show login modal
    window.location.href = '/login';
  };

  const redirectToHome = () => {
    // Redirect to home page for non-admin users
    window.location.href = '/';
  };

  return {
    ...adminState,
    user,
    redirectToLogin,
    redirectToHome,
  };
}