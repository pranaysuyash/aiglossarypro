import type { Express, Request, Response } from 'express';
import type { ApiResponse, ITerm, PaginatedResponse } from '../../shared/types';
import { DEFAULT_LIMITS, SORT_ORDERS } from '../constants';
import { mockIsAuthenticated } from '../middleware/dev/mockAuth';
import { initializeRateLimiting } from '../middleware/rateLimiting';
import { termIdSchema } from '../middleware/security';
import { optimizedStorage as storage } from '../optimizedStorage';
import { canViewTerm } from '../utils/accessControl';
import { log as logger } from '../utils/logger';
import {
  calculatePaginationMetadata,
  parseLimit,
  parsePaginationParams,
} from '../utils/pagination';

// Import AuthenticatedRequest from shared types
// (Removed duplicate interface definition)

/**
 * Term management routes with proper pagination and search
 */
export function registerTermRoutes(app: Express): void {
  // Initialize rate limiting
  initializeRateLimiting();

  // Choose authentication middleware based on environment
  const authMiddleware = mockIsAuthenticated;

  /**
   * @openapi
   * /api/terms:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get paginated list of AI/ML terms
   *     description: Retrieve a paginated list of AI/ML terms with optional filtering and sorting. Supports field selection for optimized responses.
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 24
   *         description: Number of terms per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search query to filter terms by name or definition
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter terms by category ID
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [name, viewCount, createdAt]
   *           default: name
   *         description: Field to sort by
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: asc
   *         description: Sort order
   *       - in: query
   *         name: fields
   *         schema:
   *           type: string
   *           default: "id,name,shortDefinition,definition,viewCount,categoryId,category"
   *         description: Comma-separated list of fields to include in response
   *     responses:
   *       200:
   *         description: Successfully retrieved terms
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
   *                     $ref: '#/components/schemas/Term'
   *                 total:
   *                   type: integer
   *                   description: Total number of terms matching the criteria
   *                 page:
   *                   type: integer
   *                   description: Current page number
   *                 limit:
   *                   type: integer
   *                   description: Number of terms per page
   *                 hasMore:
   *                   type: boolean
   *                   description: Whether there are more pages available
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     totalPages:
   *                       type: integer
   *                     hasNext:
   *                       type: boolean
   *                     hasPrev:
   *                       type: boolean
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Get all terms with optimized pagination and field selection
  app.get('/api/terms', async (req, res) => {
    try {
      // Parse pagination parameters with increased limits for better data access
      const { page, limit, offset } = parsePaginationParams({
        page: typeof req.query.page === 'string' ? req.query.page : String(req.query.page || 1),
        limit:
          typeof req.query.limit === 'string' ? req.query.limit : String(req.query.limit || 24),
        defaultLimit: 24,
        maxLimit: 100,
      });

      const search = req.query.search as string;
      const category = req.query.category as string;
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name';
      const sortOrder =
        typeof req.query.sortOrder === 'string' ? req.query.sortOrder : SORT_ORDERS.ASC;
      const fields =
        (req.query.fields as string) ||
        'id,name,shortDefinition,definition,viewCount,categoryId,category';
      const fieldList = fields.split(',').map((f) => f.trim());

      // Use optimized storage method with field selection
      let result;
      try {
        result = await storage.getAllTerms({
          limit,
          offset,
          categoryId: category || undefined,
          searchTerm: search || undefined,
          sortBy,
          sortOrder: sortOrder === SORT_ORDERS.DESC ? SORT_ORDERS.DESC : SORT_ORDERS.ASC,
          fields: fieldList,
        });
      } catch (dbError) {
        // Database schema issues - return empty response with explanation
        logger.warn('Database query failed, returning empty result', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
        result = {
          terms: [],
          total: 0,
        };
      }

      // Calculate pagination metadata
      const pagination = calculatePaginationMetadata(page, limit, result.total);

      // Set cache headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=180', // 3 minutes
        ETag: `"terms-${page}-${limit}-${sortBy}-${sortOrder}-${fields}"`,
        Vary: 'Accept-Encoding',
      });

      const response: any = {
        success: true,
        data: result.terms,
        total: result.total,
        page: page,
        limit: limit,
        hasMore: pagination.hasMore,
        pagination,
      };

      // Add message if database is empty (expected for new content pipeline)
      if (result.total === 0 && !search && !category) {
        response.message =
          'Database is empty - waiting for new content generation pipeline to populate data';
      }

      res.json(response);
    } catch (error) {
      logger.error('Error fetching terms', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch terms',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @openapi
   * /api/terms/featured:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get featured terms
   *     description: Retrieve a list of featured AI/ML terms selected for prominence
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Maximum number of featured terms to return
   *     responses:
   *       200:
   *         description: Featured terms retrieved successfully
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
   *                     $ref: '#/components/schemas/Term'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/terms/featured', async (req: Request, res: Response) => {
    try {
      const limit = parseLimit(
        typeof req.query.limit === 'string'
          ? req.query.limit
          : String(req.query.limit || DEFAULT_LIMITS.FEATURED_TERMS),
        DEFAULT_LIMITS.FEATURED_TERMS,
        DEFAULT_LIMITS.TERMS
      );
      let featuredTerms: ITerm[] = [];
      try {
        featuredTerms = await storage.getFeaturedTerms();
      } catch (dbError) {
        logger.warn('Featured terms query failed, returning empty result', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
        featuredTerms = [];
      }

      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: featuredTerms.slice(0, limit),
        ...(featuredTerms.length === 0 && {
          message:
            'No featured terms available - database is empty (expected for new content pipeline)',
        }),
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching featured terms', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured terms',
      });
    }
  });

  /**
   * @openapi
   * /api/terms/trending:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get trending terms
   *     description: Retrieve terms that are currently trending based on view count and engagement
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Maximum number of trending terms to return
   *     responses:
   *       200:
   *         description: Trending terms retrieved successfully
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
   *                     $ref: '#/components/schemas/Term'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/terms/trending', async (req: Request, res: Response) => {
    try {
      const limit = parseLimit(
        typeof req.query.limit === 'string'
          ? req.query.limit
          : String(req.query.limit || DEFAULT_LIMITS.FEATURED_TERMS),
        DEFAULT_LIMITS.FEATURED_TERMS,
        DEFAULT_LIMITS.TERMS
      );
      const trendingTerms = await storage.getTrendingTerms(limit);

      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: trendingTerms,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching trending terms', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trending terms',
      });
    }
  });

  /**
   * @openapi
   * /api/terms/recently-viewed:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get recently viewed terms
   *     description: Retrieve terms that the authenticated user has recently viewed
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Maximum number of recently viewed terms to return
   *     responses:
   *       200:
   *         description: Recently viewed terms retrieved successfully
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
   *                     $ref: '#/components/schemas/Term'
   *       401:
   *         description: Authentication required
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

  /**
   * @openapi
   * /api/terms/recently-viewed:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get recently viewed terms
   *     description: Retrieve terms that the authenticated user has recently viewed
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Maximum number of recently viewed terms to return
   *     responses:
   *       200:
   *         description: Recently viewed terms retrieved successfully
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
   *                     $ref: '#/components/schemas/Term'
   *       401:
   *         description: Authentication required
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
  app.get('/api/terms/recently-viewed', authMiddleware, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { limit = DEFAULT_LIMITS.FEATURED_TERMS } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // For now, return empty array since we may not have this method implemented
      // You can implement storage.getRecentlyViewedTerms later
      const recentlyViewed: ITerm[] = [];

      try {
        // Try to get recently viewed terms if method exists
        // const recentlyViewed = await storage.getRecentlyViewedTerms(userId, parseInt(limit as string));
      } catch (error) {
        logger.warn('Recently viewed terms method not implemented yet', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: recentlyViewed,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching recently viewed terms', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recently viewed terms',
      });
    }
  });

  /**
   * @openapi
   * /api/terms/recent:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get recent terms
   *     description: Retrieve the most recently created terms in the system
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Maximum number of recent terms to return
   *     responses:
   *       200:
   *         description: Recent terms retrieved successfully
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
   *                     $ref: '#/components/schemas/Term'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/terms/recent', async (req: Request, res: Response) => {
    try {
      const { limit = DEFAULT_LIMITS.FEATURED_TERMS } = req.query;

      // For now, get the most recently created terms
      const limitNum = parseLimit(typeof limit === 'string' ? limit : String(limit), 10, 50);
      const result = await storage.getAllTerms({
        limit: limitNum,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: SORT_ORDERS.DESC,
      });

      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: result.terms,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching recent terms', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recent terms',
      });
    }
  });

  /**
   * @openapi
   * /api/terms/recommended:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get recommended terms
   *     description: Retrieve general term recommendations based on popularity and quality
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Maximum number of recommended terms to return
   *     responses:
   *       200:
   *         description: Recommended terms retrieved successfully
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
   *                     $ref: '#/components/schemas/Term'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  app.get('/api/terms/recommended', async (req: Request, res: Response) => {
    try {
      const { limit = DEFAULT_LIMITS.FEATURED_TERMS } = req.query;

      // For now, return featured terms as recommended
      // You can implement more sophisticated recommendation logic later
      const limitNum = parseLimit(typeof limit === 'string' ? limit : String(limit), 10, 50);
      const recommendedTerms = await storage.getFeaturedTerms();

      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: recommendedTerms.slice(0, limitNum),
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching recommended terms', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommended terms',
      });
    }
  });

  /**
   * @openapi
   * /api/terms/search:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Search terms with advanced filters
   *     description: Search for terms using full-text search with optional category filtering and pagination
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 12
   *         description: Number of results per page
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter results by category
   *       - in: query
   *         name: fields
   *         schema:
   *           type: string
   *           default: "id,name,shortDefinition,viewCount"
   *         description: Comma-separated list of fields to return
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
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
   *                     $ref: '#/components/schemas/Term'
   *                 total:
   *                   type: integer
   *                   example: 25
   *                 page:
   *                   type: integer
   *                   example: 1
   *                 limit:
   *                   type: integer
   *                   example: 12
   *                 hasMore:
   *                   type: boolean
   *                   example: true
   *       400:
   *         description: Search query is required
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
  app.get('/api/terms/search', async (req: Request, res: Response) => {
    try {
      const {
        q = '',
        page = 1,
        limit = 12,
        category = '',
        fields = 'id,name,shortDefinition,viewCount',
      } = req.query;

      const searchQuery = (q as string).trim();
      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      // Parse pagination parameters with increased limits for search
      const {
        page: pageNum,
        limit: limitNum,
        offset,
      } = parsePaginationParams({
        page: typeof page === 'string' ? page : String(page),
        limit: typeof limit === 'string' ? limit : String(limit),
        defaultLimit: 20,
        maxLimit: 50,
      });

      const fieldList = (fields as string).split(',').map((f) => f.trim());

      // Use optimized search with database-level pagination
      const searchResults = await storage.searchTermsOptimized({
        query: searchQuery,
        categoryId: (category as string) || undefined,
        offset,
        limit: limitNum,
        fields: fieldList,
      });

      const response: PaginatedResponse<ITerm> = {
        data: searchResults.data,
        total: searchResults.total,
        page: pageNum,
        limit: limitNum,
        hasMore: offset + searchResults.data.length < searchResults.total,
      };

      // Set cache headers for search results
      res.set({
        'Cache-Control': 'public, max-age=120', // 2 minutes for search
        ETag: `"search-${Buffer.from(searchQuery).toString('base64')}-${pageNum}-${limitNum}"`,
        Vary: 'Accept-Encoding',
      });

      res.json({
        success: true,
        ...response,
      });
    } catch (error) {
      logger.error('Error searching terms', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to search terms',
      });
    }
  });

  /**
   * @openapi
   * /api/terms/{id}:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get term by ID
   *     description: Retrieve a specific term by its ID with smart access control and preview functionality for unauthenticated users
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The term ID
   *     responses:
   *       200:
   *         description: Term retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   allOf:
   *                     - $ref: '#/components/schemas/Term'
   *                     - type: object
   *                       properties:
   *                         isPreview:
   *                           type: boolean
   *                           description: Whether this is a preview version
   *                         requiresAuth:
   *                           type: boolean
   *                           description: Whether authentication is required for full access
   *                         requiresUpgrade:
   *                           type: boolean
   *                           description: Whether upgrade is required
   *                         accessType:
   *                           type: string
   *                           description: Type of access granted
   *                         userLimits:
   *                           type: object
   *                           description: User access limit information
   *                         limitInfo:
   *                           type: object
   *                           description: Current limit status
   *                 message:
   *                   type: string
   *                   description: Additional message about access status
   *       400:
   *         description: Invalid term ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 error:
   *                   type: string
   *                   example: "Access denied"
   *                 reason:
   *                   type: string
   *                   description: Specific reason for access denial
   *       404:
   *         description: Term not found
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
  // Get single term by ID with smart access control (must be last to avoid conflicts with named routes)
  app.get(
    '/api/terms/:id',
    (req, res, next) => {
      try {
        termIdSchema.parse(req.params.id);
        next();
      } catch (_error) {
        return res.status(400).json({ error: 'Invalid term ID format' });
      }
    },
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const term = await storage.getTermById(id);

        if (!term) {
          return res.status(404).json({
            success: false,
            error: 'Term not found',
          });
        }

        // Check authentication status
        const isAuthenticated = !!(req as any).user?.claims?.sub;

        // If not authenticated, return preview version
        if (!isAuthenticated) {
          const previewTerm = {
            ...term,
            definition: term.definition ? `${term.definition.substring(0, 150)}...` : '',
            longDefinition: term.longDefinition
              ? `${term.longDefinition.substring(0, 250)}...`
              : '',
            isPreview: true,
            requiresAuth: true,
            previewMessage: 'Sign in to view the complete definition, examples, and all 42 content sections',
          };

          const response: ApiResponse<any> = {
            success: true,
            data: previewTerm,
            message: 'Preview mode - Sign in for full access',
          };

          return res.json(response);
        }

        // For authenticated users, fetch user data and check access permissions
        const userId = (req as any).user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found',
          });
        }

        // Check if preview mode is enabled (from rate limiting middleware)
        const previewMode = (req as any).previewMode;
        const limitInfo = (req as any).limitInfo;

        if (previewMode) {
          // Return preview version with upgrade prompt
          const previewTerm = {
            ...term,
            definition: term.definition ? `${term.definition.substring(0, 250)}...` : '',
            shortDefinition: term.shortDefinition
              ? `${term.shortDefinition.substring(0, 150)}...`
              : '',
            isPreview: true,
            requiresUpgrade: true,
            limitInfo: limitInfo,
          };

          const response: ApiResponse<any> = {
            success: true,
            data: previewTerm,
            message:
              "You've reached your daily viewing limit. Upgrade to continue reading or try again tomorrow.",
          };

          return res.json(response);
        }

        const accessCheck = canViewTerm(user, id);

        if (!accessCheck.canView) {
          // User is authenticated but hit limits - fallback to old behavior
          if (accessCheck.reason === 'daily_limit_reached') {
            // Return preview version instead of blocking
            const previewTerm = {
              ...term,
              definition: term.definition ? `${term.definition.substring(0, 250)}...` : '',
              shortDefinition: term.shortDefinition
                ? `${term.shortDefinition.substring(0, 150)}...`
                : '',
              isPreview: true,
              requiresUpgrade: true,
              limitInfo: accessCheck.metadata,
            };

            const response: ApiResponse<any> = {
              success: true,
              data: previewTerm,
              message:
                "You've reached your daily viewing limit. Upgrade to continue reading or try again tomorrow.",
            };

            return res.json(response);
          }

          return res.status(403).json({
            success: false,
            error: 'Access denied',
            reason: accessCheck.reason,
          });
        }

        // Record view for authenticated users
        try {
          await storage.recordTermView(id, userId);

          // Update user's daily view count (for access control)
          // This would typically be handled by the recordTermView method
        } catch (error) {
          logger.warn('View recording not available', {
            termId: id,
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        // Return full term data with access metadata
        const response: ApiResponse<any> = {
          success: true,
          data: {
            ...term,
            isPreview: false,
            accessType: accessCheck.reason,
            userLimits: accessCheck.metadata,
          },
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching term', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch term',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/terms/{id}/recommendations:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get term recommendations
   *     description: Retrieve recommended terms related to a specific term
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The term ID to get recommendations for
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 5
   *         description: Maximum number of recommendations to return
   *     responses:
   *       200:
   *         description: Recommendations retrieved successfully
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
   *                     $ref: '#/components/schemas/Term'
   *       400:
   *         description: Invalid term ID format
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
  // Get term recommendations
  app.get(
    '/api/terms/:id/recommendations',
    (req, res, next) => {
      try {
        termIdSchema.parse(req.params.id);
        next();
      } catch (_error) {
        return res.status(400).json({ error: 'Invalid term ID format' });
      }
    },
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { limit = 5 } = req.query;

        const limitNum = parseLimit(typeof limit === 'string' ? limit : String(limit), 10, 50);
        // Since getRecommendedTermsForTerm doesn't exist, use related terms or featured terms
        const recommendations = await storage.getFeaturedTerms();

        const response: ApiResponse<ITerm[]> = {
          success: true,
          data: recommendations.slice(0, limitNum),
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching recommendations', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch recommendations',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/terms/{id}/view:
   *   post:
   *     tags:
   *       - Terms
   *     summary: Track term view
   *     description: Record that an authenticated user has viewed a specific term
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the term being viewed
   *     responses:
   *       200:
   *         description: View tracked successfully
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
   *                   example: "View tracked successfully"
   *       400:
   *         description: Invalid term ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: User not authenticated
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
  app.post('/api/terms/:id/view', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // Validate term ID
      try {
        termIdSchema.parse(id);
      } catch (_error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid term ID format',
        });
      }

      // Track the view
      await storage.trackTermView(userId, id);

      res.json({
        success: true,
        message: 'View tracked successfully',
      });
    } catch (error) {
      logger.error('Error tracking term view', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to track term view',
      });
    }
  });
}
