import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { signOutUser } from "@/lib/firebase";
import type { IUser } from "../../../shared/types";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error, refetch } = useQuery<IUser>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const logout = async () => {
    try {
      // First, clear the query cache to immediately update UI
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Sign out from Firebase
      await signOutUser();
      
      // Call backend logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.clear();
      sessionStorage.clear();
      
      // Invalidate all queries to ensure fresh data
      queryClient.clear();
      
      // Force a refetch to confirm logout state
      await refetch();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      queryClient.setQueryData(["/api/auth/user"], null);
      localStorage.clear();
      sessionStorage.clear();
      queryClient.clear();
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
    refetch
  };
}
