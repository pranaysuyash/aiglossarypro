/**
 * Predictive Analytics Service
 * Analyzes learning patterns and predicts outcomes for users
 */

import { db } from '../db';
import { 
  users, 
  userProgress, 
  userInteractions,
  terms, 
  categories,
  favorites as userFavorites
} from '../../shared/schema';
import { eq, and, gte, lte, desc, asc, sql, count, avg, sum } from 'drizzle-orm';

export interface LearningOutcomeMetrics {
  userId: string;
  predictedCompletionRate: number;
  estimatedLearningTime: number; // in minutes
  difficultyAlignment: number; // 0-1 scale
  engagementScore: number; // 0-1 scale
  retentionProbability: number; // 0-1 scale
  recommendedLearningPath: string | null;
  strengthAreas: string[];
  improvementAreas: string[];
  nextBestActions: string[];
  confidenceScore: number; // 0-1 scale of prediction accuracy
}

export interface UserLearningProfile {
  userId: string;
  sessionPatterns: SessionPattern;
  comprehensionRate: number;
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  learningVelocity: number; // terms per session
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

class PredictiveAnalyticsService {
  /**
   * Generate comprehensive learning outcome predictions for a user
   */
  async predictLearningOutcomes(userId: string): Promise<LearningOutcomeMetrics> {
    const profile = await this.generateLearningProfile(userId);
    
    // Calculate predictive metrics based on available data
    const predictedCompletionRate = await this.calculateCompletionRate(profile);
    const estimatedLearningTime = await this.estimateLearningTime(profile);
    const difficultyAlignment = await this.calculateDifficultyAlignment(profile);
    const engagementScore = await this.calculateEngagementScore(profile);
    const retentionProbability = await this.calculateRetentionProbability(profile);
    const recommendedLearningPath = await this.recommendOptimalLearningPath(profile);
    const strengthAreas = await this.identifyStrengthAreas(userId);
    const improvementAreas = await this.identifyImprovementAreas(userId);
    const nextBestActions = await this.generateNextBestActions(profile);
    const confidenceScore = await this.calculateConfidenceScore(userId);

    return {
      userId,
      predictedCompletionRate,
      estimatedLearningTime,
      difficultyAlignment,
      engagementScore,
      retentionProbability,
      recommendedLearningPath,
      strengthAreas,
      improvementAreas,
      nextBestActions,
      confidenceScore
    };
  }

  /**
   * Generate detailed learning profile for a user
   */
  async generateLearningProfile(userId: string): Promise<UserLearningProfile> {
    const sessionData = await this.getSessionPatterns(userId);
    const comprehensionRate = await this.calculateComprehensionRate(userId);
    const preferredDifficulty = await this.determinePreferredDifficulty(userId);
    const learningVelocity = await this.calculateLearningVelocity(userId);
    const focusAreas = await this.identifyFocusAreas(userId);
    const timeOfDayPreference = await this.determineTimePreference(userId);
    const sessionDurationPreference = await this.calculatePreferredSessionDuration(userId);
    const conceptualStrengths = await this.identifyConceptualStrengths(userId);
    const lastActivity = await this.getLastActivity(userId);

    return {
      userId,
      sessionPatterns: sessionData,
      comprehensionRate,
      preferredDifficulty,
      learningVelocity,
      focusAreas,
      timeOfDayPreference,
      sessionDurationPreference,
      conceptualStrengths,
      lastActivityDate: lastActivity
    };
  }

  /**
   * Generate predictive insights with risk and opportunity analysis
   */
  async generatePredictiveInsights(userId: string): Promise<PredictiveInsights> {
    const riskFactors = await this.identifyRiskFactors(userId);
    const opportunityFactors = await this.identifyOpportunityFactors(userId);
    const personalizedRecommendations = await this.generatePersonalizedRecommendations(userId);
    const progressMilestones = await this.predictProgressMilestones(userId);
    const learningEfficiencyScore = await this.calculateLearningEfficiency(userId);

    return {
      userId,
      riskFactors,
      opportunityFactors,
      personalizedRecommendations,
      progressMilestones,
      learningEfficiencyScore
    };
  }

