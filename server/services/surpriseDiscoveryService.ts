import { db } from "../db";
import { 
  terms, 
  users, 
  termViews, 
  userBehaviorEvents, 
  discoverySessions, 
  discoveryPreferences, 
  surpriseMetrics,
  userLearningProfile,
  categories,
  favorites
} from "../../shared/schema";
import { eq, sql, desc, asc, and, or, not, inArray, isNull, gt, lt } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface SurpriseDiscoveryRequest {
  userId?: string;
  sessionId: string;
  mode: 'random_adventure' | 'guided_discovery' | 'challenge_mode' | 'connection_quest';
  currentTermId?: string;
  excludeRecentlyViewed?: boolean;
  maxResults?: number;
}

export interface SurpriseDiscoveryResult {
  term: any;
  surpriseReason: string;
  confidenceScore: number;
  discoveryMode: string;
  algorithmVersion: string;
  connectionPath?: string[];
  metadata: {
    categoryName?: string;
    difficultyLevel?: string;
    isPopular?: boolean;
    isUnexplored?: boolean;
    connectionStrength?: number;
  };
}

export interface UserDiscoveryContext {
  recentlyViewedTerms: string[];
  favoriteCategories: string[];
  skillLevel: string;
  learningGoals: string[];
  explorationHistory: any[];
  preferences: any;
}

export class SurpriseDiscoveryService {
  private static readonly ALGORITHM_VERSION = "v1.2.0";
  private static readonly RECENT_TERMS_LOOKBACK_DAYS = 30;
  private static readonly MIN_SURPRISE_SCORE = 20;
  private static readonly MAX_SURPRISE_SCORE = 100;

  /**
   * Main entry point for surprise discovery
   */
  static async discoverSurprise(request: SurpriseDiscoveryRequest): Promise<SurpriseDiscoveryResult[]> {
    try {
      logger.info(`Starting surprise discovery with mode: ${request.mode}`, { 
        userId: request.userId, 
        sessionId: request.sessionId 
      });

      // Get user context for personalization
      const userContext = await this.buildUserContext(request.userId);
      
      // Select algorithm based on discovery mode
      let discoveryResults: SurpriseDiscoveryResult[];
      
      switch (request.mode) {
        case 'random_adventure':
          discoveryResults = await this.randomAdventureDiscovery(request, userContext);
          break;
        case 'guided_discovery':
          discoveryResults = await this.guidedDiscovery(request, userContext);
          break;
        case 'challenge_mode':
          discoveryResults = await this.challengeModeDiscovery(request, userContext);
          break;
        case 'connection_quest':
          discoveryResults = await this.connectionQuestDiscovery(request, userContext);
          break;
        default:
          throw new Error(`Unsupported discovery mode: ${request.mode}`);
      }

      // Track discovery session
      if (discoveryResults.length > 0) {
        await this.trackDiscoverySession(request, userContext, discoveryResults);
      }

      logger.info(`Completed surprise discovery, found ${discoveryResults.length} results`);
      return discoveryResults;

    } catch (error) {
      logger.error("Error in surprise discovery:", error);
      throw error;
    }
  }

