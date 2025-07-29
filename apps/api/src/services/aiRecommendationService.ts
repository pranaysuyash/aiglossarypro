/**
 * AI-based Learning Path Recommendation Service
 * Provides personalized learning path recommendations based on user behavior and preferences
 */

import { and, desc, eq, gte, inArray, isNull, not, sql } from 'drizzle-orm';
import {
  favorites,
  learningPathSteps,
  learningPaths,
  terms,
  userInteractions,
  userLearningProgress,
} from '@aiglossarypro/shared/schema';
import { db } from '@aiglossarypro/database';
import { log as logger } from '../utils/logger';

interface UserProfile {
  userId: string;
  completedPaths: string[];
  currentPaths: string[];
  favoriteTerms: string[];
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
  categoryPreferences: string[];
  averageSessionTime: number;
  skillLevel: number; // 0-100
}

interface RecommendationScore {
  pathId: string;
  score: number;
  reasoning: string[];
}

interface RecommendedPath {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  estimated_duration: number;
  category_id: string;
  completion_count: number;
  rating: number;
  recommendationScore: number;
  reasoning: string[];
  isOfficial: boolean;
}

export class AIRecommendationService {
  /**
   * Get personalized learning path recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit = 10
  ): Promise<RecommendedPath[]> {
    try {
      // Build user profile
      const userProfile = await this.buildUserProfile(userId);

      // Get candidate paths (exclude completed ones)
      const candidatePaths = await this.getCandidatePaths(userProfile);

      // Score each candidate path
      const scoredPaths = await Promise.all(
        candidatePaths.map(path => this.scorePath(path, userProfile))
      );

      // Sort by score and return top recommendations
      const recommendations = scoredPaths.sort((a, b) => b.score - a.score).slice(0, limit);

      // Convert to recommended path format
      const result = await this.enrichRecommendations(recommendations);

      logger.info('Generated AI recommendations', {
        userId,
        recommendationCount: result.length,
        userSkillLevel: userProfile.skillLevel,
        difficultyPreference: userProfile.difficultyPreference,
      });

      return result;
    } catch (error) {
      logger.error('Error generating AI recommendations', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to popular paths
      return this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Build a comprehensive user profile for recommendations
   */
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    const [completedPathsResult, currentPathsResult, favoriteTermsResult, interactionsResult] =
      await Promise.all([
        // Completed paths
        db
          .select({ path_id: userLearningProgress.learning_path_id })
          .from(userLearningProgress)
          .where(
            and(
              eq(userLearningProgress.user_id, userId),
              eq(userLearningProgress.completion_percentage, 100)
            )
          ),

        // Current paths (in progress)
        db
          .select({
            path_id: userLearningProgress.learning_path_id,
            completion_percentage: userLearningProgress.completion_percentage,
            time_spent: userLearningProgress.time_spent,
          })
          .from(userLearningProgress)
          .where(
            and(eq(userLearningProgress.user_id, userId), isNull(userLearningProgress.completed_at))
          ),

        // Favorite terms
        db
          .select({ term_id: favorites.termId })
          .from(favorites)
          .where(eq(favorites.userId, userId)),

        // User interactions for category preferences
        db
          .select({
            category_id: sql`terms.category_id`,
            interaction_count: sql<number>`count(*)`,
          })
          .from(userInteractions)
          .leftJoin(terms, eq(userInteractions.termId, terms.id))
          .where(eq(userInteractions.userId, userId))
          .groupBy(sql`terms.category_id`)
          .orderBy(desc(sql`count(*)`))
          .limit(5),
      ]);

    // Calculate average session time
    const avgSessionTime =
      currentPathsResult.length > 0
        ? currentPathsResult.reduce((sum, p) => sum + (Number(p.time_spent) || 0), 0) /
          currentPathsResult.length
        : 0;

    // Determine skill level based on completed paths and completion rates
    const skillLevel = this.calculateSkillLevel(completedPathsResult, currentPathsResult);

