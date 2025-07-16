/**
 * Personalized Homepage API Routes
 * AI-powered personalized content and recommendations
 */

import { and, desc, eq, sql } from 'drizzle-orm';
import type { Express, Request, Response } from 'express';
import { learningPaths, terms, userInteractions, userLearningProgress } from '../../shared/schema';
import { db } from '../db';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import {
  generatePersonalizedRecommendations,
  generateUserProfile,
  type PersonalizedRecommendation,
  type UserProfile,
} from '../services/userProfilingService';
import { ErrorCode, handleDatabaseError, sendErrorResponse } from '../utils/errorHandler';
import { log as logger } from '../utils/logger';

interface PersonalizedHomepageData {
  userProfile: UserProfile;
  recommendations: PersonalizedRecommendation[];
  personalizedSections: {
    recentActivity: any[];
    recommendedForYou: PersonalizedRecommendation[];
    continuelearning: any[];
    exploreNew: PersonalizedRecommendation[];
    trending: PersonalizedRecommendation[];
  };
  adaptiveNavigation: {
    priorityCategories: string[];
    suggestedPaths: string[];
    recentTopics: string[];
  };
}

export function registerPersonalizedHomepageRoutes(app: Express): void {
  /**
   * Get personalized homepage data
   * GET /api/personalized/homepage
   */
  app.get(
    '/api/personalized/homepage',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;

        if (!user) {
          return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'Authentication required');
        }

        // Generate or retrieve user profile
        let userProfile = await getUserProfile(user.id);
        if (!userProfile) {
          userProfile = await generateUserProfile(user.id);
          await cacheUserProfile(userProfile);
        }

        // Generate personalized recommendations
        const recommendations = await generatePersonalizedRecommendations(userProfile, 20);

        // Create personalized sections
        const personalizedSections = {
          recentActivity: await getRecentActivity(user.id),
          recommendedForYou: recommendations.filter(r => r.relevanceScore > 70),
          continuelearning: await getContinueLearning(user.id),
          exploreNew: recommendations.filter(r => r.reason.includes('Explore')),
          trending: recommendations.filter(r => r.reason.includes('Trending')),
        };

        // Create adaptive navigation suggestions
        const adaptiveNavigation = {
          priorityCategories: userProfile.interests.slice(0, 3).map(i => i.categoryId),
          suggestedPaths: recommendations
            .filter(r => r.type === 'learning_path')
            .slice(0, 3)
            .map(r => r.id),
          recentTopics: userProfile.recentTopics,
        };

        const homepageData: PersonalizedHomepageData = {
          userProfile,
          recommendations,
          personalizedSections,
          adaptiveNavigation,
        };

        res.json({
          success: true,
          data: homepageData,
          message: 'Personalized homepage data generated successfully',
        });
      } catch (error) {
        logger.error('Get personalized homepage error', {
          error: error instanceof Error ? error.message : String(error),
          userId: (req as any).user?.id,
        });
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );

  /**
   * Get user profile
   * GET /api/personalized/profile
   */
  app.get('/api/personalized/profile', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'Authentication required');
      }

      const userProfile = await getUserProfile(user.id);

      if (!userProfile) {
        const newProfile = await generateUserProfile(user.id);
        await cacheUserProfile(newProfile);

        return res.json({
          success: true,
          data: newProfile,
          message: 'User profile generated successfully',
        });
      }

      res.json({
        success: true,
        data: userProfile,
        message: 'User profile retrieved successfully',
      });
    } catch (error) {
      logger.error('Get user profile error', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
      });
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * Regenerate user profile
   * POST /api/personalized/profile/regenerate
   */
  app.post(
    '/api/personalized/profile/regenerate',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;

        if (!user) {
          return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'Authentication required');
        }

        const newProfile = await generateUserProfile(user.id);
        await cacheUserProfile(newProfile);

        res.json({
          success: true,
          data: newProfile,
          message: 'User profile regenerated successfully',
        });
      } catch (error) {
        logger.error('Regenerate user profile error', {
          error: error instanceof Error ? error.message : String(error),
          userId: (req as any).user?.id,
        });
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );

  /**
   * Get personalized recommendations
   * GET /api/personalized/recommendations?type=all&limit=10
   */
  app.get(
    '/api/personalized/recommendations',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const { type = 'all', limit = '10' } = req.query;

        if (!user) {
          return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'Authentication required');
        }

        let userProfile = await getUserProfile(user.id);
        if (!userProfile) {
          userProfile = await generateUserProfile(user.id);
          await cacheUserProfile(userProfile);
        }

        let recommendations = await generatePersonalizedRecommendations(
          userProfile,
          parseInt(limit as string)
        );

        // Filter by type if specified
        if (type !== 'all') {
          recommendations = recommendations.filter(r => r.type === type);
        }

        res.json({
          success: true,
          data: recommendations,
          metadata: {
            userProfile: {
              skillLevel: userProfile.skillLevel,
              learningStyle: userProfile.learningStyle,
              topInterests: userProfile.interests.slice(0, 3),
            },
          },
        });
      } catch (error) {
        logger.error('Get personalized recommendations error', {
          error: error instanceof Error ? error.message : String(error),
          userId: (req as any).user?.id,
        });
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );

  /**
   * Update user preferences
   * PUT /api/personalized/preferences
   */
  app.put(
    '/api/personalized/preferences',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const { preferredCategories, learningStyle, difficultyPreference, contentTypes } = req.body;

        if (!user) {
          return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'Authentication required');
        }

        // Update user preferences (this would typically update a user_preferences table)
        // For now, we'll regenerate the profile with explicit preferences
        const updatedProfile = await generateUserProfile(user.id);

        // Apply user-specified preferences
        if (learningStyle) {
          updatedProfile.learningStyle = learningStyle;
        }

        if (preferredCategories) {
          // Boost specified categories in interests
          updatedProfile.interests = updatedProfile.interests.map(interest => {
            if (preferredCategories.includes(interest.categoryId)) {
              return { ...interest, interestScore: Math.min(interest.interestScore * 1.5, 100) };
            }
            return interest;
          });
        }

        await cacheUserProfile(updatedProfile);

        res.json({
          success: true,
          data: updatedProfile,
          message: 'User preferences updated successfully',
        });
      } catch (error) {
        console.error('Update user preferences error:', error);
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );

  /**
   * Record personalization feedback
   * POST /api/personalized/feedback
   */
  app.post(
    '/api/personalized/feedback',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const { recommendationId, recommendationType, feedback, rating, action } = req.body;

        if (!user) {
          return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'Authentication required');
        }

        // Record feedback for improving personalization
        // This would typically go to a personalization_feedback table
        logger.info('Personalization feedback recorded', {
          userId: user.id,
          recommendationId,
          recommendationType,
          feedback,
          rating,
          action,
          timestamp: new Date(),
        });

        res.json({
          success: true,
          message: 'Feedback recorded successfully',
        });
      } catch (error) {
        console.error('Record personalization feedback error:', error);
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );
}

