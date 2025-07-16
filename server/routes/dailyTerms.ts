/**
 * Daily Terms API Routes
 *
 * Provides endpoints for accessing today's featured terms and rotation management
 */

import { format, isValid, parseISO } from 'date-fns';
import type { Express, Request, Response } from 'express';
import type { ApiResponse } from '../../shared/types';
import { DailyTermRotationService } from '../services/dailyTermRotation';
import { log as logger } from '../utils/logger';

const dailyTermsService = new DailyTermRotationService();

export function registerDailyTermsRoutes(app: Express): void {
  /**
   * @openapi
   * /api/daily-terms:
   *   get:
   *     tags:
   *       - Daily Terms
   *     summary: Get today's featured terms
   *     description: Retrieve the intelligently selected 50 terms for today based on quality, popularity, and learning optimization
   *     parameters:
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *           format: date
   *         description: Specific date to get terms for (YYYY-MM-DD). Defaults to today.
   *       - in: query
   *         name: refresh
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Force refresh of term selection (ignores cache)
   *     responses:
   *       200:
   *         description: Successfully retrieved daily terms
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
   *                     date:
   *                       type: string
   *                       format: date
   *                       example: "2025-07-15"
   *                     terms:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Term'
   *                     metadata:
   *                       type: object
   *                       properties:
   *                         algorithm_version:
   *                           type: string
   *                           example: "2.0"
   *                         selection_criteria:
   *                           type: object
   *                           description: Criteria used for term selection
   *                         distribution:
   *                           type: object
   *                           description: Analysis of selected terms distribution
   *                         generated_at:
   *                           type: string
   *                           format: date-time
   *       400:
   *         description: Invalid date format
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
  app.get('/api/daily-terms', async (req: Request, res: Response) => {
    try {
      const { date: dateParam, refresh } = req.query;

      let targetDate = new Date();

      // Parse date parameter if provided
      if (dateParam && typeof dateParam === 'string') {
        const parsedDate = parseISO(dateParam);
        if (!isValid(parsedDate)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid date format. Please use YYYY-MM-DD format.',
          });
        }
        targetDate = parsedDate;
      }

      // Clear cache if refresh is requested
      if (refresh === 'true' || refresh === true) {
        await dailyTermsService.clearCache?.(format(targetDate, 'yyyy-MM-dd'));
      }

      const dailyTermsResponse = await dailyTermsService.getTodaysTerms(targetDate);

      // Set cache headers
      res.set({
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        ETag: `"daily-terms-${dailyTermsResponse.date}-${dailyTermsResponse.metadata.algorithm_version}"`,
        Vary: 'Accept-Encoding',
      });

      const response: ApiResponse<typeof dailyTermsResponse> = {
        success: true,
        data: dailyTermsResponse,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching daily terms', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch daily terms',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @openapi
   * /api/daily-terms/history:
   *   get:
   *     tags:
   *       - Daily Terms
   *     summary: Get historical daily terms
   *     description: Retrieve daily terms for past dates
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 30
   *           default: 7
   *         description: Number of past days to retrieve
   *       - in: query
   *         name: from_date
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for history range (YYYY-MM-DD)
   *       - in: query
   *         name: to_date
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for history range (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Successfully retrieved historical daily terms
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
   *                       date:
   *                         type: string
   *                         format: date
   *                       terms_count:
   *                         type: integer
   *                       terms:
   *                         type: array
   *                         items:
   *                           $ref: '#/components/schemas/Term'
   *                       metadata:
   *                         type: object
   *       400:
   *         description: Invalid parameters
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
  app.get('/api/daily-terms/history', async (req: Request, res: Response) => {
    try {
      const { days = 7, from_date, to_date } = req.query;

      let startDate: Date;
      let endDate: Date = new Date();

      if (from_date && to_date) {
        startDate = parseISO(from_date as string);
        endDate = parseISO(to_date as string);

        if (!isValid(startDate) || !isValid(endDate)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid date format. Please use YYYY-MM-DD format.',
          });
        }
      } else {
        const daysCount = Math.min(Math.max(parseInt(days as string) || 7, 1), 30);
        startDate = new Date();
        startDate.setDate(startDate.getDate() - daysCount);
      }

      const history = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        try {
          const dailyTerms = await dailyTermsService.getTodaysTerms(currentDate);
          history.push({
            date: dailyTerms.date,
            terms_count: dailyTerms.terms.length,
            terms: dailyTerms.terms,
            metadata: dailyTerms.metadata,
          });
        } catch (error) {
          logger.warn('Failed to get daily terms for date', {
            date: format(currentDate, 'yyyy-MM-dd'),
            error: error instanceof Error ? error.message : String(error),
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const response: ApiResponse<typeof history> = {
        success: true,
        data: history.reverse(), // Most recent first
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching daily terms history', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch daily terms history',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @openapi
   * /api/daily-terms/stats:
   *   get:
   *     tags:
   *       - Daily Terms
   *     summary: Get daily terms statistics
   *     description: Retrieve statistics about the daily terms selection algorithm performance
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 90
   *           default: 30
   *         description: Number of days to analyze
   *     responses:
   *       200:
   *         description: Successfully retrieved statistics
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
   *                     algorithm_performance:
   *                       type: object
   *                       description: Performance metrics of the selection algorithm
   *                     term_distribution:
   *                       type: object
   *                       description: Distribution analysis across categories and difficulties
   *                     engagement_metrics:
   *                       type: object
   *                       description: User engagement with daily terms
   *                     quality_metrics:
   *                       type: object
   *                       description: Quality assessment of selected terms
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/daily-terms/stats', async (req: Request, res: Response) => {
    try {
      const period = Math.min(Math.max(parseInt(req.query.period as string) || 30, 1), 90);

      const stats = await dailyTermsService.getSelectionMetrics(period);

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching daily terms stats', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch daily terms statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @openapi
   * /api/daily-terms/preview:
   *   get:
   *     tags:
   *       - Daily Terms
   *     summary: Preview tomorrow's terms
   *     description: Get a preview of tomorrow's term selection (admin feature)
   *     parameters:
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *           format: date
   *         description: Date to preview (defaults to tomorrow)
   *     responses:
   *       200:
   *         description: Successfully retrieved preview
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
   *                     preview_date:
   *                       type: string
   *                       format: date
   *                     terms:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           name:
   *                             type: string
   *                           category:
   *                             type: string
   *                           difficulty:
   *                             type: string
   *                           score:
   *                             type: number
   *                     distribution_analysis:
   *                       type: object
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/daily-terms/preview', async (req: Request, res: Response) => {
    try {
      const { date: dateParam } = req.query;

      let previewDate = new Date();
      previewDate.setDate(previewDate.getDate() + 1); // Tomorrow by default

      if (dateParam && typeof dateParam === 'string') {
        const parsedDate = parseISO(dateParam);
        if (isValid(parsedDate)) {
          previewDate = parsedDate;
        }
      }

      // Generate preview (same as regular generation but marked as preview)
      const preview = await dailyTermsService.getTodaysTerms(previewDate);

      // Simplify response for preview
      const previewData = {
        preview_date: preview.date,
        terms: preview.terms.map(term => ({
          id: term.id,
          name: term.name,
          category: term.category,
          difficulty: (term as any).difficultyLevel || 'intermediate',
          has_code: (term as any).hasCodeExamples || false,
          has_interactive: (term as any).hasInteractiveElements || false,
        })),
        distribution_analysis: preview.metadata.distribution,
        algorithm_version: preview.metadata.algorithm_version,
      };

      const response: ApiResponse<typeof previewData> = {
        success: true,
        data: previewData,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error generating daily terms preview', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @openapi
   * /api/daily-terms/config:
   *   get:
   *     tags:
   *       - Daily Terms
   *     summary: Get current algorithm configuration
   *     description: Retrieve the current configuration of the daily terms selection algorithm
   *     responses:
   *       200:
   *         description: Successfully retrieved configuration
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
   *                     totalTerms:
   *                       type: integer
   *                       example: 50
   *                     difficultyDistribution:
   *                       type: object
   *                       properties:
   *                         beginner:
   *                           type: number
   *                           example: 0.3
   *                         intermediate:
   *                           type: number
   *                           example: 0.4
   *                         advanced:
   *                           type: number
   *                           example: 0.25
   *                         expert:
   *                           type: number
   *                           example: 0.05
   *                     categoryBalance:
   *                       type: boolean
   *                       example: true
   *                     freshnessFactor:
   *                       type: number
   *                       example: 0.2
   *                     popularityWeight:
   *                       type: number
   *                       example: 0.3
   *                     qualityThreshold:
   *                       type: number
   *                       example: 60
   *   put:
   *     tags:
   *       - Daily Terms
   *     summary: Update algorithm configuration
   *     description: Update the configuration of the daily terms selection algorithm (admin only)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               totalTerms:
   *                 type: integer
   *                 minimum: 10
   *                 maximum: 100
   *               difficultyDistribution:
   *                 type: object
   *                 properties:
   *                   beginner:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 1
   *                   intermediate:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 1
   *                   advanced:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 1
   *                   expert:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 1
   *               categoryBalance:
   *                 type: boolean
   *               freshnessFactor:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *               popularityWeight:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *               qualityThreshold:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 100
   *     responses:
   *       200:
   *         description: Configuration updated successfully
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
   *                   example: "Configuration updated successfully"
   *       400:
   *         description: Invalid configuration parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/daily-terms/config', async (req: Request, res: Response) => {
    try {
      // Get current configuration (this would typically be stored in database)
      const config = {
        totalTerms: 50,
        difficultyDistribution: {
          beginner: 0.3,
          intermediate: 0.4,
          advanced: 0.25,
          expert: 0.05,
        },
        categoryBalance: true,
        freshnessFactor: 0.2,
        popularityWeight: 0.3,
        qualityThreshold: 60,
      };

      const response: ApiResponse<typeof config> = {
        success: true,
        data: config,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching daily terms config', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch configuration',
      });
    }
  });

  app.put('/api/daily-terms/config', async (req: Request, res: Response) => {
    try {
      const newConfig = req.body;

      // Validate configuration
      if (newConfig.totalTerms && (newConfig.totalTerms < 10 || newConfig.totalTerms > 100)) {
        return res.status(400).json({
          success: false,
          error: 'totalTerms must be between 10 and 100',
        });
      }

      // Validate difficulty distribution sums to 1
      if (newConfig.difficultyDistribution) {
        const sum = Object.values(newConfig.difficultyDistribution).reduce(
          (a: any, b: any) => a + b,
          0
        );
        if (Math.abs(sum - 1) > 0.01) {
          return res.status(400).json({
            success: false,
            error: 'Difficulty distribution percentages must sum to 1.0',
          });
        }
      }

      // Update configuration
      dailyTermsService.updateConfig(newConfig);

      logger.info('Daily terms configuration updated', { newConfig });

      res.json({
        success: true,
        message: 'Configuration updated successfully',
      });
    } catch (error) {
      logger.error('Error updating daily terms config', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
      });
    }
  });
}
