import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import type { ITerm, ApiResponse, PaginatedResponse } from "../../shared/types";

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
  
  // Get terms with proper server-side pagination, search, and filtering
  app.get('/api/terms', async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 12,
        search = '',
        category = '',
        sort = 'name',
        order = 'asc'
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string))); // Cap at 100
      const offset = (pageNum - 1) * limitNum;

      // Use existing storage method with proper parameters
      const result = await storage.getAllTerms({
        limit: limitNum,
        offset,
        categoryId: category as string || undefined,
        searchTerm: search as string || undefined,
        sortBy: sort as string,
        sortOrder: order as 'asc' | 'desc'
      });

      const response: PaginatedResponse<ITerm> = {
        data: result.terms,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        hasMore: result.hasMore
      };

      res.json({
        success: true,
        ...response
      });

    } catch (error) {
      console.error('Error fetching terms:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch terms'
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

  // Get single term by ID
  app.get('/api/terms/:id', async (req: Request, res: Response) => {
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
  app.get('/api/terms/:id/recommendations', async (req: Request, res: Response) => {
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
}