  private async getSessionPatterns(userId: string): Promise<SessionPattern> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Use userInteractions as a proxy for sessions
    const interactions = await db
      .select({
        timestamp: userInteractions.timestamp,
        type: userInteractions.interactionType
      })
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          gte(userInteractions.timestamp, thirtyDaysAgo)
        )
      )
      .orderBy(desc(userInteractions.timestamp));

    if (interactions.length === 0) {
      return {
        averageSessionLength: 0,
        sessionsPerWeek: 0,
        preferredTimeSlots: [],
        consistencyScore: 0,
        completionRate: 0
      };
    }

    // Group interactions by day to estimate sessions
    const sessionsByDay = new Map<string, typeof interactions>();
    interactions.forEach(interaction => {
      const day = interaction.timestamp.toDateString();
      if (!sessionsByDay.has(day)) {
        sessionsByDay.set(day, []);
      }
      sessionsByDay.get(day)!.push(interaction);
    });

    const averageSessionLength = 20; // Estimated 20 minutes average
    const sessionsPerWeek = (sessionsByDay.size / 4.3); // 30 days ≈ 4.3 weeks
    
    // Analyze time preferences
    const hourCounts = new Map<number, number>();
    interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const preferredTimeSlots = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => this.getTimeSlotName(hour));

    const consistencyScore = this.calculateConsistencyScore(sessionsByDay);
    const completionRate = 0.8; // Estimated completion rate

    return {
      averageSessionLength,
      sessionsPerWeek,
      preferredTimeSlots,
      consistencyScore,
      completionRate
    };
  }

  private async calculateComprehensionRate(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const interactions = await db
      .select({
        type: userInteractions.interactionType,
        timestamp: userInteractions.timestamp
      })
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          gte(userInteractions.timestamp, thirtyDaysAgo)
        )
      );

    if (interactions.length === 0) return 0.5; // Default middle score

    let comprehensionScore = 0;
    let totalInteractions = 0;

    interactions.forEach(interaction => {
      totalInteractions++;
      
      switch (interaction.type) {
        case 'view':
          comprehensionScore += 0.3;
          break;
        case 'favorite':
          comprehensionScore += 0.9;
          break;
        case 'search':
          comprehensionScore += 0.4;
          break;
        default:
          comprehensionScore += 0.5;
      }
    });

    return Math.min(comprehensionScore / totalInteractions, 1.0);
  }

  private async determinePreferredDifficulty(userId: string): Promise<'beginner' | 'intermediate' | 'advanced'> {
    // Since we don't have difficulty data, return intermediate as default
    return 'intermediate';
  }

  private async calculateLearningVelocity(userId: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentInteractions = await db
      .select({
        count: count(userInteractions.id)
      })
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          gte(userInteractions.timestamp, sevenDaysAgo)
        )
      );

    const totalInteractions = recentInteractions[0]?.count || 0;
    return totalInteractions / 7; // Average per day
  }

  private async identifyFocusAreas(userId: string): Promise<string[]> {
    const categoryEngagement = await db
      .select({
        categoryName: categories.name,
        interactionCount: count(userInteractions.id)
      })
      .from(userInteractions)
      .innerJoin(terms, eq(userInteractions.termId, terms.id))
      .innerJoin(categories, eq(terms.categoryId, categories.id))
      .where(eq(userInteractions.userId, userId))
      .groupBy(categories.name)
      .orderBy(desc(count(userInteractions.id)))
      .limit(5);

    return categoryEngagement.map(c => c.categoryName);
  }

  private async identifyStrengthAreas(userId: string): Promise<string[]> {
    const strengths = await db
      .select({
        categoryName: categories.name,
        avgEngagement: avg(sql`CASE 
          WHEN ${userInteractions.interactionType} = 'favorite' THEN 5
          WHEN ${userInteractions.interactionType} = 'view' THEN 2
          ELSE 1
        END`)
      })
      .from(userInteractions)
      .innerJoin(terms, eq(userInteractions.termId, terms.id))
      .innerJoin(categories, eq(terms.categoryId, categories.id))
      .where(eq(userInteractions.userId, userId))
      .groupBy(categories.name)
      .having(sql`COUNT(${userInteractions.id}) >= 5`)
      .orderBy(desc(avg(sql`CASE 
        WHEN ${userInteractions.interactionType} = 'favorite' THEN 5
        WHEN ${userInteractions.interactionType} = 'view' THEN 2
        ELSE 1
      END`)))
      .limit(3);

    return strengths.map(area => area.categoryName);
  }

  private async identifyImprovementAreas(userId: string): Promise<string[]> {
    const improvements = await db
      .select({
        categoryName: categories.name,
        avgEngagement: avg(sql`CASE 
          WHEN ${userInteractions.interactionType} = 'favorite' THEN 5
          WHEN ${userInteractions.interactionType} = 'view' THEN 2
          ELSE 1
        END`)
      })
      .from(userInteractions)
      .innerJoin(terms, eq(userInteractions.termId, terms.id))
      .innerJoin(categories, eq(terms.categoryId, categories.id))
      .where(eq(userInteractions.userId, userId))
      .groupBy(categories.name)
      .having(sql`COUNT(${userInteractions.id}) >= 3`)
      .orderBy(asc(avg(sql`CASE 
        WHEN ${userInteractions.interactionType} = 'favorite' THEN 5
        WHEN ${userInteractions.interactionType} = 'view' THEN 2
        ELSE 1
      END`)))
      .limit(3);

    return improvements.map(area => area.categoryName);
  }

  private async calculateCompletionRate(profile: UserLearningProfile): Promise<number> {
    const sessionConsistency = profile.sessionPatterns.consistencyScore;
    const comprehensionFactor = profile.comprehensionRate;
    const velocityFactor = Math.min(profile.learningVelocity / 10, 1);
    
    return (sessionConsistency * 0.4 + comprehensionFactor * 0.4 + velocityFactor * 0.2);
  }

  private async estimateLearningTime(profile: UserLearningProfile): Promise<number> {
    const baseTimePerTerm = 5; // minutes
    const velocityMultiplier = Math.max(0.5, 1 / Math.max(profile.learningVelocity, 1));
    const difficultyMultiplier = profile.preferredDifficulty === 'beginner' ? 1.5 : 
                                 profile.preferredDifficulty === 'advanced' ? 0.8 : 1.0;
    
    return baseTimePerTerm * velocityMultiplier * difficultyMultiplier;
  }

  private async calculateDifficultyAlignment(profile: UserLearningProfile): Promise<number> {
    const comprehensionThresholds = {
      'beginner': { min: 0.0, max: 0.4 },
      'intermediate': { min: 0.3, max: 0.7 },
      'advanced': { min: 0.6, max: 1.0 }
    };
    
    const thresholds = comprehensionThresholds[profile.preferredDifficulty];
    const comprehension = profile.comprehensionRate;
    
    if (comprehension >= thresholds.min && comprehension <= thresholds.max) {
      return 1.0;
    } else {
      const distance = Math.min(
        Math.abs(comprehension - thresholds.min),
        Math.abs(comprehension - thresholds.max)
      );
      return Math.max(0, 1 - distance * 2);
    }
  }

  private async calculateEngagementScore(profile: UserLearningProfile): Promise<number> {
    const sessionScore = Math.min(profile.sessionPatterns.sessionsPerWeek / 7, 1);
    const consistencyScore = profile.sessionPatterns.consistencyScore;
    const comprehensionScore = profile.comprehensionRate;
    const velocityScore = Math.min(profile.learningVelocity / 15, 1);
    
    return (sessionScore * 0.3 + consistencyScore * 0.3 + comprehensionScore * 0.25 + velocityScore * 0.15);
  }

  private async calculateRetentionProbability(profile: UserLearningProfile): Promise<number> {
    const daysSinceLastActivity = Math.floor(
      (new Date().getTime() - profile.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const activityRecency = Math.max(0, 1 - (daysSinceLastActivity / 30));
    const consistencyFactor = profile.sessionPatterns.consistencyScore;
    const engagementFactor = profile.comprehensionRate;
    
    return (activityRecency * 0.5 + consistencyFactor * 0.3 + engagementFactor * 0.2);
  }

  private async recommendOptimalLearningPath(profile: UserLearningProfile): Promise<string | null> {
    // Since we don't have learning paths in schema, return a generic recommendation
    if (profile.focusAreas.length > 0) {
      return `${profile.preferredDifficulty.charAt(0).toUpperCase() + profile.preferredDifficulty.slice(1)} ${profile.focusAreas[0]} Path`;
    }
    return null;
  }

  private async generateNextBestActions(profile: UserLearningProfile): Promise<string[]> {
    const actions: string[] = [];
    
    if (profile.sessionPatterns.consistencyScore < 0.5) {
      actions.push("Establish a regular study schedule");
    }
    
    if (profile.comprehensionRate < 0.4) {
      actions.push("Focus on fundamental concepts before advancing");
    }
    
    if (profile.learningVelocity < 2) {
      actions.push("Increase engagement with interactive content");
    }
    
    if (profile.focusAreas.length > 3) {
      actions.push("Focus on fewer topics for better retention");
    }
    
    actions.push("Continue your current learning momentum");
    
    return actions.slice(0, 5);
  }

  private async identifyRiskFactors(userId: string): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = [];
    const profile = await this.generateLearningProfile(userId);
    
    const daysSinceLastActivity = Math.floor(
      (new Date().getTime() - profile.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastActivity > 7) {
      risks.push({
        factor: 'Inactivity',
        severity: daysSinceLastActivity > 21 ? 'high' : daysSinceLastActivity > 14 ? 'medium' : 'low',
        description: `No activity for ${daysSinceLastActivity} days`,
        mitigation: 'Send gentle reminder notifications and suggest shorter learning sessions'
      });
    }
    
    if (profile.comprehensionRate < 0.3) {
      risks.push({
        factor: 'Low Comprehension',
        severity: 'high',
        description: 'Below-average understanding of concepts',
        mitigation: 'Recommend prerequisite content and provide additional explanations'
      });
    }
    
    if (profile.sessionPatterns.consistencyScore < 0.4) {
      risks.push({
        factor: 'Inconsistent Learning',
        severity: 'medium',
        description: 'Irregular learning patterns may impact retention',
        mitigation: 'Suggest creating a study schedule and setting learning reminders'
      });
    }
    
    return risks;
  }

  private async identifyOpportunityFactors(userId: string): Promise<OpportunityFactor[]> {
    const opportunities: OpportunityFactor[] = [];
    const profile = await this.generateLearningProfile(userId);
    
    if (profile.comprehensionRate > 0.7) {
      opportunities.push({
        factor: 'High Comprehension',
        potential: 'high',
        description: 'Strong understanding indicates readiness for advanced content',
        action: 'Recommend advanced topics and challenging learning paths'
      });
    }
    
    if (profile.sessionPatterns.consistencyScore > 0.8) {
      opportunities.push({
        factor: 'Consistent Learning',
        potential: 'high',
        description: 'Regular learning habits create opportunity for acceleration',
        action: 'Increase learning velocity and introduce complex concepts'
      });
    }
    
    if (profile.focusAreas.length <= 2) {
      opportunities.push({
        factor: 'Focused Learning',
        potential: 'medium',
        description: 'Concentrated focus on specific areas shows expertise potential',
        action: 'Provide deep-dive content and specialization paths'
      });
    }
    
    return opportunities;
  }

  private async generatePersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];
    const profile = await this.generateLearningProfile(userId);
    
    if (profile.comprehensionRate < 0.5) {
      recommendations.push({
        type: 'content',
        title: 'Start with Fundamentals',
        description: 'Begin with basic concepts to build a strong foundation',
        expectedImprovement: 'Improve comprehension by 30-40%',
        priority: 'high'
      });
    }
    
    if (profile.learningVelocity < 3) {
      recommendations.push({
        type: 'pacing',
        title: 'Increase Learning Pace',
        description: 'Engage with more terms per session to accelerate progress',
        expectedImprovement: 'Reduce learning time by 20-25%',
        priority: 'medium'
      });
    }
    
    if (profile.sessionPatterns.consistencyScore < 0.6) {
      recommendations.push({
        type: 'timing',
        title: 'Establish Study Schedule',
        description: `Study during your peak times: ${profile.timeOfDayPreference}`,
        expectedImprovement: 'Improve retention by 15-20%',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  private async predictProgressMilestones(userId: string): Promise<ProgressMilestone[]> {
    const milestones: ProgressMilestone[] = [];
    const profile = await this.generateLearningProfile(userId);
    
    const currentDate = new Date();
    
    const weeklyTarget = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    milestones.push({
      milestone: 'Weekly Learning Goal',
      targetDate: weeklyTarget,
      probability: Math.min(profile.sessionPatterns.consistencyScore * 1.2, 1.0),
      requirements: ['Maintain current learning pace', 'Complete 3-4 study sessions']
    });
    
    const monthlyTarget = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    milestones.push({
      milestone: 'Monthly Mastery Checkpoint',
      targetDate: monthlyTarget,
      probability: profile.comprehensionRate * 0.8,
      requirements: ['Demonstrate understanding of key concepts', 'Complete assessment activities']
    });
    
    return milestones;
  }

  private async calculateLearningEfficiency(userId: string): Promise<number> {
    const profile = await this.generateLearningProfile(userId);
    
    const timeEfficiency = profile.learningVelocity / profile.sessionPatterns.averageSessionLength || 0.5;
    const comprehensionEfficiency = profile.comprehensionRate;
    const consistencyEfficiency = profile.sessionPatterns.consistencyScore;
    
    return (timeEfficiency * 0.4 + comprehensionEfficiency * 0.4 + consistencyEfficiency * 0.2);
  }

  private async calculateConfidenceScore(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const interactionCount = await db
      .select({ count: count(userInteractions.id) })
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          gte(userInteractions.timestamp, thirtyDaysAgo)
        )
      );
    
    const totalInteractions = interactionCount[0]?.count || 0;
    
    // Confidence increases with more data points
    const interactionScore = Math.min(totalInteractions / 50, 1.0);
    
    return interactionScore;
  }

  // Helper methods
  private getTimeSlotName(hour: number): string {
    if (hour < 6) return 'Late Night';
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  }

  private calculateConsistencyScore(sessionsByDay: Map<string, any[]>): number {
    if (sessionsByDay.size < 2) return 0;
    
    // Simple consistency based on days with activity
    const daysWithActivity = sessionsByDay.size;
    const totalDays = 30;
    
    return Math.min(daysWithActivity / (totalDays * 0.2), 1); // Expect activity 20% of days
  }

  private async determineTimePreference(userId: string): Promise<string> {
    const interactions = await db
      .select({ timestamp: userInteractions.timestamp })
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .limit(20);
    
    if (interactions.length === 0) return 'Morning';
    
    const hourCounts = new Map<string, number>();
    interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      const timeSlot = this.getTimeSlotName(hour);
      hourCounts.set(timeSlot, (hourCounts.get(timeSlot) || 0) + 1);
    });
    
    const sortedTimeSlots = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return sortedTimeSlots[0]?.[0] || 'Morning';
  }

  private async calculatePreferredSessionDuration(userId: string): Promise<number> {
    // Default to 30 minutes since we don't have session duration data
    return 30;
  }

  private async identifyConceptualStrengths(userId: string): Promise<string[]> {
    const strengths = await db
      .select({
        categoryName: categories.name,
        engagementScore: avg(sql`CASE 
          WHEN ${userInteractions.interactionType} = 'favorite' THEN 5
          WHEN ${userInteractions.interactionType} = 'view' THEN 3
          ELSE 2
        END`)
      })
      .from(userInteractions)
      .innerJoin(terms, eq(userInteractions.termId, terms.id))
      .innerJoin(categories, eq(terms.categoryId, categories.id))
      .where(eq(userInteractions.userId, userId))
      .groupBy(categories.name)
      .having(sql`AVG(CASE 
        WHEN ${userInteractions.interactionType} = 'favorite' THEN 5
        WHEN ${userInteractions.interactionType} = 'view' THEN 3
        ELSE 2
      END) > 3`)
      .orderBy(desc(avg(sql`CASE 
        WHEN ${userInteractions.interactionType} = 'favorite' THEN 5
        WHEN ${userInteractions.interactionType} = 'view' THEN 3
        ELSE 2
      END`)))
      .limit(5);
    
    return strengths.map(s => s.categoryName);
  }

  private async getLastActivity(userId: string): Promise<Date> {
    const lastActivity = await db
      .select({ timestamp: userInteractions.timestamp })
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.timestamp))
      .limit(1);
    
    return lastActivity[0]?.timestamp || new Date();
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();