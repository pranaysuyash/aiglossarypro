/**
 * Predictive Analytics Routes
 * API endpoints for learning outcome predictions and insights
 */

import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { predictiveAnalyticsService } from '../services/predictiveAnalyticsService';

const router = express.Router();

// Validation schemas
const userIdSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const predictiveAnalyticsQuerySchema = z.object({
  includeInsights: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  includeRecommendations: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  includeMilestones: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  timeframe: z.enum(['7d', '30d', '90d']).optional().default('30d'),
});

/**
 * @openapi
 * /api/predictive-analytics/outcomes/{userId}:
 *   get:
 *     tags:
 *       - Predictive Analytics
 *     summary: Get learning outcome predictions
 *     description: Generate comprehensive predictions for user learning outcomes including completion rates, time estimates, and success probability
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to analyze
 *       - in: query
 *         name: includeInsights
 *         schema:
 *           type: boolean
 *         description: Include predictive insights with risk and opportunity analysis
 *       - in: query
 *         name: includeRecommendations
 *         schema:
 *           type: boolean
 *         description: Include personalized recommendations
 *       - in: query
 *         name: includeMilestones
 *         schema:
 *           type: boolean
 *         description: Include predicted progress milestones
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *         description: Analysis timeframe
 *     responses:
 *       200:
 *         description: Learning outcome predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     predictedCompletionRate:
 *                       type: number
 *                       description: Predicted completion rate (0-1)
 *                     estimatedLearningTime:
 *                       type: number
 *                       description: Estimated learning time in minutes
 *                     difficultyAlignment:
 *                       type: number
 *                       description: How well difficulty matches user level (0-1)
 *                     engagementScore:
 *                       type: number
 *                       description: Overall engagement score (0-1)
 *                     retentionProbability:
 *                       type: number
 *                       description: Probability of continued learning (0-1)
 *                     recommendedLearningPath:
 *                       type: string
 *                       nullable: true
 *                       description: Recommended learning path
 *                     strengthAreas:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Areas of strength
 *                     improvementAreas:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Areas needing improvement
 *                     nextBestActions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Recommended next actions
 *                     confidenceScore:
 *                       type: number
 *                       description: Confidence in predictions (0-1)
 *                     insights:
 *                       type: object
 *                       description: Detailed insights (if requested)
 *                     recommendations:
 *                       type: array
 *                       description: Personalized recommendations (if requested)
 *                     milestones:
 *                       type: array
 *                       description: Progress milestones (if requested)
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/outcomes/:userId',
  multiAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId } = userIdSchema.parse(req.params);
      const options = predictiveAnalyticsQuerySchema.parse(req.query);

      // Get learning outcome predictions
      const outcomes = await predictiveAnalyticsService.predictLearningOutcomes(userId);

      const response: any = {
        success: true,
        data: outcomes,
      };

      // Add optional data based on query parameters
      if (options.includeInsights) {
        const insights = await predictiveAnalyticsService.generatePredictiveInsights(userId);
        response.data.insights = insights;
      }

      if (options.includeRecommendations) {
        const profile = await predictiveAnalyticsService.generateLearningProfile(userId);
        response.data.profile = profile;
      }

      res.json(response);
    } catch (error) {
      console.error('Error predicting learning outcomes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to predict learning outcomes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * @openapi
 * /api/predictive-analytics/profile/{userId}:
 *   get:
 *     tags:
 *       - Predictive Analytics
 *     summary: Get user learning profile
 *     description: Generate detailed learning profile including patterns, preferences, and behavioral insights
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to analyze
 *     responses:
 *       200:
 *         description: User learning profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     sessionPatterns:
 *                       type: object
 *                       properties:
 *                         averageSessionLength:
 *                           type: number
 *                         sessionsPerWeek:
 *                           type: number
 *                         preferredTimeSlots:
 *                           type: array
 *                           items:
 *                             type: string
 *                         consistencyScore:
 *                           type: number
 *                         completionRate:
 *                           type: number
 *                     comprehensionRate:
 *                       type: number
 *                     preferredDifficulty:
 *                       type: string
 *                       enum: [beginner, intermediate, advanced]
 *                     learningVelocity:
 *                       type: number
 *                     focusAreas:
 *                       type: array
 *                       items:
 *                         type: string
 *                     timeOfDayPreference:
 *                       type: string
 *                     sessionDurationPreference:
 *                       type: number
 *                     conceptualStrengths:
 *                       type: array
 *                       items:
 *                         type: string
 *                     lastActivityDate:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/profile/:userId',
  multiAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId } = userIdSchema.parse(req.params);

      const profile = await predictiveAnalyticsService.generateLearningProfile(userId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('Error generating learning profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate learning profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * @openapi
 * /api/predictive-analytics/insights/{userId}:
 *   get:
 *     tags:
 *       - Predictive Analytics
 *     summary: Get predictive insights
 *     description: Generate risk analysis, opportunity identification, and personalized recommendations
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to analyze
 *     responses:
 *       200:
 *         description: Predictive insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     riskFactors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           factor:
 *                             type: string
 *                           severity:
 *                             type: string
 *                             enum: [low, medium, high]
 *                           description:
 *                             type: string
 *                           mitigation:
 *                             type: string
 *                     opportunityFactors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           factor:
 *                             type: string
 *                           potential:
 *                             type: string
 *                             enum: [low, medium, high]
 *                           description:
 *                             type: string
 *                           action:
 *                             type: string
 *                     personalizedRecommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [content, pacing, method, timing]
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           expectedImprovement:
 *                             type: string
 *                           priority:
 *                             type: string
 *                             enum: [low, medium, high]
 *                     progressMilestones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           milestone:
 *                             type: string
 *                           targetDate:
 *                             type: string
 *                             format: date-time
 *                           probability:
 *                             type: number
 *                           requirements:
 *                             type: array
 *                             items:
 *                               type: string
 *                     learningEfficiencyScore:
 *                       type: number
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/insights/:userId',
  multiAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId } = userIdSchema.parse(req.params);

      const insights = await predictiveAnalyticsService.generatePredictiveInsights(userId);

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate predictive insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * @openapi
 * /api/predictive-analytics/recommendations/{userId}:
 *   get:
 *     tags:
 *       - Predictive Analytics
 *     summary: Get personalized recommendations
 *     description: Generate AI-powered recommendations for improving learning outcomes
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to analyze
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [content, pacing, method, timing]
 *         description: Filter recommendations by type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter recommendations by priority
 *     responses:
 *       200:
 *         description: Personalized recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [content, pacing, method, timing]
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       expectedImprovement:
 *                         type: string
 *                       priority:
 *                         type: string
 *                         enum: [low, medium, high]
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/recommendations/:userId',
  multiAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId } = userIdSchema.parse(req.params);
      const { type, priority } = req.query;

      const insights = await predictiveAnalyticsService.generatePredictiveInsights(userId);
      let recommendations = insights.personalizedRecommendations;

      // Apply filters
      if (type) {
        recommendations = recommendations.filter((rec) => rec.type === type);
      }

      if (priority) {
        recommendations = recommendations.filter((rec) => rec.priority === priority);
      }

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * @openapi
 * /api/predictive-analytics/milestones/{userId}:
 *   get:
 *     tags:
 *       - Predictive Analytics
 *     summary: Get progress milestones
 *     description: Predict learning milestones and achievement timelines
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to analyze
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 180d]
 *         description: Milestone prediction timeframe
 *     responses:
 *       200:
 *         description: Progress milestones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       milestone:
 *                         type: string
 *                       targetDate:
 *                         type: string
 *                         format: date-time
 *                       probability:
 *                         type: number
 *                       requirements:
 *                         type: array
 *                         items:
 *                           type: string
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/milestones/:userId',
  multiAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId } = userIdSchema.parse(req.params);

      const insights = await predictiveAnalyticsService.generatePredictiveInsights(userId);

      res.json({
        success: true,
        data: insights.progressMilestones,
      });
    } catch (error) {
      console.error('Error generating milestones:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate milestones',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * @openapi
 * /api/predictive-analytics/batch-analysis:
 *   post:
 *     tags:
 *       - Predictive Analytics
 *     summary: Batch analyze multiple users
 *     description: Generate analytics for multiple users simultaneously
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user IDs to analyze
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [outcomes, profile, insights, recommendations]
 *                 description: Which metrics to include
 *             required:
 *               - userIds
 *     responses:
 *       200:
 *         description: Batch analysis results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     description: Analysis results keyed by user ID
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/batch-analysis',
  multiAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userIds, metrics = ['outcomes'] } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'User IDs array is required',
        });
      }

      if (userIds.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 50 users allowed per batch',
        });
      }

      const results: Record<string, any> = {};

      // Process users in parallel (with concurrency limit)
      const concurrency = 5;
      for (let i = 0; i < userIds.length; i += concurrency) {
        const batch = userIds.slice(i, i + concurrency);

        const batchPromises = batch.map(async (userId: string) => {
          const userResults: any = { userId };

          try {
            if (metrics.includes('outcomes')) {
              userResults.outcomes =
                await predictiveAnalyticsService.predictLearningOutcomes(userId);
            }

            if (metrics.includes('profile')) {
              userResults.profile =
                await predictiveAnalyticsService.generateLearningProfile(userId);
            }

            if (metrics.includes('insights')) {
              userResults.insights =
                await predictiveAnalyticsService.generatePredictiveInsights(userId);
            }

            return { userId, data: userResults };
          } catch (error) {
            console.error(`Error analyzing user ${userId}:`, error);
            return {
              userId,
              error: error instanceof Error ? error.message : 'Analysis failed',
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((result) => {
          results[result.userId] = result.data || { error: result.error };
        });
      }

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Error in batch analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform batch analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

export default router;
