import type { Express, Request, Response } from 'express';
import type { ApiResponse, ITerm } from '../../shared/types';
import {
  getGuestAnalytics,
  getGuestSessionStats,
  guestAccessMiddleware,
  guestPreviewLimitMiddleware,
  recordGuestTermView,
} from '../middleware/guestAccess';
import { termIdSchema } from '../middleware/security';
import { optimizedStorage as storage } from '../optimizedStorage';
import { log as logger } from '../utils/logger';

/**
 * Guest preview routes for unauthenticated access
 */
export function registerGuestPreviewRoutes(app: Express): void {
  /**
   * @openapi
   * /api/terms/{id}/preview:
   *   get:
   *     tags:
   *       - Guest Preview
   *     summary: Get preview of a term for unauthenticated users
   *     description: Allows guests to preview up to 2 terms without authentication
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Term ID
   *     responses:
   *       200:
   *         description: Term preview retrieved successfully
   *       403:
   *         description: Preview limit reached
   *       404:
   *         description: Term not found
   */
  app.get(
    '/api/terms/:id/preview',
    guestAccessMiddleware,
    guestPreviewLimitMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        // Validate term ID format
        try {
          termIdSchema.parse(id);
        } catch (_error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid term ID format',
            guestPreview: true,
          });
        }

        const guestSession = (req as any).guestSession;
        const term = await storage.getTermById(id);

        if (!term) {
          return res.status(404).json({
            success: false,
            error: 'Term not found',
            guestPreview: true,
          });
        }

        // Record the guest view if they haven't seen this term before
        const viewRecorded = recordGuestTermView(guestSession, id);

        if (!viewRecorded) {
          return res.status(403).json({
            success: false,
            message: 'Preview limit reached',
            guestPreview: true,
            previewLimitReached: true,
            sessionStats: getGuestSessionStats(guestSession.sessionId),
          });
        }

        // Create enhanced preview version with more content than anonymous preview
        const previewTerm = {
          id: term.id,
          name: term.name,
          shortDefinition: term.shortDefinition,
          definition: term.definition ? `${term.definition.substring(0, 400)}...` : '',
          category: term.category,
          categoryId: term.categoryId,
          subcategory: term.subcategory,
          subcategoryId: term.subcategoryId,
          tags: term.tags?.slice(0, 5) || [], // Limit tags
          viewCount: term.viewCount,
          isPreview: true,
          guestPreview: true,
          previewMessage:
            'This is a guest preview. Sign up for free to access the complete definition and all features.',
          sectionsAvailable: ['Definition', 'Basic Examples', 'Category'],
          sectionsLocked: [
            'Detailed Examples',
            'Use Cases',
            'Related Terms',
            'Code Examples',
            'Best Practices',
            'Common Pitfalls',
            'Real-world Applications',
            // ... other sections
          ],
          upgradePrompt: {
            title: 'Unlock the Complete AI/ML Glossary',
            description:
              'Get full access to all 42 content sections for each term, including examples, use cases, and code snippets.',
            features: [
              '10,372+ comprehensive AI/ML definitions',
              '42 detailed sections per term',
              'Interactive code examples',
              'Progress tracking',
              'Advanced search',
              'Learning paths',
            ],
          },
        };

        // Get updated session stats
        const sessionStats = getGuestSessionStats(guestSession.sessionId);

        const response: ApiResponse<any> = {
          success: true,
          data: previewTerm,
          message: 'Guest preview accessed successfully',
          guestPreview: true,
          sessionStats,
        };

        // Set appropriate cache headers for guest content
        res.set({
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'X-Guest-Preview': 'true',
          'X-Previews-Remaining': sessionStats?.previewsRemaining.toString() || '0',
        });

        logger.info('Guest preview accessed', {
          termId: id,
          sessionId: guestSession.sessionId,
          previewsUsed: guestSession.previewsUsed,
          previewsRemaining: sessionStats?.previewsRemaining,
        });

        res.json(response);
      } catch (error) {
        logger.error('Error serving guest preview', {
          error: error instanceof Error ? error.message : 'Unknown error',
          termId: req.params.id,
        });

        res.status(500).json({
          success: false,
          error: 'Failed to load preview',
          guestPreview: true,
        });
      }
    }
  );

  /**
   * @openapi
   * /api/guest/session-status:
   *   get:
   *     tags:
   *       - Guest Preview
   *     summary: Get guest session status
   *     description: Returns current guest session information
   *     responses:
   *       200:
   *         description: Session status retrieved successfully
   */
  app.get('/api/guest/session-status', guestAccessMiddleware, (req: Request, res: Response) => {
    try {
      const guestSession = (req as any).guestSession;

      if (!guestSession) {
        return res.status(400).json({
          success: false,
          error: 'No guest session found',
          guestPreview: true,
        });
      }

      const sessionStats = getGuestSessionStats(guestSession.sessionId);

      res.json({
        success: true,
        data: sessionStats,
        guestPreview: true,
      });
    } catch (error) {
      logger.error('Error getting guest session status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get session status',
        guestPreview: true,
      });
    }
  });

  /**
   * @openapi
   * /api/search/preview:
   *   get:
   *     tags:
   *       - Guest Preview
   *     summary: Search terms with guest preview mode
   *     description: Allows guests to search terms but with limited results
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 5
   *           maximum: 10
   *         description: Number of results (limited for guests)
   *     responses:
   *       200:
   *         description: Search results with preview access
   */
  app.get('/api/search/preview', guestAccessMiddleware, async (req: Request, res: Response) => {
    try {
      const searchQuery = req.query.q as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 5, 10); // Limit guest search results

      if (!searchQuery || searchQuery.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters',
          guestPreview: true,
        });
      }

      // Use optimized storage for search
      const result = await storage.getAllTerms({
        limit,
        offset: 0,
        searchTerm: searchQuery.trim(),
        sortBy: 'viewCount',
        sortOrder: 'desc',
        fields: ['id', 'name', 'shortDefinition', 'category', 'viewCount'],
      });

      // Add preview indicators to search results
      const previewResults = result.terms.map((term: ITerm) => ({
        ...term,
        isPreviewResult: true,
        definition: term.shortDefinition || '',
        previewMessage: 'Preview available - Sign up for full access',
      }));

      const guestSession = (req as any).guestSession;
      const sessionStats = getGuestSessionStats(guestSession?.sessionId);

      res.json({
        success: true,
        data: previewResults,
        total: Math.min(result.total, 50), // Don't reveal total number to guests
        guestPreview: true,
        sessionStats,
        message: `Found ${previewResults.length} results (limited preview)`,
      });
    } catch (error) {
      logger.error('Error in guest search preview', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query.q,
      });

      res.status(500).json({
        success: false,
        error: 'Search failed',
        guestPreview: true,
      });
    }
  });

  /**
   * @openapi
   * /api/categories/preview:
   *   get:
   *     tags:
   *       - Guest Preview
   *     summary: Get categories for guest preview
   *     description: Returns available categories for guest users
   *     responses:
   *       200:
   *         description: Categories retrieved successfully
   */
  app.get('/api/categories/preview', guestAccessMiddleware, async (req: Request, res: Response) => {
    try {
      // Get categories with limited information
      const categories = await storage.getAllCategories();

      // Limit and simplify category data for guests
      const previewCategories = categories.slice(0, 12).map(category => ({
        id: category.id,
        name: category.name,
        description: category.description ? `${category.description.substring(0, 100)}...` : '',
        termCount: category.termCount ? Math.min(category.termCount, 999) : 0, // Don't reveal exact counts
        isPreviewCategory: true,
      }));

      res.json({
        success: true,
        data: previewCategories,
        guestPreview: true,
        message: 'Categories preview (limited)',
      });
    } catch (error) {
      logger.error('Error getting categories preview', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to load categories',
        guestPreview: true,
      });
    }
  });

  /**
   * Admin endpoint to get guest analytics (protected)
   */
  app.get('/api/admin/guest-analytics', async (req: Request, res: Response) => {
    try {
      // Basic auth check (should be replaced with proper admin auth)
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Admin authentication required',
        });
      }

      const analytics = getGuestAnalytics();

      res.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error getting guest analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get analytics',
      });
    }
  });
}
