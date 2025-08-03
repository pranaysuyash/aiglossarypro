/**
 * Engagement Tracking API Routes
 * Advanced analytics endpoints for measuring user engagement depth
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/adminAuth';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { validate } from '../middleware/validationMiddleware';
import { engagementTrackingService } from '../services/engagementTrackingService';
import { ErrorCode, handleDatabaseError, sendErrorResponse } from '../utils/errorHandler';

import logger from '../utils/logger';
// Validation schemas
const trackInteractionSchema = z.object({
  sessionId: z.string().min(1),
  termId: z.string().optional(),
  interactionType: z.enum([
    'view',
    'search',
    'favorite',
    'share',
    'reading_progress',
    'scroll',
    'click',
    'copy',
    'download',
    'bookmark',
  ]),
  duration: z.number().optional(),
  metadata: z.record(z.any()).optional(),
  deviceInfo: z
    .object({
      type: z.enum(['mobile', 'tablet', 'desktop']),
      userAgent: z.string(),
      screenResolution: z.string(),
    })
    .optional(),
  contentInfo: z
    .object({
      scrollDepth: z.number().min(0).max(100),
      readingProgress: z.number().min(0).max(100),
      timeOnContent: z.number().min(0),
      wordsRead: z.number().min(0),
    })
    .optional(),
});

const trackReadingProgressSchema = z.object({
  sessionId: z.string().min(1),
  termId: z.string().min(1),
  scrollPosition: z.number().min(0),
  totalHeight: z.number().min(1),
  timeSpent: z.number().min(0),
  wordsRead: z.number().min(0),
  readingVelocity: z.number().min(0),
});

const engagementInsightsSchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d']).optional(),
});

export function registerEngagementRoutes(app: Express): void {
  /**
   * @openapi
   * /api/engagement/track:
   *   post:
   *     tags:
   *       - Engagement Analytics
   *     summary: Track user interaction
   *     description: Records detailed user interactions for engagement analysis beyond simple page views
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - sessionId
   *               - interactionType
   *             properties:
   *               sessionId:
   *                 type: string
   *                 description: Unique session identifier
   *               termId:
   *                 type: string
   *                 description: ID of the term being interacted with
   *               interactionType:
   *                 type: string
   *                 enum: [view, search, favorite, share, reading_progress, scroll, click, copy, download, bookmark]
   *               duration:
   *                 type: number
   *                 description: Time spent on interaction in seconds
   *               deviceInfo:
   *                 type: object
   *                 properties:
   *                   type:
   *                     type: string
   *                     enum: [mobile, tablet, desktop]
   *                   userAgent:
   *                     type: string
   *                   screenResolution:
   *                     type: string
   *               contentInfo:
   *                 type: object
   *                 properties:
   *                   scrollDepth:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 100
   *                   readingProgress:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 100
   *                   timeOnContent:
   *                     type: number
   *                   wordsRead:
   *                     type: number
   *     responses:
   *       200:
   *         description: Interaction tracked successfully
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
   *                   example: "Interaction tracked successfully"
   *       400:
   *         description: Invalid request data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/api/engagement/track', 
    validate.body(trackInteractionSchema, { 
      sanitizeHtml: true,
      logErrors: true 
    }),
    async (req: Request, res: Response) => {
    try {
      const validatedData = req.body;

      // Get user ID if authenticated
      const userId = (req as any).user?.id;

      await engagementTrackingService.trackInteraction({
        ...validatedData,
        userId,
      });

      res.json({
        success: true,
        message: 'Interaction tracked successfully',
      });
    } catch (error) {
      logger.error('Track interaction error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * @openapi
   * /api/engagement/reading-progress:
   *   post:
   *     tags:
   *       - Engagement Analytics
   *     summary: Track reading progress
   *     description: Records detailed reading progress including scroll depth, time spent, and reading velocity
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - sessionId
   *               - termId
   *               - scrollPosition
   *               - totalHeight
   *               - timeSpent
   *               - wordsRead
   *               - readingVelocity
   *             properties:
   *               sessionId:
   *                 type: string
   *               termId:
   *                 type: string
   *               scrollPosition:
   *                 type: number
   *                 minimum: 0
   *               totalHeight:
   *                 type: number
   *                 minimum: 1
   *               timeSpent:
   *                 type: number
   *                 minimum: 0
   *               wordsRead:
   *                 type: number
   *                 minimum: 0
   *               readingVelocity:
   *                 type: number
   *                 minimum: 0
   *     responses:
   *       200:
   *         description: Reading progress tracked successfully
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
   *                   example: "Reading progress tracked successfully"
   *       400:
   *         description: Invalid request data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.post('/api/engagement/reading-progress', 
    validate.body(trackReadingProgressSchema, { 
      sanitizeHtml: true,
      logErrors: true 
    }),
    async (req: Request, res: Response) => {
    try {
      const validatedData = req.body;

      // Get user ID if authenticated
      const userId = (req as any).user?.id;

      await engagementTrackingService.trackReadingProgress({
        ...validatedData,
        userId,
      });

      res.json({
        success: true,
        message: 'Reading progress tracked successfully',
      });
    } catch (error) {
      logger.error('Track reading progress error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * @openapi
   * /api/engagement/session/{sessionId}:
   *   get:
   *     tags:
   *       - Engagement Analytics
   *     summary: Get session engagement metrics
   *     description: Retrieves comprehensive engagement metrics for a specific user session
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Session ID to analyze
   *     responses:
   *       200:
   *         description: Session engagement metrics retrieved successfully
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
   *                     sessionId:
   *                       type: string
   *                     userId:
   *                       type: string
   *                     totalDuration:
   *                       type: number
   *                     pageViews:
   *                       type: number
   *                     uniqueTermsViewed:
   *                       type: number
   *                     averageTimePerTerm:
   *                       type: number
   *                     scrollDepth:
   *                       type: number
   *                     engagementScore:
   *                       type: number
   *                     qualityScore:
   *                       type: number
   *                     bounceRate:
   *                       type: boolean
   *       404:
   *         description: Session not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/engagement/session/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      const sessionMetrics = await engagementTrackingService.calculateSessionEngagement(sessionId);

      if (!sessionMetrics) {
        return sendErrorResponse(res, ErrorCode.RESOURCE_NOT_FOUND, 'Session not found');
      }

      res.json({
        success: true,
        data: sessionMetrics,
      });
    } catch (error) {
      logger.error('Get session engagement error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * @openapi
   * /api/engagement/content:
   *   get:
   *     tags:
   *       - Engagement Analytics
   *     summary: Get content engagement metrics
   *     description: Retrieves engagement metrics for content, optionally filtered by term IDs
   *     parameters:
   *       - in: query
   *         name: termIds
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Optional array of term IDs to filter by
   *     responses:
   *       200:
   *         description: Content engagement metrics retrieved successfully
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
   *                       averageReadTime:
   *                         type: number
   *                       completionRate:
   *                         type: number
   *                       engagementRate:
   *                         type: number
   *                       shareRate:
   *                         type: number
   *                       favoriteRate:
   *                         type: number
   *                       userSatisfactionScore:
   *                         type: number
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/engagement/content', async (req: Request, res: Response) => {
    try {
      const { termIds } = req.query;

      const termIdsArray = Array.isArray(termIds)
        ? (termIds as string[])
        : typeof termIds === 'string'
          ? [termIds]
          : undefined;

      const contentMetrics = await engagementTrackingService.getContentEngagement(termIdsArray);

      res.json({
        success: true,
        data: contentMetrics,
      });
    } catch (error) {
      logger.error('Get content engagement error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * @openapi
   * /api/engagement/insights:
   *   get:
   *     tags:
   *       - Engagement Analytics
   *     summary: Get engagement insights dashboard
   *     description: Retrieves comprehensive engagement insights and analytics for admin dashboard
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: timeRange
   *         schema:
   *           type: string
   *           enum: [7d, 30d, 90d]
   *           default: 30d
   *         description: Time range for insights
   *     responses:
   *       200:
   *         description: Engagement insights retrieved successfully
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
   *                     totalEngagedUsers:
   *                       type: number
   *                     averageSessionDuration:
   *                       type: number
   *                     averageEngagementScore:
   *                       type: number
   *                     topEngagingContent:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/ContentEngagement'
   *                     userEngagementSegments:
   *                       type: object
   *                       properties:
   *                         highlyEngaged:
   *                           type: number
   *                         moderatelyEngaged:
   *                           type: number
   *                         lowEngaged:
   *                           type: number
   *                     engagementTrends:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           date:
   *                             type: string
   *                           avgEngagement:
   *                             type: number
   *                           totalSessions:
   *                             type: number
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get(
    '/api/engagement/insights',
    multiAuthMiddleware,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const validatedQuery = engagementInsightsSchema.parse(req.query);

        const insights = await engagementTrackingService.getEngagementInsights(
          validatedQuery.timeRange || '30d'
        );

        res.json({
          success: true,
          data: insights,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendErrorResponse(
            res,
            ErrorCode.VALIDATION_ERROR,
            'Invalid query parameters',
            JSON.stringify(error.errors)
          );
        }

        logger.error('Get engagement insights error:', error);
        const dbError = handleDatabaseError(error);
        sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
      }
    }
  );
}
