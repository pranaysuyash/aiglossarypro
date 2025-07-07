/**
 * Cross-Reference and Term Linking Routes
 * Provides endpoints for managing automatic term links and references
 */

import type { Express, Request, Response } from 'express';
import { crossReferenceService } from '../services/crossReferenceService';
import { crossReferenceAnalyticsService } from '../services/crossReferenceAnalyticsService';
import { asyncHandler, handleDatabaseError } from '../middleware/errorHandler';
import { requireAdmin } from '../middleware/adminAuth';
import { mockRequireAdmin } from '../middleware/dev/mockAuth';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { features } from '../config';
import { BULK_LIMITS } from '../constants';
import { validateBody, validateParamsMiddleware, processTextSchema, bulkProcessSchema, termIdParamSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas for analytics endpoints
const analyticsTimeRangeSchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d']).optional()
});

const crossReferenceAnalyticsSchema = z.object({
  termIds: z.array(z.string()).optional()
});

const pathwaysQuerySchema = z.object({
  minFrequency: z.coerce.number().min(1).max(100).optional().default(5)
});

export function registerCrossReferenceRoutes(app: Express): void {
  // Choose admin middleware based on environment
  const adminMiddleware = mockRequireAdmin;

  /**
   * Process text for automatic term linking
   * POST /api/cross-reference/process
   */
  app.post('/api/cross-reference/process', adminMiddleware, validateBody(processTextSchema), asyncHandler(async (req: Request, res: Response) => {
    const { text, excludeTermId } = req.body;

    try {
      const result = await crossReferenceService.processTextForLinks(text, excludeTermId);

      res.json({
        success: true,
        data: result,
        message: `Added ${result.linksAdded} automatic links`
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to process text for links',
        errorId
      });
    }
  }));

  /**
   * Get cross-references for a specific term
   * GET /api/cross-reference/term/:termId
   */
  app.get('/api/cross-reference/term/:termId', adminMiddleware, validateParamsMiddleware(termIdParamSchema), asyncHandler(async (req: Request, res: Response) => {
    const { termId } = req.params;

    try {
      const crossReferences = await crossReferenceService.findCrossReferences(termId);

      res.json({
        success: true,
        data: {
          termId,
          crossReferences,
          total: crossReferences.length
        }
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to find cross-references',
        errorId
      });
    }
  }));

  /**
   * Update a term's definition with automatic links (admin only)
   * PUT /api/cross-reference/term/:termId/update-links
   */
  app.put('/api/cross-reference/term/:termId/update-links', requireAdmin, validateParamsMiddleware(termIdParamSchema), asyncHandler(async (req: Request, res: Response) => {
    const { termId } = req.params;

    try {
      const updated = await crossReferenceService.updateTermWithLinks(termId);

      if (updated) {
        res.json({
          success: true,
          message: 'Term definition updated with automatic links'
        });
      } else {
        res.json({
          success: true,
          message: 'No links were added (term may already have links or no references found)'
        });
      }

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to update term with links',
        errorId
      });
    }
  }));

  /**
   * Bulk process multiple terms (admin only)
   * POST /api/cross-reference/bulk-process
   */
  app.post('/api/cross-reference/bulk-process', requireAdmin, validateBody(bulkProcessSchema), asyncHandler(async (req: Request, res: Response) => {
    const { termIds } = req.body;

    try {
      const results = await crossReferenceService.bulkProcessTerms(termIds);
      
      const summary = {
        totalProcessed: results.size,
        totalLinksAdded: Array.from(results.values()).reduce((sum, result) => sum + result.linksAdded, 0),
        termsWithLinks: Array.from(results.values()).filter(result => result.linksAdded > 0).length
      };

      res.json({
        success: true,
        data: {
          summary,
          results: Object.fromEntries(results)
        },
        message: `Processed ${summary.totalProcessed} terms, added ${summary.totalLinksAdded} links`
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk process terms',
        errorId
      });
    }
  }));

  /**
   * Initialize term cache (admin only)
   * POST /api/cross-reference/initialize-cache
   */
  app.post('/api/cross-reference/initialize-cache', requireAdmin, asyncHandler(async (req: Request, res: Response) => {

    try {
      await crossReferenceService.initializeTermCache();

      res.json({
        success: true,
        message: 'Term cache initialized successfully'
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize term cache',
        errorId
      });
    }
  }));

  /**
   * @openapi
   * /api/cross-reference/analytics/metrics:
   *   get:
   *     tags:
   *       - Cross-Reference Analytics
   *     summary: Get cross-reference metrics
   *     description: Analyzes cross-reference patterns and provides metrics for term relationships
   *     parameters:
   *       - in: query
   *         name: termIds
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Optional array of term IDs to analyze
   *     responses:
   *       200:
   *         description: Cross-reference metrics retrieved successfully
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
   *                       incomingReferences:
   *                         type: number
   *                       outgoingReferences:
   *                         type: number
   *                       referenceScore:
   *                         type: number
   *                       hubScore:
   *                         type: number
   *                       bridgeScore:
   *                         type: number
   *       500:
   *         description: Internal server error
   */
  app.get('/api/cross-reference/analytics/metrics', multiAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedQuery = crossReferenceAnalyticsSchema.parse(req.query);
      const metrics = await crossReferenceAnalyticsService.analyzeCrossReferences(validatedQuery.termIds);

      res.json({
        success: true,
        data: metrics,
        message: `Analyzed ${metrics.length} terms for cross-reference patterns`
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors
        });
      }

      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze cross-reference metrics',
        errorId
      });
    }
  }));

  /**
   * @openapi
   * /api/cross-reference/analytics/flows:
   *   get:
   *     tags:
   *       - Cross-Reference Analytics
   *     summary: Get reference flow patterns
   *     description: Analyzes how users navigate between related terms
   *     parameters:
   *       - in: query
   *         name: timeRange
   *         schema:
   *           type: string
   *           enum: [7d, 30d, 90d]
   *           default: 30d
   *         description: Time range for flow analysis
   *     responses:
   *       200:
   *         description: Reference flows retrieved successfully
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
   *                       sourceTermId:
   *                         type: string
   *                       sourceTermName:
   *                         type: string
   *                       targetTermId:
   *                         type: string
   *                       targetTermName:
   *                         type: string
   *                       flowCount:
   *                         type: number
   *                       averageTimeGap:
   *                         type: number
   *                       categoryBridge:
   *                         type: boolean
   *       500:
   *         description: Internal server error
   */
  app.get('/api/cross-reference/analytics/flows', multiAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedQuery = analyticsTimeRangeSchema.parse(req.query);
      const flows = await crossReferenceAnalyticsService.analyzeReferenceFlows(validatedQuery.timeRange);

      res.json({
        success: true,
        data: flows,
        message: `Found ${flows.length} reference flow patterns`
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors
        });
      }

      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze reference flows',
        errorId
      });
    }
  }));

  /**
   * @openapi
   * /api/cross-reference/analytics/pathways:
   *   get:
   *     tags:
   *       - Cross-Reference Analytics
   *     summary: Get learning pathways
   *     description: Discovers common learning pathways from user navigation patterns
   *     parameters:
   *       - in: query
   *         name: minFrequency
   *         schema:
   *           type: number
   *           minimum: 1
   *           default: 5
   *         description: Minimum frequency for pathway inclusion
   *     responses:
   *       200:
   *         description: Learning pathways retrieved successfully
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
   *                       pathwayId:
   *                         type: string
   *                       termSequence:
   *                         type: array
   *                         items:
   *                           type: string
   *                       termNames:
   *                         type: array
   *                         items:
   *                           type: string
   *                       frequency:
   *                         type: number
   *                       averageCompletionTime:
   *                         type: number
   *                       pathwayType:
   *                         type: string
   *                         enum: [linear, branching, circular, hub-and-spoke]
   *       500:
   *         description: Internal server error
   */
  app.get('/api/cross-reference/analytics/pathways', multiAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedQuery = pathwaysQuerySchema.parse(req.query);
      const pathways = await crossReferenceAnalyticsService.discoverLearningPathways(validatedQuery.minFrequency);

      res.json({
        success: true,
        data: pathways,
        message: `Discovered ${pathways.length} learning pathways`
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors
        });
      }

      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to discover learning pathways',
        errorId
      });
    }
  }));

  /**
   * @openapi
   * /api/cross-reference/analytics/insights:
   *   get:
   *     tags:
   *       - Cross-Reference Analytics
   *     summary: Get comprehensive cross-reference insights
   *     description: Provides comprehensive analytics dashboard for cross-reference patterns
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cross-reference insights retrieved successfully
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
   *                     totalCrossReferences:
   *                       type: number
   *                     averageReferenceScore:
   *                       type: number
   *                     topHubTerms:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/CrossReferenceMetrics'
   *                     topBridgeTerms:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/CrossReferenceMetrics'
   *                     popularLearningPathways:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/LearningPathway'
   *                     navigationPatterns:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/NavigationPattern'
   *       401:
   *         description: User not authenticated
   *       500:
   *         description: Internal server error
   */
  app.get('/api/cross-reference/analytics/insights', multiAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      const insights = await crossReferenceAnalyticsService.getCrossReferenceInsights();

      res.json({
        success: true,
        data: insights,
        message: 'Cross-reference insights retrieved successfully'
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to get cross-reference insights',
        errorId
      });
    }
  }));
}