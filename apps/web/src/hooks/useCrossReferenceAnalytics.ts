/**
 * Cross-Reference Analytics Hook
 * Provides data and functionality for analyzing term relationships and user navigation patterns
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type {
  CrossReferenceInsights,
  CrossReferenceMetrics,
  LearningPathway,
  ReferenceFlow,
} from '@aiglossarypro/shared/types/analytics';

// Types are now imported from shared directory

interface UseCrossReferenceAnalyticsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export const useCrossReferenceAnalytics = (options: UseCrossReferenceAnalyticsOptions = {}) => {
  const queryClient = useQueryClient();
  const { enabled = true, refetchInterval = 300000 } = options; // 5 minutes default

  // Get cross-reference metrics for specific terms
  const useCrossReferenceMetrics = (termIds?: string[]) => {
    return useQuery({
      queryKey: ['crossReferenceMetrics', termIds],
      queryFn: async (): Promise<CrossReferenceMetrics[]> => {
        const params = new URLSearchParams();
        if (termIds && termIds.length > 0) {
          termIds.forEach(id => params.append('termIds', id));
        }

        const response = await fetch(`/api/cross-reference/analytics/metrics?${params}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch cross-reference metrics: ${response.status} ${errorData.message || response.statusText}`
          );
        }

        const result = await response.json();
        return result.data;
      },
      enabled: enabled,
      refetchInterval,
      staleTime: 300000, // 5 minutes
    });
  };

  // Get reference flow patterns
  const useReferenceFlows = (timeRange: '7d' | '30d' | '90d' = '30d') => {
    return useQuery({
      queryKey: ['referenceFlows', timeRange],
      queryFn: async (): Promise<ReferenceFlow[]> => {
        const response = await fetch(`/api/cross-reference/analytics/flows?timeRange=${timeRange}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch reference flows: ${response.status} ${errorData.message || response.statusText}`
          );
        }

        const result = await response.json();
        return result.data;
      },
      enabled: enabled,
      refetchInterval,
      staleTime: 300000,
    });
  };

  // Get learning pathways
  const useLearningPathways = (minFrequency = 5) => {
    return useQuery({
      queryKey: ['learningPathways', minFrequency],
      queryFn: async (): Promise<LearningPathway[]> => {
        const response = await fetch(
          `/api/cross-reference/analytics/pathways?minFrequency=${minFrequency}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch learning pathways');
        }

        const result = await response.json();
        return result.data;
      },
      enabled: enabled,
      refetchInterval,
      staleTime: 300000,
    });
  };

  // Get comprehensive insights
  const useCrossReferenceInsights = () => {
    return useQuery({
      queryKey: ['crossReferenceInsights'],
      queryFn: async (): Promise<CrossReferenceInsights> => {
        const response = await fetch('/api/cross-reference/analytics/insights');
        if (!response.ok) {
          throw new Error('Failed to fetch cross-reference insights');
        }

        const result = await response.json();
        return result.data;
      },
      enabled: enabled,
      refetchInterval,
      staleTime: 300000,
    });
  };

  // Utility functions
  const getHubTerms = useCallback((metrics: CrossReferenceMetrics[], threshold = 0.7) => {
    return metrics.filter(m => m.hubScore >= threshold).sort((a, b) => b.hubScore - a.hubScore);
  }, []);

  const getBridgeTerms = useCallback(
    (metrics: CrossReferenceMetrics[], threshold = 0.6) => {
      return metrics
        .filter(m => m.bridgeScore >= threshold)
        .sort((a, b) => b.bridgeScore - a.bridgeScore);
    },
    []
  );

  const getStrongConnections = useCallback((flows: ReferenceFlow[], minCount = 10) => {
    return flows.filter(f => f.flowCount >= minCount);
  }, []);

  const getCategoryBridges = useCallback((flows: ReferenceFlow[]) => {
    return flows.filter(f => f.categoryBridge);
  }, []);

  const getEffectivePathways = useCallback(
    (pathways: LearningPathway[], minEffectiveness = 0.7) => {
      return pathways.filter(p => p.learningEffectiveness >= minEffectiveness);
    },
    []
  );

  const getRecommendedSequences = useCallback(
    (pathways: LearningPathway[], minScore = 0.8) => {
      return pathways
        .filter(p => p.recommendationScore >= minScore)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .map(p => p.termNames);
    },
    []
  );

  // Cache management
  const refreshAnalytics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['crossReferenceMetrics'] });
    queryClient.invalidateQueries({ queryKey: ['referenceFlows'] });
    queryClient.invalidateQueries({ queryKey: ['learningPathways'] });
    queryClient.invalidateQueries({ queryKey: ['crossReferenceInsights'] });
  }, [queryClient]);

  const prefetchInsights = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['crossReferenceInsights'],
      queryFn: async () => {
        const response = await fetch('/api/cross-reference/analytics/insights');
        const result = await response.json();
        return result.data;
      },
      staleTime: 300000,
    });
  }, [queryClient]);

  return {
    // Query hooks
    useCrossReferenceMetrics,
    useReferenceFlows,
    useLearningPathways,
    useCrossReferenceInsights,

    // Utility functions
    getHubTerms,
    getBridgeTerms,
    getStrongConnections,
    getCategoryBridges,
    getEffectivePathways,
    getRecommendedSequences,

    // Cache management
    refreshAnalytics,
    prefetchInsights,
  };
};

export default useCrossReferenceAnalytics;
