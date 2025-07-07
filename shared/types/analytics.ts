/**
 * Shared Analytics Types
 * Used by both frontend and backend for cross-reference analytics
 */

export interface CrossReferenceMetrics {
  termId: string;
  termName: string;
  categoryName: string;
  incomingReferences: number;
  outgoingReferences: number;
  referenceScore: number;
  popularIncomingTerms: Array<{
    termId: string;
    termName: string;
    referenceCount: number;
    averageSessionGap: number;
  }>;
  popularOutgoingTerms: Array<{
    termId: string;
    termName: string;
    referenceCount: number;
    averageSessionGap: number;
  }>;
  referencePathways: Array<{
    pathway: string[];
    frequency: number;
    averageCompletionRate: number;
  }>;
  hubScore: number;
  bridgeScore: number;
}

export interface ReferenceFlow {
  sourceTermId: string;
  sourceTermName: string;
  targetTermId: string;
  targetTermName: string;
  flowCount: number;
  averageTimeGap: number;
  sessionCount: number;
  completionRate: number;
  backflowRate: number;
  categoryBridge: boolean;
  difficultyProgression: 'easier' | 'same' | 'harder' | 'unknown';
}

export interface LearningPathway {
  pathwayId: string;
  termSequence: string[];
  termNames: string[];
  frequency: number;
  averageCompletionTime: number;
  completionRate: number;
  learningEffectiveness: number;
  pathwayType: 'linear' | 'branching' | 'circular' | 'hub-and-spoke';
  recommendationScore: number;
}

export interface NavigationPattern {
  patternType: 'sequential' | 'random' | 'focused' | 'exploratory';
  sessionCount: number;
  averagePathLength: number;
  averageSessionDuration: number;
  knowledgeDepth: number;
  breadthScore: number;
  returnRate: number;
}

export interface CrossReferenceInsights {
  totalCrossReferences: number;
  averageReferenceScore: number;
  topHubTerms: CrossReferenceMetrics[];
  topBridgeTerms: CrossReferenceMetrics[];
  mostFollowedReferences: ReferenceFlow[];
  popularLearningPathways: LearningPathway[];
  navigationPatterns: NavigationPattern[];
  categoryConnections: Array<{
    sourceCategory: string;
    targetCategory: string;
    connectionStrength: number;
    topBridgeTerms: string[];
  }>;
  learningEfficiencyMetrics: {
    averageTermsPerSession: number;
    averageCompletionRate: number;
    optimalPathLength: number;
    recommendedSequences: string[][];
  };
}