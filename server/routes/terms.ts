import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import type { AuthenticatedRequest, ITerm, ApiResponse, PaginatedResponse } from "../../shared/types";

/**
 * Term management routes
 */
export function registerTermRoutes(app: Express): void {
  
  // Get featured terms
  app.get('/api/terms/featured', async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const featuredTerms = await storage.getFeaturedTerms(parseInt(limit as string));
      
      const response: ApiResponse<ITerm[]> = {
        success: true,
        data: featuredTerms
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching featured terms:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch featured terms" 
      });
    }
  });

  // Get trending terms (most viewed)
  app.get('/api/terms/trending', async (req: Request, res: Response) => {
    try {
      const { limit = 10, timeframe = '7d' } = req.query;
      const trendingTerms = await storage.getTrendingTerms(
        parseInt(limit as string),
        timeframe as string
      );
      
      res.json({
        success: true,
        data: trendingTerms
      });
    } catch (error) {
      console.error("Error fetching trending terms:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch trending terms" 
      });
    }
  });

  // Get recently added terms
  app.get('/api/terms/recent', async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const recentTerms = await storage.getRecentTerms(parseInt(limit as string));
      
      res.json({
        success: true,
        data: recentTerms
      });
    } catch (error) {
      console.error("Error fetching recent terms:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch recent terms" 
      });
    }
  });

  // Get recently viewed terms (authenticated)
  app.get('/api/terms/recently-viewed', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 10 } = req.query;
      
      const recentlyViewed = await storage.getRecentlyViewedTerms(
        userId, 
        parseInt(limit as string)
      );
      
      res.json({
        success: true,
        data: recentlyViewed
      });
    } catch (error) {
      console.error("Error fetching recently viewed terms:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch recently viewed terms" 
      });
    }
  });

  // Get recommended terms (authenticated)
  app.get('/api/terms/recommended', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 10 } = req.query;
      
      const recommendedTerms = await storage.getRecommendedTermsForUser(
        userId,
        parseInt(limit as string)
      );
      
      res.json({
        success: true,
        data: recommendedTerms
      });
    } catch (error) {
      console.error("Error fetching recommended terms:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch recommended terms" 
      });
    }
  });

  // Get all terms with pagination and filtering
  app.get('/api/terms', async (req: Request, res: Response) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        category, 
        search, 
        sort = 'name',
        order = 'asc'
      } = req.query;
      
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const result = await storage.getAllTerms({
        limit: parseInt(limit as string),
        offset,
        categoryId: category as string,
        searchTerm: search as string,
        sortBy: sort as string,
        sortOrder: order as 'asc' | 'desc'
      });
      
      const response: PaginatedResponse<ITerm> = {
        data: result.terms,
        total: result.total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        hasMore: result.hasMore
      };
      
      res.json({
        success: true,
        ...response
      });
    } catch (error) {
      console.error("Error fetching all terms:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch terms" 
      });
    }
  });

  // Get term by ID
  app.get('/api/terms/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { includeRelated = true } = req.query;
      
      const term = await storage.getTermById(id, {
        includeRelated: includeRelated === 'true'
      });
      
      if (!term) {
        return res.status(404).json({ 
          success: false,
          message: "Term not found" 
        });
      }
      
      const response: ApiResponse<ITerm> = {
        success: true,
        data: term
      };
      
      res.json(response);
    } catch (error) {
      console.error(`Error fetching term ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch term" 
      });
    }
  });

  // Record term view
  app.post('/api/terms/:id/view', async (req: Request, res: Response) => {
    try {
      const termId = req.params.id;
      const userId = req.isAuthenticated?.() ? (req as any).user.claims.sub : null;
      
      await storage.recordTermView(termId, userId);
      
      res.json({ 
        success: true,
        message: "Term view recorded"
      });
    } catch (error) {
      console.error(`Error recording term view for ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to record term view" 
      });
    }
  });

  // Get recommended terms for a specific term
  app.get('/api/terms/:id/recommended', async (req: Request, res: Response) => {
    try {
      const termId = req.params.id;
      const userId = req.isAuthenticated?.() ? (req as any).user.claims.sub : null;
      const { limit = 5 } = req.query;
      
      const recommendedTerms = await storage.getRecommendedTermsForTerm(
        termId, 
        userId,
        parseInt(limit as string)
      );
      
      res.json({
        success: true,
        data: recommendedTerms
      });
    } catch (error) {
      console.error(`Error fetching recommended terms for ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch recommended terms" 
      });
    }
  });

  // Get term statistics
  app.get('/api/terms/:id/stats', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stats = await storage.getTermStats(id);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error(`Error fetching term stats ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch term statistics" 
      });
    }
  });
}