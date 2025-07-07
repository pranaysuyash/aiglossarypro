/**
 * Adaptive Content Organization Service
 * Analyzes learning patterns and dynamically organizes content for optimal learning
 */

import { db } from '../db';
import { 
  userInteractions, 
  terms, 
  categories, 
  users,
  userProfiles,
  type UserInteraction 
} from '../../shared/schema';
import { eq, and, gte, desc, sql, count, avg, sum, inArray } from 'drizzle-orm';

export interface LearningPattern {
  userId: string;
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'sequential' | 'exploratory' | 'project-based' | 'reference';
  sessionLength: 'short' | 'medium' | 'long'; // < 10min, 10-30min, > 30min
  contentPreferences: {
    conceptual: number; // 0-1 preference for theory
    practical: number; // 0-1 preference for examples
    visual: number; // 0-1 preference for diagrams
    depth: number; // 0-1 preference for detailed explanations
  };
  categoryAffinities: Array<{
    categoryId: string;
    categoryName: string;
    affinityScore: number; // 0-1 how much user engages with this category
    masteryLevel: number; // 0-1 estimated mastery
  }>;
  progressionPatterns: {
    averageTermsPerSession: number;
    preferredPathLength: number;
    returnFrequency: number; // How often user returns to previously viewed terms
    explorationRate: number; // How often user branches to new topics
  };
}

export interface AdaptiveRecommendation {
  termId: string;
  termName: string;
  categoryName: string;
  recommendationScore: number;
  recommendationType: 'next_logical' | 'fill_gap' | 'explore_new' | 'review_weak';
  reasoning: string;
  estimatedDifficulty: number; // 0-1
  estimatedEngagement: number; // 0-1
  adaptations: {
    contentFormat: 'overview' | 'detailed' | 'example-focused' | 'visual';
    presentationStyle: 'linear' | 'modular' | 'interactive';
    supportLevel: 'minimal' | 'guided' | 'intensive';
  };
}

export interface ContentOrganization {
  userId: string;
  organizationType: 'difficulty-based' | 'category-clustered' | 'pathway-optimized' | 'interest-driven';
  sections: Array<{
    sectionId: string;
    title: string;
    description: string;
    priority: number;
    estimatedTime: number; // minutes
    terms: AdaptiveRecommendation[];
    prerequisites: string[]; // termIds that should be completed first
    learningObjectives: string[];
  }>;
  adaptiveFeatures: {
    dynamicDifficulty: boolean;
    contextualHints: boolean;
    progressiveDisclosure: boolean;
    personalizedExamples: boolean;
  };
}

export interface LearningInsights {
  userId: string;
  overallProgress: number; // 0-1
  strengthAreas: string[]; // category names
  improvementAreas: string[]; // category names
  recommendedNextSteps: AdaptiveRecommendation[];
  learningVelocity: number; // terms mastered per week
  retentionRate: number; // 0-1
  engagementTrends: Array<{
    date: string;
    engagementScore: number;
    focusAreas: string[];
  }>;
  adaptiveAdjustments: {
    difficultyLevel: number; // current adaptive difficulty
    contentPacing: number; // content delivery speed multiplier
    supportLevel: number; // amount of guidance provided
  };
}

class AdaptiveContentService {

