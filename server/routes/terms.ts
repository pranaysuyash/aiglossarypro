import type { Express, Request, Response } from "express";
import { optimizedStorage as storage } from "../optimizedStorage";
import { mockIsAuthenticated } from "../middleware/dev/mockAuth";
import { features } from "../config";
import type { ITerm, ApiResponse, PaginatedResponse } from "../../shared/types";
import { validateInput, termIdSchema, paginationSchema } from "../middleware/security";
import { rateLimitMiddleware, initializeRateLimiting } from "../middleware/rateLimiting";
import { log as logger } from "../utils/logger";
import { parsePaginationParams, calculatePaginationMetadata, parseLimit, applyClientSidePagination } from "../utils/pagination";
import { SORT_ORDERS, DEFAULT_LIMITS, ERROR_MESSAGES } from "../constants";
import { PAGINATION_CONSTANTS, DATABASE_CONSTANTS, HTTP_STATUS } from "../utils/constants";
import { canViewTerm, hasPremiumAccess, isInTrialPeriod, getRemainingDailyViews } from "../utils/accessControl";

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
   * @swagger
   * /api/terms:
   *   get:
   *     tags:
   *       - Terms
   *     summary: Get paginated list of AI/ML terms
   *     description: Retrieve a paginated list of AI/ML terms with optional filtering and sorting
   *     parameters:
   *       - name: page
   *         in: query
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 12
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *       - name: category
   *         in: query
   *         schema:
   *           type: string
   *       - name: sortBy
   *         in: query
   *         schema:
   *           type: string
   *           enum: [name, viewCount, createdAt]
   *           default: name
   *       - name: sortOrder
   *         in: query
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: asc
   *     responses:
   *       200:
   *         description: Successfully retrieved terms
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedResponse'
   *       500:
   *         description: Internal server error
   */
  // Get all terms with optimized pagination and field selection
  app.get('/api/terms', async (req, res) => {
    try {
      // Parse pagination parameters with stricter limits
      const { page, limit, offset } = parsePaginationParams({
        page: typeof req.query.page === 'string' ? req.query.page : String(req.query.page || 1),
        limit: typeof req.query.limit === 'string' ? req.query.limit : String(req.query.limit || 12),
        defaultLimit: 12,
        maxLimit: 50
      });

      const search = req.query.search as string;
      const category = req.query.category as string;
      const sortBy = (typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name');
      const sortOrder = (typeof req.query.sortOrder === 'string' ? req.query.sortOrder : SORT_ORDERS.ASC);
      const fields = req.query.fields as string || 'id,name,shortDefinition,definition,viewCount,categoryId,category';
      const fieldList = fields.split(',').map(f => f.trim());

      // Use optimized storage method with field selection
      const result = await storage.getAllTerms({
        limit,
        offset,
        categoryId: category || undefined,
        searchTerm: search || undefined,
        sortBy,
        sortOrder: (sortOrder === SORT_ORDERS.DESC) ? SORT_ORDERS.DESC : SORT_ORDERS.ASC,
        fields: fieldList
      });

      // Calculate pagination metadata
      const pagination = calculatePaginationMetadata(page, limit, result.total);

      // Set cache headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=180', // 3 minutes
        'ETag': `"terms-${page}-${limit}-${sortBy}-${sortOrder}-${fields}"`,
        'Vary': 'Accept-Encoding'
      });

      res.json({
        success: true,
        data: result.terms,
        total: result.total,
        page: page,
        limit: limit,
        hasMore: pagination.hasMore,
        pagination
      });
    } catch (error) {
      logger.error('Error fetching terms', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch terms',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get featured terms
  app.get('/api/terms/featured', async (req: Request, res: Response) => {
    try {
      const limit = parseLimit(typeof req.query.limit === 'string' ? req.query.limit : String(req.query.limit || DEFAULT_LIMITS.FEATURED_TERMS), DEFAULT_LIMITS.FEATURED_TERMS, DEFAULT_LIMITS.TERMS);
      const featuredTerms = await storage.getFeaturedTerms();
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: featuredTerms.slice(0, limit)
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching featured terms', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured terms'
      });
    }
  });

  // Get trending terms
  app.get('/api/terms/trending', async (req: Request, res: Response) => {
    try {
      const limit = parseLimit(typeof req.query.limit === 'string' ? req.query.limit : String(req.query.limit || DEFAULT_LIMITS.FEATURED_TERMS), DEFAULT_LIMITS.FEATURED_TERMS, DEFAULT_LIMITS.TERMS);
      const trendingTerms = await storage.getTrendingTerms(limit);
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: trendingTerms
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching trending terms', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trending terms'
      });
    }
  });

  // Get recently viewed terms (user-specific)
  app.get('/api/terms/recently-viewed', authMiddleware, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { limit = DEFAULT_LIMITS.FEATURED_TERMS } = req.query;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      // For now, return empty array since we may not have this method implemented
      // You can implement storage.getRecentlyViewedTerms later
      const recentlyViewed: ITerm[] = [];
      
      try {
        // Try to get recently viewed terms if method exists
        // const recentlyViewed = await storage.getRecentlyViewedTerms(userId, parseInt(limit as string));
      } catch (error) {
        logger.warn('Recently viewed terms method not implemented yet', { error: error instanceof Error ? error.message : String(error) });
      }
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: recentlyViewed
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching recently viewed terms', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recently viewed terms'
      });
    }
  });

  // Get recent terms (general recent terms, not user-specific)
  app.get('/api/terms/recent', async (req: Request, res: Response) => {
    try {
      const { limit = DEFAULT_LIMITS.FEATURED_TERMS } = req.query;
      
      // For now, get the most recently created terms
      const limitNum = parseLimit(typeof limit === 'string' ? limit : String(limit), 10, 50);
      const result = await storage.getAllTerms({
        limit: limitNum,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: SORT_ORDERS.DESC
      });
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: result.terms
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching recent terms', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recent terms'
      });
    }
  });

  // Get recommended terms (general recommendations)
  app.get('/api/terms/recommended', async (req: Request, res: Response) => {
    try {
      const { limit = DEFAULT_LIMITS.FEATURED_TERMS } = req.query;
      
      // For now, return featured terms as recommended
      // You can implement more sophisticated recommendation logic later
      const limitNum = parseLimit(typeof limit === 'string' ? limit : String(limit), 10, 50);
      const recommendedTerms = await storage.getFeaturedTerms();
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: recommendedTerms.slice(0, limitNum)
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching recommended terms', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommended terms'
      });
    }
  });

  // Search terms with advanced filters and database-level pagination
  app.get('/api/terms/search', async (req: Request, res: Response) => {
    try {
      const {
        q = '',
        page = 1,
        limit = 12,
        category = '',
        fields = 'id,name,shortDefinition,viewCount'
      } = req.query;

      const searchQuery = (q as string).trim();
      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      // Parse pagination parameters
      const { page: pageNum, limit: limitNum, offset } = parsePaginationParams({
        page: typeof page === 'string' ? page : String(page),
        limit: typeof limit === 'string' ? limit : String(limit),
        defaultLimit: 10,
        maxLimit: 30
      });
      
      const fieldList = (fields as string).split(',').map(f => f.trim());
      
      // Use optimized search with database-level pagination
      const searchResults = await storage.searchTermsOptimized({
        query: searchQuery,
        categoryId: category as string || undefined,
        offset,
        limit: limitNum,
        fields: fieldList
      });

      const response: PaginatedResponse<ITerm> = {
        data: searchResults.data,
        total: searchResults.total,
        page: pageNum,
        limit: limitNum,
        hasMore: offset + searchResults.data.length < searchResults.total
      };

      // Set cache headers for search results
      res.set({
        'Cache-Control': 'public, max-age=120', // 2 minutes for search
        'ETag': `"search-${Buffer.from(searchQuery).toString('base64')}-${pageNum}-${limitNum}"`,
        'Vary': 'Accept-Encoding'
      });

      res.json({
        success: true,
        ...response
      });

    } catch (error) {
      logger.error('Error searching terms', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to search terms'
      });
    }
  });

  // Get single term by ID with smart access control (must be last to avoid conflicts with named routes)
  app.get('/api/terms/:id', (req, res, next) => {
    try {
      termIdSchema.parse(req.params.id);
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid term ID format' });
    }
  }, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const term = await storage.getTermById(id);
      
      if (!term) {
        return res.status(404).json({
          success: false,
          error: 'Term not found'
        });
      }

      // Check authentication status
      const isAuthenticated = !!(req as any).user?.claims?.sub;
      
      // If not authenticated, return preview version
      if (!isAuthenticated) {
        const previewTerm = {
          ...term,
          definition: term.definition ? term.definition.substring(0, 200) + "..." : "",
          longDefinition: term.longDefinition ? term.longDefinition.substring(0, 300) + "..." : "",
          isPreview: true,
          requiresAuth: true
        };
        
        const response: ApiResponse<any> = {
          success: true,
          data: previewTerm,
          message: "Sign in to view full definition"
        };
        
        return res.json(response);
      }

      // For authenticated users, fetch user data and check access permissions
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const accessCheck = canViewTerm(user, id);
      
      if (!accessCheck.canView) {
        // User is authenticated but hit limits
        if (accessCheck.reason === 'daily_limit_reached') {
          return res.status(429).json({
            success: false,
            error: 'Daily viewing limit reached. Please try again tomorrow or upgrade your account.',
            metadata: accessCheck.metadata
          });
        }
        
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          reason: accessCheck.reason
        });
      }

      // Record view for authenticated users
      try {
        await storage.recordTermView(id, userId);
        
        // Update user's daily view count (for access control)
        // This would typically be handled by the recordTermView method
      } catch (error) {
        logger.warn('View recording not available', { termId: id, userId, error: error instanceof Error ? error.message : String(error) });
      }
      
      // Return full term data with access metadata
      const response: ApiResponse<any> = {
        success: true,
        data: {
          ...term,
          isPreview: false,
          accessType: accessCheck.reason,
          userLimits: accessCheck.metadata
        }
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching term', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch term'
      });
    }
  });

  // Get term recommendations
  app.get('/api/terms/:id/recommendations', (req, res, next) => {
    try {
      termIdSchema.parse(req.params.id);
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid term ID format' });
    }
  }, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;
      
      const limitNum = parseLimit(typeof limit === 'string' ? limit : String(limit), 10, 50);
      // Since getRecommendedTermsForTerm doesn't exist, use related terms or featured terms
      const recommendations = await storage.getFeaturedTerms();
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: recommendations.slice(0, limitNum)
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching recommendations', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendations'
      });
    }
  });

  // Track term view
  app.post('/api/terms/:id/view', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Validate term ID
      try {
        termIdSchema.parse(id);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid term ID format'
        });
      }

      // Track the view
      await storage.trackTermView(userId, id);
      
      res.json({
        success: true,
        message: 'View tracked successfully'
      });
    } catch (error) {
      logger.error('Error tracking term view', { 
        error: error instanceof Error ? error.message : String(error), 
        stack: error instanceof Error ? error.stack : undefined 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to track term view'
      });
    }
  });
}