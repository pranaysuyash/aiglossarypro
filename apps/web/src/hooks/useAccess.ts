// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

export interface AccessStatus {
  hasAccess: boolean;
  subscriptionTier: 'free' | 'lifetime';
  lifetimeAccess: boolean;
  dailyViews: number;
  dailyLimit: number;
  remainingViews: number;
  daysUntilReset: number;
  purchaseDate?: string;
}

export interface AccessCheckResult {
  isLoading: boolean;
  error: Error | null;
  accessStatus: AccessStatus | null;
  hasAccess: boolean;
  isFreeTier: boolean;
  hasReachedLimit: boolean;
  canViewTerm: boolean;
  refetch: () => Promise<Record<string, unknown>>;
}

/**
 * Hook to check user's access level and viewing limits
 */
export function useAccess(): AccessCheckResult {
  // Use the centralized useAuth hook instead of making duplicate auth queries
  const { user } = useAuth();

  const {
    data: accessStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['access-status', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return {
          hasAccess: false,
          subscriptionTier: 'free' as const,
          lifetimeAccess: false,
          dailyViews: 0,
          dailyLimit: 50,
          remainingViews: 50,
          daysUntilReset: 0,
        };
      }

      const response = await api.get('/user/access-status');
      return response.data as AccessStatus;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Disable automatic refetching to prevent loops
  });

  const hasAccess = accessStatus?.hasAccess || false;
  const isFreeTier = accessStatus?.subscriptionTier === 'free';
  const hasReachedLimit = isFreeTier && (accessStatus?.remainingViews || 0) <= 0;
  const canViewTerm = hasAccess && !hasReachedLimit;

  return {
    isLoading,
    error: error as Error | null,
    accessStatus: accessStatus || null,
    hasAccess,
    isFreeTier,
    hasReachedLimit,
    canViewTerm,
    refetch,
  };
}

/**
 * Hook to check if user can view a specific term
 */
export function useTermAccess(termId?: string) {
  const { canViewTerm, isLoading, accessStatus, refetch } = useAccess();

  const { data: termAccessData, isLoading: isCheckingTerm } = useQuery({
    queryKey: ['term-access', termId, accessStatus?.dailyViews],
    queryFn: async () => {
      if (!termId || !canViewTerm) {return null;}

      // Check if user has already viewed this term today
      const response = await api.get(`/user/term-access/${termId}`);
      return response.data;
    },
    enabled: !!termId && canViewTerm,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    canViewTerm: canViewTerm && !isCheckingTerm,
    isLoading: isLoading || isCheckingTerm,
    accessStatus,
    termAccessData,
    refetch,
  };
}

/**
 * Hook to handle term viewing with access control
 */
export function useViewTerm() {
  const { refetch } = useAccess();

  const viewTerm = async (termId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post(`/terms/${termId}/view`);

      if (response.data.success) {
        // Refetch access status to update view counts
        await refetch();
        return { success: true };
      } 
        return { success: false, error: response.data.error || 'Failed to view term' };
      
    } catch (error: Error | unknown) {
      const errorMessage = error.response?.data?.error || 'Failed to view term';
      return { success: false, error: errorMessage };
    }
  };

  return { viewTerm };
}
