import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import type { SearchResult, SearchFilters, ApiResponse } from "../../shared/types";

/**
 * Search and discovery routes
 */
export function registerSearchRoutes(app: Express): void {
  
  // Main search endpoint
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const { 
        q, 
        page = 1, 
        limit = 20,
        category,
        subcategory,
        difficulty,
        tags,
        sort = 'relevance'
      } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Search query is required"
        });
      }
      
      const filters: SearchFilters = {
        category: category as string,
        subcategory: subcategory as string,
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
        tags: tags ? (tags as string).split(',') : undefined
      };
      
      const searchResult = await storage.searchTerms({
        query: q.trim(),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
        sortBy: sort as string
      });
      
      const response: ApiResponse<SearchResult> = {
        success: true,
        data: searchResult
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ 
        success: false,
        message: "Search failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Search suggestions/autocomplete
  app.get('/api/search/suggestions', async (req: Request, res: Response) => {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }
      
      const suggestions = await storage.getSearchSuggestions(
        q.trim(),
        parseInt(limit as string)
      );
      
      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch search suggestions" 
      });
    }
  });

  // Popular search terms
  app.get('/api/search/popular', async (req: Request, res: Response) => {
    try {
      const { limit = 10, timeframe = '7d' } = req.query;
      
      const popularTerms = await storage.getPopularSearchTerms(
        parseInt(limit as string),
        timeframe as string
      );
      
      res.json({
        success: true,
        data: popularTerms
      });
    } catch (error) {
      console.error("Error fetching popular search terms:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch popular search terms" 
      });
    }
  });

  // Search filters metadata
  app.get('/api/search/filters', async (req: Request, res: Response) => {
    try {
      const filters = await storage.getSearchFilters();
      
      res.json({
        success: true,
        data: filters
      });
    } catch (error) {
      console.error("Error fetching search filters:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch search filters" 
      });
    }
  });

  // Advanced search endpoint
  app.post('/api/search/advanced', async (req: Request, res: Response) => {
    try {
      const {
        query,
        filters,
        page = 1,
        limit = 20,
        sort = 'relevance'
      } = req.body;
      
      const searchResult = await storage.advancedSearch({
        query: query?.trim(),
        filters,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy: sort
      });
      
      res.json({
        success: true,
        data: searchResult
      });
    } catch (error) {
      console.error("Error performing advanced search:", error);
      res.status(500).json({ 
        success: false,
        message: "Advanced search failed" 
      });
    }
  });
}