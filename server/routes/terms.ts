import type { Express, Request, Response } from "express";
import { optimizedStorage as storage } from "../optimizedStorage";
import { isAuthenticated } from "../replitAuth";
import { mockIsAuthenticated } from "../middleware/dev/mockAuth";
import { features } from "../config";
import type { ITerm, ApiResponse, PaginatedResponse } from "../../shared/types";
import { validateInput, termIdSchema, paginationSchema } from "../middleware/security";
import { rateLimitMiddleware, initializeRateLimiting } from "../middleware/rateLimiting";

// Define authenticated request type properly
interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;
      email: string;
      name: string;
    };
  };
}

/**
 * Term management routes with proper pagination and search
 */
export function registerTermRoutes(app: Express): void {
  // Initialize rate limiting
  initializeRateLimiting();
  
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  
  // Get all terms with pagination
  app.get('/api/terms', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const sortBy = req.query.sortBy as string || 'name';
      const sortOrder = req.query.sortOrder as string || 'asc';

      // Calculate offset
      const offset = (page - 1) * limit;

      // Use existing storage method with proper parameters
      const result = await storage.getAllTerms({
        limit,
        offset,
        categoryId: category || undefined,
        searchTerm: search || undefined,
        sortBy,
        sortOrder: (sortOrder === 'desc') ? 'desc' : 'asc'
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(result.total / limit);
      const hasMore = page < totalPages;
      const hasPrevious = page > 1;

      res.json({
        success: true,
        data: result.terms,
        total: result.total,
        page: page,
        limit: limit,
        hasMore: hasMore,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: result.total,
          itemsPerPage: limit,
          hasMore,
          hasPrevious,
          startItem: offset + 1,
          endItem: Math.min(offset + limit, result.total)
        }
      });
    } catch (error) {
      console.error('Error fetching terms:', error);
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
      const { limit = 10 } = req.query;
      const featuredTerms = await storage.getFeaturedTerms();
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: featuredTerms.slice(0, parseInt(limit as string))
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching featured terms:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured terms'
      });
    }
  });

  // Get trending terms
  app.get('/api/terms/trending', async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const trendingTerms = await storage.getTrendingTerms(parseInt(limit as string));
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: trendingTerms
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching trending terms:', error);
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
      const { limit = 10 } = req.query;
      
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
        console.log('Recently viewed terms method not implemented yet');
      }
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: recentlyViewed
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching recently viewed terms:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recently viewed terms'
      });
    }
  });

  // Get recent terms (general recent terms, not user-specific)
  app.get('/api/terms/recent', async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      
      // For now, get the most recently created terms
      const result = await storage.getAllTerms({
        limit: parseInt(limit as string),
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: result.terms
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching recent terms:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recent terms'
      });
    }
  });

  // Get recommended terms (general recommendations)
  app.get('/api/terms/recommended', async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      
      // For now, return featured terms as recommended
      // You can implement more sophisticated recommendation logic later
      const recommendedTerms = await storage.getFeaturedTerms();
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: recommendedTerms.slice(0, parseInt(limit as string))
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching recommended terms:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommended terms'
      });
    }
  });

  // Search terms with advanced filters
  app.get('/api/terms/search', async (req: Request, res: Response) => {
    try {
      const {
        q = '',
        page = 1,
        limit = 12,
        category = ''
      } = req.query;

      const searchQuery = (q as string).trim();
      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
      const offset = (pageNum - 1) * limitNum;
      
      // Use existing search method
      const searchResults = await storage.searchTerms(searchQuery);
      
      // Apply pagination and filtering
      let filteredResults = searchResults;
      if (category) {
        filteredResults = searchResults.filter(term => term.categoryId === category);
      }
      
      const total = filteredResults.length;
      const paginatedResults = filteredResults.slice(offset, offset + limitNum);

      const response: PaginatedResponse<ITerm> = {
        data: paginatedResults,
        total,
        page: pageNum,
        limit: limitNum,
        hasMore: offset + limitNum < total
      };

      res.json({
        success: true,
        ...response
      });

    } catch (error) {
      console.error('Error searching terms:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search terms'
      });
    }
  });

  // Get single term by ID (must be last to avoid conflicts with named routes)
  app.get('/api/terms/:id', authMiddleware, rateLimitMiddleware, (req, res, next) => {
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

      // Record view if method exists
      try {
        await storage.recordTermView(id, null);
      } catch (error) {
        // If method doesn't exist, continue without recording view
        console.log('View recording not available');
      }
      
      const response: ApiResponse<ITerm> = {
        success: true,
        data: term
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching term:', error);
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
      
      const recommendations = await storage.getRecommendedTermsForTerm(id, null);
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: recommendations.slice(0, parseInt(limit as string))
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendations'
      });
    }
  });
}