  /**
   * Analyze user learning patterns from interaction history
   */
  async analyzeLearningPatterns(userId: string): Promise<LearningPattern> {
    // Get user interactions for analysis
    const interactions = await db
      .select()
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.timestamp))
      .limit(1000);

    if (interactions.length === 0) {
      return this.getDefaultLearningPattern(userId);
    }

    // Analyze session patterns
    const sessionPatterns = this.analyzeSessionPatterns(interactions);
    
    // Analyze content preferences
    const contentPreferences = await this.analyzeContentPreferences(userId, interactions);
    
    // Analyze category affinities
    const categoryAffinities = await this.analyzeCategoryAffinities(userId, interactions);
    
    // Determine learning style
    const learningStyle = this.determineLearningStyle(interactions, sessionPatterns);
    
    // Determine preferred difficulty
    const preferredDifficulty = this.determinePreferredDifficulty(interactions);
    
    // Analyze progression patterns
    const progressionPatterns = this.analyzeProgressionPatterns(interactions);

    return {
      userId,
      preferredDifficulty,
      learningStyle,
      sessionLength: sessionPatterns.averageSessionLength,
      contentPreferences,
      categoryAffinities,
      progressionPatterns
    };
  }

  /**
   * Generate adaptive recommendations based on learning patterns
   */
  async generateAdaptiveRecommendations(
    userId: string, 
    count: number = 10
  ): Promise<AdaptiveRecommendation[]> {
    const learningPattern = await this.analyzeLearningPatterns(userId);
    const userProfile = await this.getUserProfile(userId);
    
    // Get potential terms for recommendation
    const candidateTerms = await this.getCandidateTerms(userId, learningPattern);
    
    const recommendations: AdaptiveRecommendation[] = [];
    
    for (const term of candidateTerms.slice(0, count * 2)) { // Get more than needed for filtering
      const recommendation = await this.createAdaptiveRecommendation(
        term,
        learningPattern,
        userProfile
      );
      
      if (recommendation.recommendationScore > 0.3) { // Threshold for quality
        recommendations.push(recommendation);
      }
    }
    
    // Sort by recommendation score and return top results
    return recommendations
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, count);
  }

  /**
   * Organize content adaptively for a user
   */
  async organizeContentAdaptively(userId: string): Promise<ContentOrganization> {
    const learningPattern = await this.analyzeLearningPatterns(userId);
    const recommendations = await this.generateAdaptiveRecommendations(userId, 20);
    
    // Determine organization type based on learning pattern
    const organizationType = this.determineOrganizationType(learningPattern);
    
    // Create adaptive sections
    const sections = await this.createAdaptiveSections(
      recommendations,
      learningPattern,
      organizationType
    );
    
    // Determine adaptive features
    const adaptiveFeatures = this.determineAdaptiveFeatures(learningPattern);

    return {
      userId,
      organizationType,
      sections,
      adaptiveFeatures
    };
  }

  /**
   * Get comprehensive learning insights for a user
   */
  async getLearningInsights(userId: string): Promise<LearningInsights> {
    const learningPattern = await this.analyzeLearningPatterns(userId);
    const userProgress = await this.calculateOverallProgress(userId);
    const recommendations = await this.generateAdaptiveRecommendations(userId, 5);
    
    const strengthAreas = learningPattern.categoryAffinities
      .filter(ca => ca.masteryLevel > 0.7)
      .map(ca => ca.categoryName);
    
    const improvementAreas = learningPattern.categoryAffinities
      .filter(ca => ca.masteryLevel < 0.4 && ca.affinityScore > 0.1)
      .map(ca => ca.categoryName);
    
    const engagementTrends = await this.calculateEngagementTrends(userId);
    const adaptiveAdjustments = this.calculateAdaptiveAdjustments(learningPattern);

    return {
      userId,
      overallProgress: userProgress.completionRate,
      strengthAreas,
      improvementAreas,
      recommendedNextSteps: recommendations,
      learningVelocity: userProgress.weeklyVelocity,
      retentionRate: userProgress.retentionRate,
      engagementTrends,
      adaptiveAdjustments
    };
  }

  /**
   * Update adaptive settings based on user feedback
   */
  async updateAdaptiveSettings(
    userId: string,
    feedback: {
      difficultyAdjustment?: number; // -1 to 1
      paceAdjustment?: number; // -1 to 1
      contentTypePreference?: string;
      feedbackType: 'too_easy' | 'too_hard' | 'just_right' | 'preference_change';
    }
  ): Promise<void> {
    // Get current user profile
    const profile = await this.getUserProfile(userId);
    
    // Apply feedback adjustments
    const adjustments = this.calculateFeedbackAdjustments(feedback);
    
    // Update user profile with new preferences
    await this.updateUserProfile(userId, adjustments);
    
    // Log adaptation event for learning
    await this.logAdaptationEvent(userId, feedback, adjustments);
  }

  /**
   * Private helper methods
   */
  private getDefaultLearningPattern(userId: string): LearningPattern {
    return {
      userId,
      preferredDifficulty: 'intermediate',
      learningStyle: 'sequential',
      sessionLength: 'medium',
      contentPreferences: {
        conceptual: 0.5,
        practical: 0.5,
        visual: 0.5,
        depth: 0.5
      },
      categoryAffinities: [],
      progressionPatterns: {
        averageTermsPerSession: 5,
        preferredPathLength: 3,
        returnFrequency: 0.2,
        explorationRate: 0.3
      }
    };
  }

  private analyzeSessionPatterns(interactions: UserInteraction[]) {
    // Group interactions by session
    const sessions = new Map<string, UserInteraction[]>();
    
    interactions.forEach(interaction => {
      const sessionId = interaction.metadata?.sessionId as string;
      if (sessionId) {
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, []);
        }
        sessions.get(sessionId)!.push(interaction);
      }
    });

    // Calculate session metrics
    const sessionLengths = Array.from(sessions.values()).map(session => {
      if (session.length < 2) return 0;
      const start = new Date(session[session.length - 1].timestamp);
      const end = new Date(session[0].timestamp);
      return (end.getTime() - start.getTime()) / 1000 / 60; // minutes
    });

    const averageLength = sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length;
    
    let averageSessionLength: 'short' | 'medium' | 'long';
    if (averageLength < 10) {
      averageSessionLength = 'short';
    } else if (averageLength < 30) {
      averageSessionLength = 'medium';
    } else {
      averageSessionLength = 'long';
    }

    return {
      sessionCount: sessions.size,
      averageLength,
      averageSessionLength
    };
  }

  private async analyzeContentPreferences(userId: string, interactions: UserInteraction[]) {
    // Analyze interaction patterns to determine content preferences
    const viewInteractions = interactions.filter(i => i.interactionType === 'view');
    const shareInteractions = interactions.filter(i => i.interactionType === 'share');
    const favoriteInteractions = interactions.filter(i => i.interactionType === 'favorite');
    
    // Mock analysis - in practice, would analyze content types and engagement
    return {
      conceptual: 0.6 + Math.random() * 0.3,
      practical: 0.4 + Math.random() * 0.4,
      visual: 0.5 + Math.random() * 0.3,
      depth: 0.5 + Math.random() * 0.4
    };
  }

  private async analyzeCategoryAffinities(userId: string, interactions: UserInteraction[]) {
    // Get term categories from interactions
    const termIds = [...new Set(interactions.map(i => i.termId).filter(Boolean))];
    
    if (termIds.length === 0) return [];
    
    // Get category data for these terms
    const termCategories = await db
      .select({
        termId: terms.id,
        categoryId: categories.id,
        categoryName: categories.name
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(inArray(terms.id, termIds));

    // Calculate category engagement
    const categoryStats = new Map<string, { 
      interactions: number; 
      categoryName: string; 
      uniqueTerms: Set<string> 
    }>();

    interactions.forEach(interaction => {
      const termCategory = termCategories.find(tc => tc.termId === interaction.termId);
      if (termCategory?.categoryId) {
        const key = termCategory.categoryId;
        if (!categoryStats.has(key)) {
          categoryStats.set(key, {
            interactions: 0,
            categoryName: termCategory.categoryName || 'Unknown',
            uniqueTerms: new Set()
          });
        }
        const stats = categoryStats.get(key)!;
        stats.interactions++;
        if (interaction.termId) {
          stats.uniqueTerms.add(interaction.termId);
        }
      }
    });

    // Convert to affinity scores
    const totalInteractions = interactions.length;
    return Array.from(categoryStats.entries()).map(([categoryId, stats]) => ({
      categoryId,
      categoryName: stats.categoryName,
      affinityScore: stats.interactions / totalInteractions,
      masteryLevel: Math.min(stats.uniqueTerms.size / 20, 1) // Assume 20 terms = mastery
    }));
  }

  private determineLearningStyle(
    interactions: UserInteraction[], 
    sessionPatterns: any
  ): LearningPattern['learningStyle'] {
    // Analyze patterns to determine learning style
    const searchCount = interactions.filter(i => i.interactionType === 'search').length;
    const viewCount = interactions.filter(i => i.interactionType === 'view').length;
    const explorationRatio = searchCount / Math.max(viewCount, 1);
    
    if (explorationRatio > 0.3) return 'exploratory';
    if (sessionPatterns.sessionCount > 10 && sessionPatterns.averageLength > 20) return 'project-based';
    if (explorationRatio < 0.1) return 'reference';
    return 'sequential';
  }

  private determinePreferredDifficulty(interactions: UserInteraction[]): LearningPattern['preferredDifficulty'] {
    // Mock analysis - would analyze difficulty of engaged content
    const rand = Math.random();
    if (rand < 0.3) return 'beginner';
    if (rand < 0.7) return 'intermediate';
    return 'advanced';
  }

  private analyzeProgressionPatterns(interactions: UserInteraction[]) {
    const viewInteractions = interactions.filter(i => i.interactionType === 'view');
    const uniqueTerms = new Set(viewInteractions.map(i => i.termId));
    const sessionCount = new Set(interactions.map(i => i.metadata?.sessionId)).size;
    
    return {
      averageTermsPerSession: viewInteractions.length / Math.max(sessionCount, 1),
      preferredPathLength: 3 + Math.random() * 4, // Mock calculation
      returnFrequency: 0.1 + Math.random() * 0.3,
      explorationRate: 0.2 + Math.random() * 0.4
    };
  }

  private async getUserProfile(userId: string) {
    // Try to get user profile, return default if not found
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    
    return profile[0] || null;
  }

  private async getCandidateTerms(userId: string, pattern: LearningPattern) {
    // Get terms user hasn't viewed yet, preferring categories they like
    const viewedTermIds = await db
      .select({ termId: userInteractions.termId })
      .from(userInteractions)
      .where(and(
        eq(userInteractions.userId, userId),
        eq(userInteractions.interactionType, 'view')
      ));

    const viewedIds = viewedTermIds.map(v => v.termId).filter(Boolean);
    
    // Get candidate terms from preferred categories
    const candidateTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        categoryId: terms.categoryId,
        categoryName: categories.name,
        difficulty: sql<number>`COALESCE(${terms.difficulty}, 0.5)`.as('difficulty')
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(viewedIds.length > 0 ? sql`${terms.id} NOT IN (${viewedIds.join(',')})` : sql`1=1`)
      .limit(50);

    return candidateTerms;
  }

  private async createAdaptiveRecommendation(
    term: any,
    pattern: LearningPattern,
    userProfile: any
  ): Promise<AdaptiveRecommendation> {
    // Calculate recommendation score based on multiple factors
    const categoryAffinity = pattern.categoryAffinities.find(
      ca => ca.categoryId === term.categoryId
    )?.affinityScore || 0.1;
    
    const difficultyMatch = this.calculateDifficultyMatch(
      term.difficulty || 0.5,
      pattern.preferredDifficulty
    );
    
    const recommendationScore = (categoryAffinity * 0.4) + (difficultyMatch * 0.4) + (Math.random() * 0.2);
    
    return {
      termId: term.id,
      termName: term.name,
      categoryName: term.categoryName || 'General',
      recommendationScore,
      recommendationType: this.determineRecommendationType(term, pattern),
      reasoning: this.generateRecommendationReasoning(term, pattern, categoryAffinity),
      estimatedDifficulty: term.difficulty || 0.5,
      estimatedEngagement: recommendationScore,
      adaptations: this.determineContentAdaptations(pattern)
    };
  }

  private calculateDifficultyMatch(termDifficulty: number, preferredDifficulty: string): number {
    const difficultyMap = { beginner: 0.3, intermediate: 0.6, advanced: 0.9 };
    const preferred = difficultyMap[preferredDifficulty as keyof typeof difficultyMap];
    return 1 - Math.abs(termDifficulty - preferred);
  }

  private determineRecommendationType(term: any, pattern: LearningPattern): AdaptiveRecommendation['recommendationType'] {
    const rand = Math.random();
    if (rand < 0.4) return 'next_logical';
    if (rand < 0.7) return 'fill_gap';
    if (rand < 0.9) return 'explore_new';
    return 'review_weak';
  }

  private generateRecommendationReasoning(term: any, pattern: LearningPattern, affinity: number): string {
    if (affinity > 0.3) {
      return `Based on your strong interest in ${term.categoryName}`;
    }
    if (pattern.learningStyle === 'exploratory') {
      return `This expands your knowledge into new areas`;
    }
    return `This fits your current learning level and style`;
  }

  private determineContentAdaptations(pattern: LearningPattern) {
    return {
      contentFormat: pattern.contentPreferences.depth > 0.7 ? 'detailed' as const : 'overview' as const,
      presentationStyle: pattern.learningStyle === 'sequential' ? 'linear' as const : 'modular' as const,
      supportLevel: pattern.preferredDifficulty === 'beginner' ? 'guided' as const : 'minimal' as const
    };
  }

  private determineOrganizationType(pattern: LearningPattern): ContentOrganization['organizationType'] {
    if (pattern.learningStyle === 'sequential') return 'pathway-optimized';
    if (pattern.categoryAffinities.length > 3) return 'category-clustered';
    if (pattern.preferredDifficulty === 'beginner') return 'difficulty-based';
    return 'interest-driven';
  }

  private async createAdaptiveSections(
    recommendations: AdaptiveRecommendation[],
    pattern: LearningPattern,
    organizationType: ContentOrganization['organizationType']
  ) {
    // Group recommendations into logical sections
    const sections = [];
    
    if (organizationType === 'category-clustered') {
      const categories = [...new Set(recommendations.map(r => r.categoryName))];
      categories.forEach((category, index) => {
        const categoryTerms = recommendations.filter(r => r.categoryName === category);
        sections.push({
          sectionId: `category_${index}`,
          title: `${category} Concepts`,
          description: `Learn more about ${category.toLowerCase()}`,
          priority: index + 1,
          estimatedTime: categoryTerms.length * 10,
          terms: categoryTerms,
          prerequisites: [],
          learningObjectives: [`Master ${category.toLowerCase()} fundamentals`]
        });
      });
    } else {
      // Default sectioning
      const chunkSize = Math.ceil(recommendations.length / 3);
      for (let i = 0; i < 3; i++) {
        const chunk = recommendations.slice(i * chunkSize, (i + 1) * chunkSize);
        if (chunk.length > 0) {
          sections.push({
            sectionId: `section_${i + 1}`,
            title: `Learning Path ${i + 1}`,
            description: `Continue your learning journey`,
            priority: i + 1,
            estimatedTime: chunk.length * 10,
            terms: chunk,
            prerequisites: i > 0 ? [`section_${i}`] : [],
            learningObjectives: [`Progress in your learning journey`]
          });
        }
      }
    }
    
    return sections;
  }

  private determineAdaptiveFeatures(pattern: LearningPattern) {
    return {
      dynamicDifficulty: pattern.preferredDifficulty !== 'advanced',
      contextualHints: pattern.learningStyle !== 'reference',
      progressiveDisclosure: pattern.contentPreferences.depth < 0.7,
      personalizedExamples: pattern.contentPreferences.practical > 0.6
    };
  }

  private async calculateOverallProgress(userId: string) {
    // Mock calculation
    return {
      completionRate: 0.3 + Math.random() * 0.4,
      weeklyVelocity: 5 + Math.random() * 10,
      retentionRate: 0.7 + Math.random() * 0.2
    };
  }

  private async calculateEngagementTrends(userId: string) {
    // Generate mock engagement trends
    const trends = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        engagementScore: 0.5 + Math.random() * 0.4,
        focusAreas: ['Machine Learning', 'Neural Networks'].slice(0, Math.floor(Math.random() * 2) + 1)
      });
    }
    return trends;
  }

  private calculateAdaptiveAdjustments(pattern: LearningPattern) {
    const difficultyMap = { beginner: 0.3, intermediate: 0.6, advanced: 0.9 };
    return {
      difficultyLevel: difficultyMap[pattern.preferredDifficulty],
      contentPacing: pattern.sessionLength === 'short' ? 0.7 : pattern.sessionLength === 'long' ? 1.3 : 1.0,
      supportLevel: pattern.learningStyle === 'reference' ? 0.3 : 0.7
    };
  }

  private calculateFeedbackAdjustments(feedback: any) {
    // Convert feedback into profile adjustments
    return {
      difficultyPreference: feedback.difficultyAdjustment || 0,
      pacePreference: feedback.paceAdjustment || 0,
      contentType: feedback.contentTypePreference
    };
  }

  private async updateUserProfile(userId: string, adjustments: any) {
    // Update user profile with new preferences
    // This would update the userProfiles table
  }

  private async logAdaptationEvent(userId: string, feedback: any, adjustments: any) {
    // Log the adaptation for machine learning purposes
    // This would help improve the adaptive algorithm over time
  }
}

export const adaptiveContentService = new AdaptiveContentService();