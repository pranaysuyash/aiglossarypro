import { and, desc, eq, gte, inArray, notExists, sql } from 'drizzle-orm';
import NodeCache from 'node-cache';
import OpenAI from 'openai';
import {
  categories,
  contentRecommendationCache,
  favorites,
  type InsertUserBehaviorEvent,
  terms,
  termViews,
  type UserBehaviorEvent,
  type UserInteractionPattern,
  userBehaviorEvents,
  userLearningProfile,
} from '../../shared/schema';
import { db } from '../db';
import { log as logger } from '../utils/logger';

// Types for personalization
export interface PersonalizedRecommendation {
  id: string;
  type: 'term' | 'category' | 'learning_path' | 'content_section';
  entityId: string;
  title: string;
  description?: string;
  score: number;
  reasoning: string[];
  metadata: Record<string, unknown>;
}

export interface UserPersonalizationProfile {
  userId: string;
  learningStyle: string;
  preferredComplexity: string;
  interestCategories: string[];
  engagementPatterns: Record<string, unknown>;
  skillLevel: Record<string, number>;
  activeGoals: string[];
  lastUpdated: Date;
}

export interface PersonalizationContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  sessionLength: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  currentPath: string;
  referrer?: string;
}

export interface RecommendationRequest {
  userId: string;
  context: PersonalizationContext;
  recommendationType: 'homepage' | 'term_detail' | 'category_page' | 'search_results';
  limit: number;
  excludeIds?: string[];
}