  /**
   * Random Adventure: Completely random exploration
   */
  private static async randomAdventureDiscovery(
    request: SurpriseDiscoveryRequest, 
    userContext: UserDiscoveryContext
  ): Promise<SurpriseDiscoveryResult[]> {
    const excludeTermIds = request.excludeRecentlyViewed ? userContext.recentlyViewedTerms : [];
    const maxResults = request.maxResults || 3;

    // Get random terms with some bias towards less popular ones for surprise
    const randomTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        category: {
          id: categories.id,
          name: categories.name
        }
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(
        and(
          excludeTermIds.length > 0 ? not(inArray(terms.id, excludeTermIds)) : undefined,
          // Bias towards less viewed terms for surprise
          or(
            isNull(terms.viewCount),
            lt(terms.viewCount, sql`(SELECT AVG(view_count) FROM terms WHERE view_count IS NOT NULL)`)
          )
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(maxResults * 3); // Get extra to allow for filtering

    const results: SurpriseDiscoveryResult[] = [];
    
    for (const term of randomTerms.slice(0, maxResults)) {
      const surpriseScore = Math.floor(Math.random() * 40) + 60; // 60-100 for random adventure
      
      results.push({
        term,
        surpriseReason: "Completely random discovery - adventure awaits!",
        confidenceScore: surpriseScore,
        discoveryMode: request.mode,
        algorithmVersion: this.ALGORITHM_VERSION,
        metadata: {
          categoryName: term.category?.name,
          isUnexplored: (term.viewCount || 0) < 10,
          isPopular: (term.viewCount || 0) > 100
        }
      });
    }

    return results;
  }

  /**
   * Guided Discovery: Random within user's interest areas
   */
  private static async guidedDiscovery(
    request: SurpriseDiscoveryRequest, 
    userContext: UserDiscoveryContext
  ): Promise<SurpriseDiscoveryResult[]> {
    const excludeTermIds = request.excludeRecentlyViewed ? userContext.recentlyViewedTerms : [];
    const maxResults = request.maxResults || 3;

    // Get user's favorite categories or fall back to most viewed categories
    let favoriteCategories = userContext.favoriteCategories;
    
    if (favoriteCategories.length === 0) {
      // Infer favorite categories from viewing history
      const categoryViews = await db
        .select({
          categoryId: terms.categoryId,
          viewCount: sql<number>`COUNT(*)`.as('viewCount')
        })
        .from(termViews)
        .innerJoin(terms, eq(termViews.termId, terms.id))
        .where(eq(termViews.userId, request.userId || ''))
        .groupBy(terms.categoryId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(3);

      favoriteCategories = categoryViews
        .map(cv => cv.categoryId)
        .filter(Boolean) as string[];
    }

    // Find terms in user's interest areas but that they haven't seen
    const guidedTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        category: {
          id: categories.id,
          name: categories.name
        }
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(
        and(
          favoriteCategories.length > 0 ? inArray(terms.categoryId, favoriteCategories) : undefined,
          excludeTermIds.length > 0 ? not(inArray(terms.id, excludeTermIds)) : undefined
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(maxResults);

    const results: SurpriseDiscoveryResult[] = [];
    
    for (const term of guidedTerms) {
      const surpriseScore = Math.floor(Math.random() * 30) + 50; // 50-80 for guided discovery
      
      results.push({
        term,
        surpriseReason: `Hidden gem in ${term.category?.name || 'your favorite category'}!`,
        confidenceScore: surpriseScore,
        discoveryMode: request.mode,
        algorithmVersion: this.ALGORITHM_VERSION,
        metadata: {
          categoryName: term.category?.name,
          isUnexplored: (term.viewCount || 0) < 5,
          isPopular: (term.viewCount || 0) > 50
        }
      });
    }

    return results;
  }

  /**
   * Challenge Mode: Terms above user's usual difficulty level
   */
  private static async challengeModeDiscovery(
    request: SurpriseDiscoveryRequest, 
    userContext: UserDiscoveryContext
  ): Promise<SurpriseDiscoveryResult[]> {
    const excludeTermIds = request.excludeRecentlyViewed ? userContext.recentlyViewedTerms : [];
    const maxResults = request.maxResults || 2; // Fewer results for challenge mode

    // Identify advanced/complex terms
    // Terms with longer definitions, mathematical formulations, or low view counts relative to age
    const challengingTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        viewCount: terms.viewCount,
        mathFormulation: terms.mathFormulation,
        createdAt: terms.createdAt,
        category: {
          id: categories.id,
          name: categories.name
        }
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(
        and(
          excludeTermIds.length > 0 ? not(inArray(terms.id, excludeTermIds)) : undefined,
          // Look for challenging characteristics
          or(
            sql`LENGTH(${terms.definition}) > 500`, // Long definitions
            sql`${terms.mathFormulation} IS NOT NULL`, // Has mathematical formulation
            and(
              sql`${terms.createdAt} < NOW() - INTERVAL '30 days'`, // Older terms
              or(
                isNull(terms.viewCount),
                lt(terms.viewCount, 20) // Low view count for age
              )
            )
          )
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(maxResults);

    const results: SurpriseDiscoveryResult[] = [];
    
    for (const term of challengingTerms) {
      const surpriseScore = Math.floor(Math.random() * 20) + 70; // 70-90 for challenge mode
      let challengeReason = "Advanced concept ready for exploration";
      
      if (term.mathFormulation) {
        challengeReason = "Mathematical concept to challenge your understanding";
      } else if ((term.definition?.length || 0) > 500) {
        challengeReason = "Complex topic with rich depth to explore";
      }
      
      results.push({
        term,
        surpriseReason: challengeReason,
        confidenceScore: surpriseScore,
        discoveryMode: request.mode,
        algorithmVersion: this.ALGORITHM_VERSION,
        metadata: {
          categoryName: term.category?.name,
          difficultyLevel: "advanced",
          isUnexplored: (term.viewCount || 0) < 10,
          isPopular: (term.viewCount || 0) > 100
        }
      });
    }

    return results;
  }

  /**
   * Connection Quest: Terms related to recently viewed content
   */
  private static async connectionQuestDiscovery(
    request: SurpriseDiscoveryRequest, 
    userContext: UserDiscoveryContext
  ): Promise<SurpriseDiscoveryResult[]> {
    const maxResults = request.maxResults || 3;
    
    // Start from current term or most recent term
    const baseTermId = request.currentTermId || userContext.recentlyViewedTerms[0];
    
    if (!baseTermId) {
      // Fall back to guided discovery if no base term
      return this.guidedDiscovery(request, userContext);
    }

    // Get the base term details
    const baseTerm = await db
      .select({
        id: terms.id,
        name: terms.name,
        categoryId: terms.categoryId,
        definition: terms.definition
      })
      .from(terms)
      .where(eq(terms.id, baseTermId))
      .limit(1);

    if (!baseTerm.length) {
      return this.guidedDiscovery(request, userContext);
    }

    const baseTermData = baseTerm[0];
    
    // Find related terms by:
    // 1. Same category but different subconcepts
    // 2. Terms with overlapping keywords in definitions
    // 3. Terms referenced in applications or related fields
    
    const excludeTermIds = [baseTermId, ...userContext.recentlyViewedTerms];
    
    const relatedTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        category: {
          id: categories.id,
          name: categories.name
        }
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(
        and(
          not(inArray(terms.id, excludeTermIds)),
          or(
            // Same category
            eq(terms.categoryId, baseTermData.categoryId),
            // Text similarity (simplified keyword matching)
            sql`${terms.definition} ILIKE '%' || ${this.extractKeywords(baseTermData.definition).join('%\' OR ')} || '%'`
          )
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(maxResults * 2);

    const results: SurpriseDiscoveryResult[] = [];
    
    for (const term of relatedTerms.slice(0, maxResults)) {
      const connectionStrength = await this.calculateConnectionStrength(baseTermData, term);
      const surpriseScore = Math.floor(Math.random() * 25) + 55; // 55-80 for connection quest
      
      let connectionReason = `Connected to "${baseTermData.name}"`;
      if (term.categoryId === baseTermData.categoryId) {
        connectionReason = `Related concept in ${term.category?.name}`;
      }
      
      results.push({
        term,
        surpriseReason: connectionReason,
        confidenceScore: surpriseScore,
        discoveryMode: request.mode,
        algorithmVersion: this.ALGORITHM_VERSION,
        connectionPath: [baseTermData.name, term.name],
        metadata: {
          categoryName: term.category?.name,
          connectionStrength,
          isUnexplored: (term.viewCount || 0) < 15,
          isPopular: (term.viewCount || 0) > 75
        }
      });
    }

    return results;
  }

  /**
   * Build comprehensive user context for personalization
   */
  private static async buildUserContext(userId?: string): Promise<UserDiscoveryContext> {
    if (!userId) {
      return {
        recentlyViewedTerms: [],
        favoriteCategories: [],
        skillLevel: 'beginner',
        learningGoals: [],
        explorationHistory: [],
        preferences: {}
      };
    }

    // Get recently viewed terms
    const recentViews = await db
      .select({ termId: termViews.termId })
      .from(termViews)
      .where(
        and(
          eq(termViews.userId, userId),
          gt(termViews.viewedAt, sql`NOW() - INTERVAL '${this.RECENT_TERMS_LOOKBACK_DAYS} days'`)
        )
      )
      .orderBy(desc(termViews.viewedAt))
      .limit(50);

    // Get favorite categories from favorites
    const favCategories = await db
      .select({ categoryId: terms.categoryId })
      .from(favorites)
      .innerJoin(terms, eq(favorites.termId, terms.id))
      .where(eq(favorites.userId, userId))
      .groupBy(terms.categoryId);

    // Get user learning profile
    const profile = await db
      .select()
      .from(userLearningProfile)
      .where(eq(userLearningProfile.user_id, userId))
      .limit(1);

    // Get discovery preferences
    const preferences = await db
      .select()
      .from(discoveryPreferences)
      .where(eq(discoveryPreferences.user_id, userId))
      .limit(1);

    return {
      recentlyViewedTerms: recentViews.map(rv => rv.termId).filter(Boolean) as string[],
      favoriteCategories: favCategories.map(fc => fc.categoryId).filter(Boolean) as string[],
      skillLevel: profile[0]?.preferred_complexity || 'beginner',
      learningGoals: profile[0]?.active_learning_goals as string[] || [],
      explorationHistory: [], // Could be populated from behavior events
      preferences: preferences[0] || {}
    };
  }

  /**
   * Track discovery session for analytics
   */
  private static async trackDiscoverySession(
    request: SurpriseDiscoveryRequest,
    userContext: UserDiscoveryContext,
    results: SurpriseDiscoveryResult[]
  ): Promise<void> {
    try {
      for (const result of results) {
        await db.insert(discoverySessions).values({
          user_id: request.userId,
          session_id: request.sessionId,
          discovery_mode: request.mode,
          term_id: result.term.id,
          algorithm_version: this.ALGORITHM_VERSION,
          discovery_context: {
            userSkillLevel: userContext.skillLevel,
            favoriteCategories: userContext.favoriteCategories,
            recentTermsCount: userContext.recentlyViewedTerms.length
          },
          user_engagement: {
            confidenceScore: result.confidenceScore,
            surpriseReason: result.surpriseReason
          }
        });
      }
    } catch (error) {
      logger.error("Error tracking discovery session:", error);
      // Don't throw - tracking shouldn't break the main functionality
    }
  }

  /**
   * Extract key terms from definition for connection analysis
   */
  private static extractKeywords(definition: string): string[] {
    if (!definition) return [];
    
    // Simple keyword extraction - can be enhanced with NLP
    const words = definition.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4) // Only longer words
      .filter(word => !['that', 'with', 'this', 'from', 'they', 'have', 'been', 'will', 'used', 'uses', 'using'].includes(word));
    
    return words.slice(0, 5); // Top 5 keywords
  }

  /**
   * Calculate connection strength between two terms
   */
  private static async calculateConnectionStrength(term1: any, term2: any): Promise<number> {
    let strength = 0;
    
    // Same category = strong connection
    if (term1.categoryId === term2.categoryId) {
      strength += 40;
    }
    
    // Definition similarity (simplified)
    const keywords1 = this.extractKeywords(term1.definition);
    const keywords2 = this.extractKeywords(term2.definition);
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    strength += Math.min(commonKeywords.length * 10, 30);
    
    // Name similarity
    if (term1.name.toLowerCase().includes(term2.name.toLowerCase()) || 
        term2.name.toLowerCase().includes(term1.name.toLowerCase())) {
      strength += 20;
    }
    
    return Math.min(strength, 100);
  }

  /**
   * Get user's discovery preferences
   */
  static async getDiscoveryPreferences(userId: string) {
    const preferences = await db
      .select()
      .from(discoveryPreferences)
      .where(eq(discoveryPreferences.user_id, userId))
      .limit(1);

    return preferences[0] || {
      preferred_modes: ['guided_discovery'],
      excluded_categories: [],
      difficulty_preference: 'adaptive',
      exploration_frequency: 'moderate',
      feedback_enabled: true,
      surprise_tolerance: 50,
      personalization_level: 'medium'
    };
  }

  /**
   * Update user's discovery preferences
   */
  static async updateDiscoveryPreferences(userId: string, preferences: Partial<any>) {
    const existingPrefs = await db
      .select()
      .from(discoveryPreferences)
      .where(eq(discoveryPreferences.user_id, userId))
      .limit(1);

    if (existingPrefs.length > 0) {
      return await db
        .update(discoveryPreferences)
        .set({ ...preferences, updated_at: new Date() })
        .where(eq(discoveryPreferences.user_id, userId));
    } else {
      return await db
        .insert(discoveryPreferences)
        .values({ user_id: userId, ...preferences });
    }
  }

  /**
   * Provide feedback on discovery result
   */
  static async provideFeedback(
    userId: string, 
    sessionId: string, 
    termId: string, 
    surpriseRating: number, 
    relevanceRating: number
  ) {
    await db
      .update(discoverySessions)
      .set({ 
        surprise_rating: surpriseRating, 
        relevance_rating: relevanceRating 
      })
      .where(
        and(
          eq(discoverySessions.user_id, userId),
          eq(discoverySessions.session_id, sessionId),
          eq(discoverySessions.term_id, termId)
        )
      );

    // Update surprise metrics for the term
    await this.updateSurpriseMetrics(termId, surpriseRating, relevanceRating);
  }

  /**
   * Update surprise metrics for a term
   */
  private static async updateSurpriseMetrics(termId: string, surpriseRating: number, relevanceRating: number) {
    const existing = await db
      .select()
      .from(surpriseMetrics)
      .where(eq(surpriseMetrics.term_id, termId))
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      const newDiscoveryCount = current.discovery_count + 1;
      const newAvgSurprise = Math.round(
        ((current.average_surprise_rating || 0) * current.discovery_count + surpriseRating * 100) / newDiscoveryCount
      );
      const newAvgRelevance = Math.round(
        ((current.average_relevance_rating || 0) * current.discovery_count + relevanceRating * 100) / newDiscoveryCount
      );

      await db
        .update(surpriseMetrics)
        .set({
          discovery_count: newDiscoveryCount,
          average_surprise_rating: newAvgSurprise,
          average_relevance_rating: newAvgRelevance,
          last_discovery: new Date(),
          updated_at: new Date()
        })
        .where(eq(surpriseMetrics.term_id, termId));
    } else {
      await db
        .insert(surpriseMetrics)
        .values({
          term_id: termId,
          discovery_count: 1,
          average_surprise_rating: surpriseRating * 100,
          average_relevance_rating: relevanceRating * 100,
          last_discovery: new Date(),
          serendipity_score: Math.floor(Math.random() * 50) + 25 // Initial random score
        });
    }
  }
}