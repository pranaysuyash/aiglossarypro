/**
 * Adaptive Content Organization API Routes
 * Provides endpoints for AI-powered content organization based on learning patterns
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { adaptiveContentService } from '../services/adaptiveContentService';
import { ErrorCode, handleDatabaseError, sendErrorResponse } from '../utils/errorHandler';

import logger from '../utils/logger';
// Validation schemas
const adaptiveRecommendationsSchema = z.object({
  count: z.coerce.number().min(1).max(50).optional().default(10),
});

const adaptiveFeedbackSchema = z.object({
  difficultyAdjustment: z.number().min(-1).max(1).optional(),
  paceAdjustment: z.number().min(-1).max(1).optional(),
  contentTypePreference: z.string().optional(),
  feedbackType: z.enum(['too_easy', 'too_hard', 'just_right', 'preference_change']),
});

export function registerAdaptiveContentRoutes(app: Express): void {
  /**
   * @openapi
   * /api/adaptive/learning-patterns:
   *   get:
   *     tags:
   *       - Adaptive Content
   *     summary: Get user learning patterns
   *     description: Analyze and retrieve the user's learning patterns and preferences
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Learning patterns retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     userId:
   *                       type: string
   *                     preferredDifficulty:
   *                       type: string
   *                       enum: [beginner, intermediate, advanced]
   *                     learningStyle:
   *                       type: string
   *                       enum: [sequential, exploratory, project-based, reference]
   *                     sessionLength:
   *                       type: string
   *                       enum: [short, medium, long]
   *                     contentPreferences:
   *                       type: object
   *                       properties:
   *                         conceptual:
   *                           type: number
   *                         practical:
   *                           type: number
   *                         visual:
   *                           type: number
   *                         depth:
   *                           type: number
   *                     categoryAffinities:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           categoryId:
   *                             type: string
   *                           categoryName:
   *                             type: string
   *                           affinityScore:
   *                             type: number
   *                           masteryLevel:
   *                             type: number
   *       401:
   *         description: User not authenticated
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/api/adaptive/learning-patterns',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.id;
        if (!userId) {
          return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'User not authenticated');
        }

        const patterns = await adaptiveContentService.analyzeLearningPatterns(userId);

        res.json({
          success: true,
          data: patterns,
        });
      } catch (error) {
        logger.error('Get learning patterns error:', error);
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );

  /**
   * @openapi
   * /api/adaptive/recommendations:
   *   get:
   *     tags:
   *       - Adaptive Content
   *     summary: Get adaptive content recommendations
   *     description: Generate personalized content recommendations based on user learning patterns
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: count
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Number of recommendations to return
   *     responses:
   *       200:
   *         description: Recommendations generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       termId:
   *                         type: string
   *                       termName:
   *                         type: string
   *                       categoryName:
   *                         type: string
   *                       recommendationScore:
   *                         type: number
   *                       recommendationType:
   *                         type: string
   *                         enum: [next_logical, fill_gap, explore_new, review_weak]
   *                       reasoning:
   *                         type: string
   *                       estimatedDifficulty:
   *                         type: number
   *                       estimatedEngagement:
   *                         type: number
   *                       adaptations:
   *                         type: object
   *                         properties:
   *                           contentFormat:
   *                             type: string
   *                             enum: [overview, detailed, example-focused, visual]
   *                           presentationStyle:
   *                             type: string
   *                             enum: [linear, modular, interactive]
   *                           supportLevel:
   *                             type: string
   *                             enum: [minimal, guided, intensive]
   *       401:
   *         description: User not authenticated
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/api/adaptive/recommendations',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.id;
        if (!userId) {
          return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'User not authenticated');
        }

        const validatedQuery = adaptiveRecommendationsSchema.parse(req.query);
        const recommendations = await adaptiveContentService.generateAdaptiveRecommendations(
          userId,
          validatedQuery.count
        );

        res.json({
          success: true,
          data: recommendations,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendErrorResponse(
            res,
            ErrorCode.VALIDATION_ERROR,
            'Invalid query parameters',
            error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          );
        }

        logger.error('Get adaptive recommendations error:', error);
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );

  /**
   * @openapi
   * /api/adaptive/content-organization:
   *   get:
   *     tags:
   *       - Adaptive Content
   *     summary: Get adaptive content organization
   *     description: Retrieve dynamically organized content sections based on user learning patterns
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Content organization retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     userId:
   *                       type: string
   *                     organizationType:
   *                       type: string
   *                       enum: [difficulty-based, category-clustered, pathway-optimized, interest-driven]
   *                     sections:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           sectionId:
   *                             type: string
   *                           title:
   *                             type: string
   *                           description:
   *                             type: string
   *                           priority:
   *                             type: number
   *                           estimatedTime:
   *                             type: number
   *                           terms:
   *                             type: array
   *                             items:
   *                               $ref: '#/components/schemas/AdaptiveRecommendation'
   *                           prerequisites:
   *                             type: array
   *                             items:
   *                               type: string
   *                           learningObjectives:
   *                             type: array
   *                             items:
   *                               type: string
   *                     adaptiveFeatures:
   *                       type: object
   *                       properties:
   *                         dynamicDifficulty:
   *                           type: boolean
   *                         contextualHints:
   *                           type: boolean
   *                         progressiveDisclosure:
   *                           type: boolean
   *                         personalizedExamples:
   *                           type: boolean
   *       401:
   *         description: User not authenticated
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/api/adaptive/content-organization',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.id;
        if (!userId) {
          return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'User not authenticated');
        }

        const organization = await adaptiveContentService.organizeContentAdaptively(userId);

        res.json({
          success: true,
          data: organization,
        });
      } catch (error) {
        logger.error('Get content organization error:', error);
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );

  /**
   * @openapi
   * /api/adaptive/learning-insights:
   *   get:
   *     tags:
   *       - Adaptive Content
   *     summary: Get learning insights
   *     description: Retrieve comprehensive learning insights and progress analytics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Learning insights retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     userId:
   *                       type: string
   *                     overallProgress:
   *                       type: number
   *                       description: Progress from 0 to 1
   *                     strengthAreas:
   *                       type: array
   *                       items:
   *                         type: string
   *                       description: Areas where user shows strength
   *                     improvementAreas:
   *                       type: array
   *                       items:
   *                         type: string
   *                       description: Areas that need improvement
   *                     recommendedNextSteps:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/AdaptiveRecommendation'
   *                     learningVelocity:
   *                       type: number
   *                       description: Terms mastered per week
   *                     retentionRate:
   *                       type: number
   *                       description: Knowledge retention rate
   *                     engagementTrends:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           date:
   *                             type: string
   *                           engagementScore:
   *                             type: number
   *                           focusAreas:
   *                             type: array
   *                             items:
   *                               type: string
   *                     adaptiveAdjustments:
   *                       type: object
   *                       properties:
   *                         difficultyLevel:
   *                           type: number
   *                         contentPacing:
   *                           type: number
   *                         supportLevel:
   *                           type: number
   *       401:
   *         description: User not authenticated
   *       500:
   *         description: Internal server error
   */
  app.get(
    '/api/adaptive/learning-insights',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.id;
        if (!userId) {
          return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'User not authenticated');
        }

        const insights = await adaptiveContentService.getLearningInsights(userId);

        res.json({
          success: true,
          data: insights,
        });
      } catch (error) {
        logger.error('Get learning insights error:', error);
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );

  /**
   * @openapi
   * /api/adaptive/feedback:
   *   post:
   *     tags:
   *       - Adaptive Content
   *     summary: Submit adaptive learning feedback
   *     description: Provide feedback to improve adaptive content recommendations
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - feedbackType
   *             properties:
   *               difficultyAdjustment:
   *                 type: number
   *                 minimum: -1
   *                 maximum: 1
   *                 description: Difficulty adjustment (-1 = easier, 1 = harder)
   *               paceAdjustment:
   *                 type: number
   *                 minimum: -1
   *                 maximum: 1
   *                 description: Pace adjustment (-1 = slower, 1 = faster)
   *               contentTypePreference:
   *                 type: string
   *                 description: Preferred content type
   *               feedbackType:
   *                 type: string
   *                 enum: [too_easy, too_hard, just_right, preference_change]
   *                 description: Type of feedback being provided
   *     responses:
   *       200:
   *         description: Feedback processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Feedback processed successfully"
   *       400:
   *         description: Invalid feedback data
   *       401:
   *         description: User not authenticated
   *       500:
   *         description: Internal server error
   */
  app.post('/api/adaptive/feedback', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'User not authenticated');
      }

      const validatedData = adaptiveFeedbackSchema.parse(req.body);

      await adaptiveContentService.updateAdaptiveSettings(userId, validatedData);

      res.json({
        success: true,
        message: 'Feedback processed successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendErrorResponse(
          res,
          ErrorCode.VALIDATION_ERROR,
          'Invalid feedback data',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }

      logger.error('Process adaptive feedback error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });
}