/**
 * Helper function to get cached user profile
 */
async function getUserProfile(_userId: string): Promise<UserProfile | null> {
  try {
    // In a real implementation, this would check a cache or user_profiles table
    // For now, we'll return null to always generate fresh profiles
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Helper function to cache user profile
 */
async function cacheUserProfile(userProfile: UserProfile): Promise<void> {
  try {
    // In a real implementation, this would save to a user_profiles table or cache
    console.log('User profile cached:', {
      userId: userProfile.userId,
      lastUpdated: userProfile.lastUpdated,
      skillLevel: userProfile.skillLevel,
      interestCount: userProfile.interests.length,
    });
  } catch (error) {
    console.error('Error caching user profile:', error);
  }
}

/**
 * Get user's recent activity
 */
async function getRecentActivity(userId: string): Promise<any[]> {
  try {
    const recentActivity = await db
      .select({
        termId: userInteractions.termId,
        termName: terms.name,
        interactionType: userInteractions.interactionType,
        timestamp: userInteractions.timestamp,
      })
      .from(userInteractions)
      .leftJoin(terms, eq(userInteractions.termId, terms.id))
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.timestamp))
      .limit(5);

    return recentActivity;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

/**
 * Get continue learning data
 */
async function getContinueLearning(userId: string): Promise<any[]> {
  try {
    const continueLearning = await db
      .select({
        pathId: userLearningProgress.learning_path_id,
        pathName: learningPaths.name,
        completionPercentage: userLearningProgress.completion_percentage,
        lastAccessed: userLearningProgress.last_accessed_at,
      })
      .from(userLearningProgress)
      .leftJoin(learningPaths, eq(userLearningProgress.learning_path_id, learningPaths.id))
      .where(
        and(
          eq(userLearningProgress.user_id, userId),
          sql`${userLearningProgress.completion_percentage} < 100`
        )
      )
      .orderBy(desc(userLearningProgress.last_accessed_at))
      .limit(3);

    return continueLearning;
  } catch (error) {
    console.error('Error getting continue learning data:', error);
    return [];
  }
}