class PersonalizationService {
  private openai: OpenAI;
  private cache: NodeCache;
  private algorithmVersion = 'v1.2.0';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    // Cache recommendations for 30 minutes
    this.cache = new NodeCache({
      stdTTL: 1800, // 30 minutes
      maxKeys: 10000,
    });
  }

  /**
   * Track user behavior event for personalization
   */
  async trackBehaviorEvent(
    event: Omit<InsertUserBehaviorEvent, 'id' | 'created_at'>
  ): Promise<void> {
    try {
      await db.insert(userBehaviorEvents).values({
        ...event,
        created_at: new Date(),
      });

      // Asynchronously update user patterns
      this.updateUserPatternsAsync(event.user_id);
    } catch (error) {
      logger.error('Error tracking behavior event', { error, event });
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    request: RecommendationRequest
  ): Promise<PersonalizedRecommendation[]> {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get<PersonalizedRecommendation[]>(cacheKey);

    if (cached) {
      await this.updateCacheHitCount(cacheKey);
      return cached;
    }

    try {
      // Get user profile and behavior patterns
      const userProfile = await this.getUserPersonalizationProfile(request.userId);
      const recentBehavior = await this.getRecentUserBehavior(request.userId, 7); // Last 7 days

      // Generate recommendations using multiple algorithms
      const recommendations = await this.generateRecommendations(
        userProfile,
        recentBehavior,
        request
      );

      // Cache the results
      this.cache.set(cacheKey, recommendations);
      await this.cacheRecommendations(cacheKey, request.userId, recommendations);

      return recommendations;
    } catch (error) {
      logger.error('Error generating personalized recommendations', { error, request });

      // Fallback to popular content
      return this.getFallbackRecommendations(request);
    }
  }

  /**
   * Get user personalization profile
   */
  async getUserPersonalizationProfile(userId: string): Promise<UserPersonalizationProfile> {
    try {
      const [profile] = await db
        .select()
        .from(userLearningProfile)
        .where(eq(userLearningProfile.user_id, userId));

      if (!profile) {
        // Create default profile
        return this.createDefaultProfile(userId);
      }

      return {
        userId: profile.user_id,
        learningStyle: profile.learning_style || 'mixed',
        preferredComplexity: profile.preferred_complexity || 'intermediate',
        interestCategories: [],
        engagementPatterns: (profile.engagement_patterns as Record<string, unknown>) || {},
        skillLevel: (profile.skill_assessments as Record<string, number>) || {},
        activeGoals: (profile.active_learning_goals as any)?.goals || [],
        lastUpdated: profile.updated_at || new Date(),
      };
    } catch (error) {
      logger.error('Error getting user profile', { error, userId });
      return this.createDefaultProfile(userId);
    }
  }

  /**
   * Update user interaction patterns based on recent behavior
   */
  private async updateUserPatternsAsync(userId: string): Promise<void> {
    try {
      // Get recent behavior (last 30 days)
      const recentEvents = await db
        .select()
        .from(userBehaviorEvents)
        .where(
          and(
            eq(userBehaviorEvents.user_id, userId),
            gte(userBehaviorEvents.created_at, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          )
        )
        .orderBy(desc(userBehaviorEvents.created_at))
        .limit(1000);

      // Analyze patterns
      const patterns = this.analyzeUserPatterns(recentEvents);

      // Update or insert patterns
      for (const pattern of patterns) {
        await this.upsertUserPattern(userId, pattern);
      }

      // Update learning profile
      await this.updateLearningProfile(userId, recentEvents);
    } catch (error) {
      logger.error('Error updating user patterns', { error, userId });
    }
  }

  /**
   * Analyze user behavior patterns
   */
  private analyzeUserPatterns(events: UserBehaviorEvent[]): UserInteractionPattern[] {
    const patterns: Partial<UserInteractionPattern>[] = [];

    // Time-based patterns
    const timePattern = this.analyzeTimePatterns(events);
    if (timePattern) {
      patterns.push({
        pattern_type: 'time_preference',
        pattern_data: timePattern,
        confidence_score: this.calculateConfidence(events.length, 'time'),
      });
    }

    // Content preference patterns
    const contentPattern = this.analyzeContentPatterns(events);
    if (contentPattern) {
      patterns.push({
        pattern_type: 'content_preference',
        pattern_data: contentPattern,
        confidence_score: this.calculateConfidence(events.length, 'content'),
      });
    }

    // Learning velocity patterns
    const velocityPattern = this.analyzeLearningVelocity(events);
    if (velocityPattern) {
      patterns.push({
        pattern_type: 'learning_velocity',
        pattern_data: velocityPattern,
        confidence_score: this.calculateConfidence(events.length, 'velocity'),
      });
    }

    return patterns as UserInteractionPattern[];
  }

  /**
   * Generate recommendations using multiple algorithms
   */
  private async generateRecommendations(
    userProfile: UserPersonalizationProfile,
    recentBehavior: UserBehaviorEvent[],
    request: RecommendationRequest
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Algorithm 1: Collaborative Filtering
    const collaborativeRecs = await this.getCollaborativeRecommendations(userProfile, request);
    recommendations.push(...collaborativeRecs);

    // Algorithm 2: Content-Based Filtering
    const contentRecs = await this.getContentBasedRecommendations(
      userProfile,
      recentBehavior,
      request
    );
    recommendations.push(...contentRecs);

    // Algorithm 3: Hybrid AI-Enhanced Recommendations
    const aiRecs = await this.getAIEnhancedRecommendations(userProfile, recentBehavior, request);
    recommendations.push(...aiRecs);

    // Algorithm 4: Contextual Recommendations
    const contextualRecs = await this.getContextualRecommendations(userProfile, request);
    recommendations.push(...contextualRecs);

    // Deduplicate and rank
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    const rankedRecs = this.rankRecommendations(uniqueRecs, userProfile, request);

    return rankedRecs.slice(0, request.limit);
  }

  /**
   * Collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    userProfile: UserPersonalizationProfile,
    _request: RecommendationRequest
  ): Promise<PersonalizedRecommendation[]> {
    try {
      // Find users with similar behavior patterns
      const similarUsers = await this.findSimilarUsers(userProfile.userId);

      if (similarUsers.length === 0) {
        return [];
      }

      // Get content they've engaged with that this user hasn't
      const recommendations = await db
        .select({
          termId: termViews.termId,
          termName: terms.name,
          termDescription: terms.shortDefinition,
          viewCount: sql<number>`count(*)`,
          avgRating: sql<number>`avg(coalesce(${favorites}.created_at is not null, 0)::int * 100)`,
        })
        .from(termViews)
        .innerJoin(terms, eq(termViews.termId, terms.id))
        .leftJoin(
          favorites,
          and(eq(favorites.termId, terms.id), inArray(favorites.userId, similarUsers))
        )
        .where(
          and(
            inArray(termViews.userId, similarUsers),
            notExists(
              db
                .select()
                .from(termViews)
                .where(
                  and(eq(termViews.userId, userProfile.userId), eq(termViews.termId, terms.id))
                )
            )
          )
        )
        .groupBy(termViews.termId, terms.name, terms.shortDefinition)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      return recommendations.map(rec => ({
        id: rec.termId,
        type: 'term' as const,
        entityId: rec.termId,
        title: rec.termName,
        description: rec.termDescription || '',
        score: Math.min(95, 60 + rec.viewCount * 5),
        reasoning: [
          'Users with similar interests viewed this',
          `${rec.viewCount} similar users engaged with this content`,
          `Average satisfaction: ${Math.round(rec.avgRating || 0)}%`,
        ],
        metadata: {
          algorithm: 'collaborative_filtering',
          similarUsers: similarUsers.length,
          engagement: rec.viewCount,
        },
      }));
    } catch (error) {
      logger.error('Error in collaborative recommendations', { error });
      return [];
    }
  }

  /**
   * Content-based filtering recommendations
   */
  private async getContentBasedRecommendations(
    userProfile: UserPersonalizationProfile,
    recentBehavior: UserBehaviorEvent[],
    _request: RecommendationRequest
  ): Promise<PersonalizedRecommendation[]> {
    try {
      // Analyze user's content preferences from recent behavior
      const viewedCategories = recentBehavior
        .filter(event => event.event_type === 'view' && event.entity_type === 'term')
        .map(event => event.context as any)
        .filter(context => context?.categoryId)
        .map(context => context.categoryId);

      if (viewedCategories.length === 0) {
        return [];
      }

      // Find similar content in those categories
      const recommendations = await db
        .select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          categoryId: terms.categoryId,
          viewCount: terms.viewCount,
          categoryName: sql<string>`(SELECT name FROM ${categories} WHERE id = ${terms.categoryId})`,
        })
        .from(terms)
        .where(
          and(
            inArray(terms.categoryId, viewedCategories),
            notExists(
              db
                .select()
                .from(termViews)
                .where(
                  and(eq(termViews.userId, userProfile.userId), eq(termViews.termId, terms.id))
                )
            )
          )
        )
        .orderBy(desc(terms.viewCount))
        .limit(15);

      return recommendations.map(rec => ({
        id: rec.id,
        type: 'term' as const,
        entityId: rec.id,
        title: rec.name,
        description: rec.shortDefinition || '',
        score: this.calculateContentBasedScore(rec, userProfile),
        reasoning: [
          `Similar to content you've viewed in ${rec.categoryName}`,
          'Matches your content preferences',
          `Popular content (${rec.viewCount || 0} views)`,
        ],
        metadata: {
          algorithm: 'content_based',
          category: rec.categoryName,
          popularity: rec.viewCount,
        },
      }));
    } catch (error) {
      logger.error('Error in content-based recommendations', { error });
      return [];
    }
  }

  /**
   * AI-enhanced recommendations using OpenAI
   */
  private async getAIEnhancedRecommendations(
    userProfile: UserPersonalizationProfile,
    recentBehavior: UserBehaviorEvent[],
    request: RecommendationRequest
  ): Promise<PersonalizedRecommendation[]> {
    try {
      if (!this.openai.apiKey) {
        return [];
      }

      // Prepare user context for AI
      const userContext = this.prepareUserContextForAI(userProfile, recentBehavior);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI/ML learning recommendation system. Based on user behavior and preferences, recommend relevant AI/ML terms and topics. Return a JSON array of recommendations with the following structure:
            {
              "recommendations": [
                {
                  "topic": "term_name",
                  "reasoning": "why this is recommended",
                  "relevance_score": 85,
                  "category": "category_name"
                }
              ]
            }`,
          },
          {
            role: 'user',
            content: `User Profile: ${JSON.stringify(userContext)}. 
            Context: ${request.recommendationType} page, ${request.context.timeOfDay} session.
            Please recommend ${Math.min(5, request.limit)} AI/ML terms or topics.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {return [];}

      const parsed = JSON.parse(aiResponse);

      // Convert AI recommendations to our format
      return this.convertAIRecommendations(parsed.recommendations || []);
    } catch (error) {
      logger.error('Error in AI recommendations', { error });
      return [];
    }
  }

  /**
   * Get contextual recommendations based on current context
   */
  private async getContextualRecommendations(
    userProfile: UserPersonalizationProfile,
    request: RecommendationRequest
  ): Promise<PersonalizedRecommendation[]> {
    const contextRecs: PersonalizedRecommendation[] = [];

    // Time-based recommendations
    if (request.context.timeOfDay === 'morning') {
      // Suggest foundational topics in the morning
      contextRecs.push(...(await this.getFoundationalTopics(userProfile)));
    } else if (request.context.timeOfDay === 'afternoon') {
      // Suggest practical applications in the afternoon
      contextRecs.push(...(await this.getPracticalApplications(userProfile)));
    }

    // Device-based recommendations
    if (request.context.deviceType === 'mobile') {
      // Suggest shorter, more digestible content for mobile
      contextRecs.push(...(await this.getMobileOptimizedContent(userProfile)));
    }

    return contextRecs;
  }

  /**
   * Helper methods
   */
  private async createDefaultProfile(userId: string): Promise<UserPersonalizationProfile> {
    const defaultProfile: UserPersonalizationProfile = {
      userId,
      learningStyle: 'mixed',
      preferredComplexity: 'intermediate',
      interestCategories: [],
      engagementPatterns: {},
      skillLevel: {},
      activeGoals: [],
      lastUpdated: new Date(),
    };

    // Create in database
    try {
      await db.insert(userLearningProfile).values({
        user_id: userId,
        learning_style: 'mixed',
        preferred_complexity: 'intermediate',
        preferred_content_types: ['practical', 'examples'],
        engagement_patterns: {},
        skill_assessments: {},
        active_learning_goals: { goals: [] },
      });
    } catch (error) {
      logger.error('Error creating default profile', { error, userId });
    }

    return defaultProfile;
  }

  private generateCacheKey(request: RecommendationRequest): string {
    return `rec_${request.userId}_${request.recommendationType}_${request.limit}_${JSON.stringify(request.context)}`;
  }

  private async updateCacheHitCount(cacheKey: string): Promise<void> {
    try {
      await db
        .update(contentRecommendationCache)
        .set({ hit_count: sql`${contentRecommendationCache.hit_count} + 1` })
        .where(eq(contentRecommendationCache.cache_key, cacheKey));
    } catch (error) {
      logger.error('Error updating cache hit count', { error, cacheKey });
    }
  }

  private async cacheRecommendations(
    cacheKey: string,
    userId: string,
    recommendations: PersonalizedRecommendation[]
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await db
        .insert(contentRecommendationCache)
        .values({
          cache_key: cacheKey,
          user_id: userId,
          recommendation_data: recommendations,
          algorithm_version: this.algorithmVersion,
          expires_at: expiresAt,
          hit_count: 0,
        })
        .onConflictDoUpdate({
          target: contentRecommendationCache.cache_key,
          set: {
            recommendation_data: recommendations,
            cache_created_at: new Date(),
            expires_at: expiresAt,
            hit_count: 0,
          },
        });
    } catch (error) {
      logger.error('Error caching recommendations', { error, cacheKey });
    }
  }

  private async getFallbackRecommendations(
    request: RecommendationRequest
  ): Promise<PersonalizedRecommendation[]> {
    try {
      // Return popular content as fallback
      const popular = await db
        .select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
        })
        .from(terms)
        .orderBy(desc(terms.viewCount))
        .limit(request.limit);

      return popular.map(term => ({
        id: term.id,
        type: 'term' as const,
        entityId: term.id,
        title: term.name,
        description: term.shortDefinition || '',
        score: 50, // Lower score for fallback
        reasoning: ['Popular content', 'Trending in AI/ML community'],
        metadata: {
          algorithm: 'fallback',
          popularity: term.viewCount,
        },
      }));
    } catch (error) {
      logger.error('Error getting fallback recommendations', { error });
      return [];
    }
  }

  // Additional helper methods would go here...
  private analyzeTimePatterns(_events: UserBehaviorEvent[]): Record<string, unknown> | null {
    // Implementation for time pattern analysis
    return null;
  }

  private analyzeContentPatterns(_events: UserBehaviorEvent[]): Record<string, unknown> | null {
    // Implementation for content pattern analysis
    return null;
  }

  private analyzeLearningVelocity(_events: UserBehaviorEvent[]): Record<string, unknown> | null {
    // Implementation for learning velocity analysis
    return null;
  }

  private calculateConfidence(eventCount: number, _patternType: string): number {
    // Calculate confidence score based on data volume and pattern type
    const baseConfidence = Math.min(90, eventCount * 2);
    return Math.max(10, baseConfidence);
  }

  private async upsertUserPattern(
    _userId: string,
    _pattern: Partial<UserInteractionPattern>
  ): Promise<void> {
    // Implementation for upserting user patterns
  }

  private async updateLearningProfile(
    _userId: string,
    _events: UserBehaviorEvent[]
  ): Promise<void> {
    // Implementation for updating learning profile
  }

  private async getRecentUserBehavior(userId: string, days: number): Promise<UserBehaviorEvent[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return db
      .select()
      .from(userBehaviorEvents)
      .where(
        and(eq(userBehaviorEvents.user_id, userId), gte(userBehaviorEvents.created_at, startDate))
      )
      .orderBy(desc(userBehaviorEvents.created_at));
  }

  private async findSimilarUsers(_userId: string): Promise<string[]> {
    // Implementation for finding similar users
    return [];
  }

  private calculateContentBasedScore(
    _content: any,
    _userProfile: UserPersonalizationProfile
  ): number {
    // Implementation for content-based scoring
    return 75;
  }

  private prepareUserContextForAI(
    userProfile: UserPersonalizationProfile,
    recentBehavior: UserBehaviorEvent[]
  ) {
    return {
      learningStyle: userProfile.learningStyle,
      complexity: userProfile.preferredComplexity,
      recentTopics: recentBehavior.slice(0, 10).map(e => e.entity_type),
      goals: userProfile.activeGoals,
    };
  }

  private convertAIRecommendations(aiRecs: unknown[]): PersonalizedRecommendation[] {
    return aiRecs.map(rec => ({
      id: `ai_${rec.topic}`,
      type: 'term' as const,
      entityId: rec.topic,
      title: rec.topic,
      description: rec.reasoning,
      score: rec.relevance_score || 70,
      reasoning: [rec.reasoning],
      metadata: {
        algorithm: 'ai_enhanced',
        category: rec.category,
      },
    }));
  }

  private async getFoundationalTopics(
    _userProfile: UserPersonalizationProfile
  ): Promise<PersonalizedRecommendation[]> {
    // Implementation for foundational topics
    return [];
  }

  private async getPracticalApplications(
    _userProfile: UserPersonalizationProfile
  ): Promise<PersonalizedRecommendation[]> {
    // Implementation for practical applications
    return [];
  }

  private async getMobileOptimizedContent(
    _userProfile: UserPersonalizationProfile
  ): Promise<PersonalizedRecommendation[]> {
    // Implementation for mobile-optimized content
    return [];
  }

  private deduplicateRecommendations(
    recommendations: PersonalizedRecommendation[]
  ): PersonalizedRecommendation[] {
    const seen = new Set();
    return recommendations.filter(rec => {
      if (seen.has(rec.entityId)) {return false;}
      seen.add(rec.entityId);
      return true;
    });
  }

  private rankRecommendations(
    recommendations: PersonalizedRecommendation[],
    userProfile: UserPersonalizationProfile,
    request: RecommendationRequest
  ): PersonalizedRecommendation[] {
    return recommendations.sort((a, b) => {
      // Multi-factor ranking
      let scoreA = a.score;
      let scoreB = b.score;

      // Boost score based on user preferences
      if (userProfile.interestCategories.includes(a.metadata.category)) {
        scoreA += 10;
      }
      if (userProfile.interestCategories.includes(b.metadata.category)) {
        scoreB += 10;
      }

      // Context-based boosting
      if (request.context.timeOfDay === 'morning' && a.metadata.algorithm === 'content_based') {
        scoreA += 5;
      }
      if (request.context.timeOfDay === 'morning' && b.metadata.algorithm === 'content_based') {
        scoreB += 5;
      }

      return scoreB - scoreA;
    });
  }
}

export const personalizationService = new PersonalizationService();