    // Determine difficulty preference
    const difficultyPreference = this.determineDifficultyPreference(
      skillLevel,
      completedPathsResult
    );

    return {
      userId,
      completedPaths: completedPathsResult.map(p => p.path_id),
      currentPaths: currentPathsResult.map(p => p.path_id),
      favoriteTerms: favoriteTermsResult.map(f => f.term_id),
      difficultyPreference,
      categoryPreferences: interactionsResult.map(i => i.category_id).filter(Boolean) as string[],
      averageSessionTime: avgSessionTime,
      skillLevel,
    };
  }

  /**
   * Calculate user skill level (0-100) based on their learning history
   */
  private calculateSkillLevel(completedPaths: unknown[], currentPaths: unknown[]): number {
    let score = 0;

    // Base score from completed paths
    score += completedPaths.length * 15;

    // Bonus for in-progress paths with high completion
    currentPaths.forEach(path => {
      const completion = Number(path.completion_percentage) || 0;
      if (completion > 50) {score += completion / 10;}
    });

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Determine user's preferred difficulty level
   */
  private determineDifficultyPreference(
    skillLevel: number,
    _completedPaths: unknown[]
  ): 'beginner' | 'intermediate' | 'advanced' {
    if (skillLevel < 30) {return 'beginner';}
    if (skillLevel < 70) {return 'intermediate';}
    return 'advanced';
  }

  /**
   * Get candidate learning paths (excluding completed ones)
   */
  private async getCandidatePaths(userProfile: UserProfile) {
    const excludeIds = [...userProfile.completedPaths, ...userProfile.currentPaths];

    const whereConditions = [eq(learningPaths.is_published, true)];

    if (excludeIds.length > 0) {
      whereConditions.push(not(inArray(learningPaths.id, excludeIds)));
    }

    return db
      .select({
        id: learningPaths.id,
        name: learningPaths.name,
        description: learningPaths.description,
        difficulty_level: learningPaths.difficulty_level,
        estimated_duration: learningPaths.estimated_duration,
        category_id: learningPaths.category_id,
        prerequisites: learningPaths.prerequisites,
        learning_objectives: learningPaths.learning_objectives,
        completion_count: learningPaths.completion_count,
        view_count: learningPaths.view_count,
        rating: learningPaths.rating,
        is_official: learningPaths.is_official,
        created_at: learningPaths.created_at,
      })
      .from(learningPaths)
      .where(and(...whereConditions))
      .limit(50); // Get more candidates than needed for better scoring
  }

  /**
   * Score a learning path for a specific user
   */
  private async scorePath(path: any, userProfile: UserProfile): Promise<RecommendationScore> {
    let score = 0;
    const reasoning: string[] = [];

    // 1. Difficulty level matching (25 points max)
    const difficultyScore = this.scoreDifficulty(path.difficulty_level, userProfile);
    score += difficultyScore.score;
    if (difficultyScore.reason) {reasoning.push(difficultyScore.reason);}

    // 2. Category preference (20 points max)
    if (userProfile.categoryPreferences.includes(path.category_id)) {
      const categoryBonus = 20;
      score += categoryBonus;
      reasoning.push(`Matches your preferred category`);
    }

    // 3. Prerequisites satisfaction (15 points max)
    const prereqScore = await this.scorePrerequisites(path, userProfile);
    score += prereqScore.score;
    if (prereqScore.reason) {reasoning.push(prereqScore.reason);}

    // 4. Duration preference (10 points max)
    const durationScore = this.scoreDuration(path.estimated_duration, userProfile);
    score += durationScore.score;
    if (durationScore.reason) {reasoning.push(durationScore.reason);}

    // 5. Popularity and quality (15 points max)
    const popularityScore = this.scorePopularity(path);
    score += popularityScore.score;
    if (popularityScore.reason) {reasoning.push(popularityScore.reason);}

    // 6. Content relevance based on favorite terms (15 points max)
    const relevanceScore = await this.scoreContentRelevance(path, userProfile);
    score += relevanceScore.score;
    if (relevanceScore.reason) {reasoning.push(relevanceScore.reason);}

    return {
      pathId: path.id,
      score,
      reasoning,
    };
  }

  /**
   * Score based on difficulty level match
   */
  private scoreDifficulty(
    pathDifficulty: string,
    userProfile: UserProfile
  ): { score: number; reason?: string } {
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const userPref = difficultyMap[userProfile.difficultyPreference];
    const pathLevel = difficultyMap[pathDifficulty as keyof typeof difficultyMap] || 1;

    if (pathLevel === userPref) {
      return {
        score: 25,
        reason: `Perfect difficulty match for your ${userProfile.difficultyPreference} level`,
      };
    } else if (Math.abs(pathLevel - userPref) === 1) {
      return {
        score: 15,
        reason: `Slightly ${pathLevel > userPref ? 'challenging' : 'easier'} than your usual level`,
      };
    } 
      return { score: 5 };
    
  }

  /**
   * Score based on prerequisites satisfaction
   */
  private async scorePrerequisites(
    path: any,
    userProfile: UserProfile
  ): Promise<{ score: number; reason?: string }> {
    if (!path.prerequisites || path.prerequisites.length === 0) {
      return { score: 10, reason: 'No prerequisites required' };
    }

    // Check if user has completed prerequisite paths
    const completedPrereqs = path.prerequisites.filter((prereq: string) =>
      userProfile.completedPaths.includes(prereq)
    );

    const satisfactionRate = completedPrereqs.length / path.prerequisites.length;

    if (satisfactionRate === 1) {
      return { score: 15, reason: 'You meet all prerequisites' };
    } else if (satisfactionRate >= 0.5) {
      return { score: 10, reason: 'You meet most prerequisites' };
    } 
      return { score: 0, reason: 'Missing some prerequisites' };
    
  }

  /**
   * Score based on estimated duration preference
   */
  private scoreDuration(
    duration: number,
    userProfile: UserProfile
  ): { score: number; reason?: string } {
    // Prefer paths that match user's typical session time
    const durationHours = duration / 60; // Convert to hours
    const avgSessionHours = userProfile.averageSessionTime / 3600; // Convert to hours

    if (durationHours <= avgSessionHours * 2) {
      return { score: 10, reason: 'Duration matches your typical learning sessions' };
    } else if (durationHours <= avgSessionHours * 4) {
      return { score: 6, reason: 'Moderate time commitment' };
    } 
      return { score: 3 };
    
  }

  /**
   * Score based on path popularity and quality
   */
  private scorePopularity(path: any): { score: number; reason?: string } {
    let score = 0;
    const reasons: string[] = [];

    // Official paths get bonus
    if (path.is_official) {
      score += 8;
      reasons.push('Official learning path');
    }

    // High completion rate bonus
    if (path.completion_count > 100) {
      score += 4;
      reasons.push('Popular among learners');
    }

    // High rating bonus
    if (path.rating && path.rating >= 4.0) {
      score += 3;
      reasons.push('Highly rated content');
    }

    return {
      score: Math.min(score, 15),
      reason: reasons.length > 0 ? reasons.join(', ') : undefined,
    };
  }

  /**
   * Score based on content relevance to user's favorite terms
   */
  private async scoreContentRelevance(
    path: any,
    userProfile: UserProfile
  ): Promise<{ score: number; reason?: string }> {
    if (userProfile.favoriteTerms.length === 0) {
      return { score: 5 }; // Neutral score if no favorites
    }

    // Get terms used in this learning path
    const pathTerms = await db
      .select({ term_id: learningPathSteps.term_id })
      .from(learningPathSteps)
      .where(eq(learningPathSteps.learning_path_id, path.id));

    const pathTermIds = pathTerms.map(t => t.term_id).filter(Boolean);

    // Calculate overlap with user's favorites
    const overlap = pathTermIds.filter(termId => userProfile.favoriteTerms.includes(termId));

    if (overlap.length > 0) {
      const relevanceScore = Math.min((overlap.length / pathTermIds.length) * 15, 15);
      return {
        score: relevanceScore,
        reason: `Includes ${overlap.length} of your favorite terms`,
      };
    }

    return { score: 5 };
  }

  /**
   * Enrich recommendations with full path data
   */
  private async enrichRecommendations(
    scoredPaths: RecommendationScore[]
  ): Promise<RecommendedPath[]> {
    if (scoredPaths.length === 0) {return [];}

    const pathIds = scoredPaths.map(p => p.pathId);

    const pathsData = await db
      .select()
      .from(learningPaths)
      .where(inArray(learningPaths.id, pathIds));

    return scoredPaths.map(scored => {
      const pathData = pathsData.find(p => p.id === scored.pathId);
      if (!pathData) {throw new Error(`Path data not found for ${scored.pathId}`);}

      return {
        id: pathData.id,
        name: pathData.name,
        description: pathData.description || '',
        difficulty_level: pathData.difficulty_level || 'beginner',
        estimated_duration: pathData.estimated_duration || 0,
        category_id: pathData.category_id || '',
        completion_count: pathData.completion_count || 0,
        rating: pathData.rating || 0,
        recommendationScore: Math.round(scored.score),
        reasoning: scored.reasoning,
        isOfficial: pathData.is_official || false,
      };
    });
  }

  /**
   * Fallback recommendations when AI fails
   */
  private async getFallbackRecommendations(limit: number): Promise<RecommendedPath[]> {
    const popularPaths = await db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.is_published, true))
      .orderBy(desc(learningPaths.completion_count), desc(learningPaths.view_count))
      .limit(limit);

    return popularPaths.map(path => ({
      id: path.id,
      name: path.name,
      description: path.description || '',
      difficulty_level: path.difficulty_level || 'beginner',
      estimated_duration: path.estimated_duration || 0,
      category_id: path.category_id || '',
      completion_count: path.completion_count || 0,
      rating: path.rating || 0,
      recommendationScore: 50, // Neutral score for fallback
      reasoning: ['Popular learning path'],
      isOfficial: path.is_official || false,
    }));
  }

  /**
   * Get trending learning paths (recently popular)
   */
  async getTrendingPaths(limit = 5): Promise<RecommendedPath[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingPaths = await db
      .select({
        id: learningPaths.id,
        name: learningPaths.name,
        description: learningPaths.description,
        difficulty_level: learningPaths.difficulty_level,
        estimated_duration: learningPaths.estimated_duration,
        category_id: learningPaths.category_id,
        completion_count: learningPaths.completion_count,
        rating: learningPaths.rating,
        is_official: learningPaths.is_official,
        recent_starts: sql<number>`count(${userLearningProgress.id})`,
      })
      .from(learningPaths)
      .leftJoin(userLearningProgress, eq(learningPaths.id, userLearningProgress.learning_path_id))
      .where(
        and(
          eq(learningPaths.is_published, true),
          gte(userLearningProgress.started_at, thirtyDaysAgo)
        )
      )
      .groupBy(learningPaths.id)
      .orderBy(desc(sql`count(${userLearningProgress.id})`))
      .limit(limit);

    return trendingPaths.map(path => ({
      id: path.id,
      name: path.name,
      description: path.description || '',
      difficulty_level: path.difficulty_level || 'beginner',
      estimated_duration: path.estimated_duration || 0,
      category_id: path.category_id || '',
      completion_count: path.completion_count || 0,
      rating: path.rating || 0,
      recommendationScore: 75,
      reasoning: [`Trending: ${path.recent_starts} new learners this month`],
      isOfficial: path.is_official || false,
    }));
  }
}

// Export singleton instance
export const aiRecommendationService = new AIRecommendationService();
