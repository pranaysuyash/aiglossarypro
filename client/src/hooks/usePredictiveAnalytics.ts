/**
 * Predictive Analytics Hook
 * React hook for consuming predictive analytics data and insights
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface LearningOutcomeMetrics {
  userId: string;
  predictedCompletionRate: number;
  estimatedLearningTime: number;
  difficultyAlignment: number;
  engagementScore: number;
  retentionProbability: number;
  recommendedLearningPath: string | null;
  strengthAreas: string[];
  improvementAreas: string[];
  nextBestActions: string[];
  confidenceScore: number;
  insights?: PredictiveInsights;
  profile?: UserLearningProfile;
}

export interface UserLearningProfile {
  userId: string;
  sessionPatterns: SessionPattern;
  comprehensionRate: number;
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  learningVelocity: number;
  focusAreas: string[];
  timeOfDayPreference: string;
  sessionDurationPreference: number;
  conceptualStrengths: string[];
  lastActivityDate: string;
}

export interface SessionPattern {
  averageSessionLength: number;
  sessionsPerWeek: number;
  preferredTimeSlots: string[];
  consistencyScore: number;
  completionRate: number;
}

export interface PredictiveInsights {
  userId: string;
  riskFactors: RiskFactor[];
  opportunityFactors: OpportunityFactor[];
  personalizedRecommendations: PersonalizedRecommendation[];
  progressMilestones: ProgressMilestone[];
  learningEfficiencyScore: number;
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export interface OpportunityFactor {
  factor: string;
  potential: 'low' | 'medium' | 'high';
  description: string;
  action: string;
}

export interface PersonalizedRecommendation {
  type: 'content' | 'pacing' | 'method' | 'timing';
  title: string;
  description: string;
  expectedImprovement: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ProgressMilestone {
  milestone: string;
  targetDate: string;
  probability: number;
  requirements: string[];
}

interface PredictiveAnalyticsOptions {
  includeInsights?: boolean;
  includeRecommendations?: boolean;
  includeMilestones?: boolean;
  timeframe?: '7d' | '30d' | '90d';
}

interface UsePredictiveAnalyticsReturn {
  // Learning outcomes
  outcomes: LearningOutcomeMetrics | null;
  isLoadingOutcomes: boolean;
  outcomesError: Error | null;
  
  // Learning profile
  profile: UserLearningProfile | null;
  isLoadingProfile: boolean;
  profileError: Error | null;
  
  // Predictive insights
  insights: PredictiveInsights | null;
  isLoadingInsights: boolean;
  insightsError: Error | null;
  
  // Recommendations
  recommendations: PersonalizedRecommendation[];
  isLoadingRecommendations: boolean;
  recommendationsError: Error | null;
  
  // Milestones
  milestones: ProgressMilestone[];
  isLoadingMilestones: boolean;
  milestonesError: Error | null;
  
  // Actions
  refreshOutcomes: () => void;
  refreshProfile: () => void;
  refreshInsights: () => void;
  refreshRecommendations: () => void;
  refreshMilestones: () => void;
  refreshAll: () => void;
  
  // Utilities
  getScoreColor: (score: number) => string;
  getScoreLabel: (score: number) => string;
  getSeverityColor: (severity: string) => string;
  getPriorityColor: (priority: string) => string;
}

export const usePredictiveAnalytics = (
  userId: string,
  options: PredictiveAnalyticsOptions = {}
): UsePredictiveAnalyticsReturn => {
  const queryClient = useQueryClient();
  const [selectedTimeframe, setSelectedTimeframe] = useState(options.timeframe || '30d');

  // Fetch learning outcomes
  const {
    data: outcomes,
    isLoading: isLoadingOutcomes,
    error: outcomesError,
    refetch: refreshOutcomes
  } = useQuery({
    queryKey: ['predictiveAnalytics', 'outcomes', userId, selectedTimeframe, options],
    queryFn: async (): Promise<LearningOutcomeMetrics> => {
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        ...(options.includeInsights && { includeInsights: 'true' }),
        ...(options.includeRecommendations && { includeRecommendations: 'true' }),
        ...(options.includeMilestones && { includeMilestones: 'true' })
      });

      const response = await fetch(`/api/predictive-analytics/outcomes/${userId}?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch learning outcomes: ${response.status} ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch learning profile
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refreshProfile
  } = useQuery({
    queryKey: ['predictiveAnalytics', 'profile', userId],
    queryFn: async (): Promise<UserLearningProfile> => {
      const response = await fetch(`/api/predictive-analytics/profile/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch learning profile: ${response.status} ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  // Fetch predictive insights
  const {
    data: insights,
    isLoading: isLoadingInsights,
    error: insightsError,
    refetch: refreshInsights
  } = useQuery({
    queryKey: ['predictiveAnalytics', 'insights', userId],
    queryFn: async (): Promise<PredictiveInsights> => {
      const response = await fetch(`/api/predictive-analytics/insights/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch predictive insights: ${response.status} ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false
  });

  // Fetch recommendations
  const {
    data: recommendations = [],
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
    refetch: refreshRecommendations
  } = useQuery({
    queryKey: ['predictiveAnalytics', 'recommendations', userId],
    queryFn: async (): Promise<PersonalizedRecommendation[]> => {
      const response = await fetch(`/api/predictive-analytics/recommendations/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch recommendations: ${response.status} ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!userId,
    staleTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false
  });

  // Fetch milestones
  const {
    data: milestones = [],
    isLoading: isLoadingMilestones,
    error: milestonesError,
    refetch: refreshMilestones
  } = useQuery({
    queryKey: ['predictiveAnalytics', 'milestones', userId],
    queryFn: async (): Promise<ProgressMilestone[]> => {
      const response = await fetch(`/api/predictive-analytics/milestones/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch milestones: ${response.status} ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false
  });

  // Refresh all data
  const refreshAll = useCallback(() => {
    refreshOutcomes();
    refreshProfile();
    refreshInsights();
    refreshRecommendations();
    refreshMilestones();
  }, [refreshOutcomes, refreshProfile, refreshInsights, refreshRecommendations, refreshMilestones]);

  // Utility functions
  const getScoreColor = useCallback((score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  }, []);

  const getScoreLabel = useCallback((score: number): string => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Improvement';
  }, []);

  const getSeverityColor = useCallback((severity: string): string => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  return {
    // Data
    outcomes: outcomes || null,
    isLoadingOutcomes,
    outcomesError: outcomesError as Error | null,
    
    profile: profile || null,
    isLoadingProfile,
    profileError: profileError as Error | null,
    
    insights: insights || null,
    isLoadingInsights,
    insightsError: insightsError as Error | null,
    
    recommendations,
    isLoadingRecommendations,
    recommendationsError: recommendationsError as Error | null,
    
    milestones,
    isLoadingMilestones,
    milestonesError: milestonesError as Error | null,
    
    // Actions
    refreshOutcomes,
    refreshProfile,
    refreshInsights,
    refreshRecommendations,
    refreshMilestones,
    refreshAll,
    
    // Utilities
    getScoreColor,
    getScoreLabel,
    getSeverityColor,
    getPriorityColor
  };
};

export default usePredictiveAnalytics;