import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { ITerm } from '@/interfaces/interfaces';

interface TermApiResponse {
  success: boolean;
  data: ITerm & {
    isPreview?: boolean;
    requiresUpgrade?: boolean;
    limitInfo?: {
      dailyLimit: number;
      resetTime: string;
      reason: string;
    };
  };
  message?: string;
}

interface TermWithUpgradeState {
  term: ITerm | null;
  isLoading: boolean;
  isPreview: boolean;
  requiresUpgrade: boolean;
  limitInfo?: {
    dailyLimit: number;
    resetTime: string;
    reason: string;
  };
  upgradeMessage?: string;
  error?: string;
}

/**
 * Custom hook for fetching term data with upgrade scenario handling
 * This bypasses the default queryFn to access full API response including metadata
 */
export function useTermWithUpgrade(id: string | undefined): TermWithUpgradeState {
  const [upgradeState, setUpgradeState] = useState<{
    requiresUpgrade: boolean;
    limitInfo?: {
      dailyLimit: number;
      resetTime: string;
      reason: string;
    };
    upgradeMessage?: string;
  }>({
    requiresUpgrade: false,
  });

  // Custom query that fetches full response
  const {
    data: fullResponse,
    isLoading,
    error,
  } = useQuery<TermApiResponse>({
    queryKey: [`/api/terms/${id}/full`],
    queryFn: async () => {
      if (!id) {throw new Error('No term ID provided');}

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/terms/${id}`, {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Update upgrade state when response changes
  useEffect(() => {
    if (fullResponse?.data) {
      setUpgradeState({
        requiresUpgrade: fullResponse.data.requiresUpgrade || false,
        limitInfo: fullResponse.data.limitInfo,
        upgradeMessage: fullResponse.message,
      });
    }
  }, [fullResponse]);

  return {
    term: fullResponse?.data || null,
    isLoading,
    isPreview: fullResponse?.data?.isPreview || false,
    requiresUpgrade: upgradeState.requiresUpgrade,
    limitInfo: upgradeState.limitInfo,
    upgradeMessage: upgradeState.upgradeMessage,
    error: error?.message,
  };
}

/**
 * Hook to check if user should see upgrade modal based on term access
 */
export function useUpgradeModalTrigger(termId: string | undefined, isAuthenticated: boolean) {
  const [showModal, setShowModal] = useState(false);
  const termData = useTermWithUpgrade(termId);

  // Auto-trigger modal when user hits limit
  useEffect(() => {
    if (isAuthenticated && termData.requiresUpgrade && !termData.isLoading) {
      setShowModal(true);
    }
  }, [isAuthenticated, termData.requiresUpgrade, termData.isLoading]);

  return {
    showUpgradeModal: showModal,
    setShowUpgradeModal: setShowModal,
    upgradeReason: termData.limitInfo?.reason,
    dailyLimit: termData.limitInfo?.dailyLimit,
    upgradeMessage: termData.upgradeMessage,
  };
}
