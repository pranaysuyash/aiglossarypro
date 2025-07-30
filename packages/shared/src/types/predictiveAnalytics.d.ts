/**
 * Shared types for Predictive Analytics
 * Types used by both frontend and backend for predictive analytics features
 */
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
}
export interface UserLearningProfileData {
    userId: string;
    sessionPatterns: SessionPattern;
    comprehensionRate: number;
    preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
    learningVelocity: number;
    focusAreas: string[];
    timeOfDayPreference: string;
    sessionDurationPreference: number;
    conceptualStrengths: string[];
    lastActivityDate: Date;
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
    targetDate: Date;
    probability: number;
    requirements: string[];
}
export interface PredictiveAnalyticsRequest {
    userId: string;
    includeInsights?: boolean;
    includeRecommendations?: boolean;
    includeMilestones?: boolean;
    timeframe?: '7d' | '30d' | '90d';
}
export interface PredictiveAnalyticsResponse {
    success: boolean;
    data: LearningOutcomeMetrics;
    insights?: PredictiveInsights;
    profile?: UserLearningProfileData;
    error?: string;
    message?: string;
}
export interface BatchAnalyticsRequest {
    userIds: string[];
    metrics: ('outcomes' | 'profile' | 'insights' | 'recommendations')[];
}
export interface BatchAnalyticsResponse {
    success: boolean;
    data: Record<string, {
        outcomes?: LearningOutcomeMetrics;
        profile?: UserLearningProfileData;
        insights?: PredictiveInsights;
        error?: string;
    }>;
    error?: string;
    message?: string;
}
