import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import type { SearchResult, SearchFilters, ApiResponse } from "../../shared/types";
import { db } from "../db";
import { terms, categories } from "../../shared/schema";
import { eq, ilike, or, sql } from "drizzle-orm";

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

  /**
   * Get autocomplete suggestions for search
   * GET /api/search/suggestions?q=query&limit=10
   */
  app.get('/api/search/suggestions', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      // Search for terms that match the query
      const suggestions = await db
        .select({
          id: terms.id,
          name: terms.name,
          category: categories.name,
          type: sql<string>`'term'`,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(
          or(
            ilike(terms.name, `%${query}%`),
            ilike(terms.definition, `%${query}%`)
          )
        )
        .orderBy(
          // Prioritize exact matches at the beginning
          sql`CASE WHEN LOWER(${terms.name}) LIKE LOWER(${query + '%'}) THEN 1 ELSE 2 END`,
          terms.name
        )
        .limit(Math.min(limit, 20));
      
      // Also search categories for broader suggestions
      const categorySuggestions = await db
        .select({
          id: categories.id,
          name: categories.name,
          category: sql<string>`NULL`,
          type: sql<string>`'category'`,
        })
        .from(categories)
        .where(ilike(categories.name, `%${query}%`))
        .orderBy(categories.name)
        .limit(Math.min(5, limit));
      
      // Combine and sort results
      const allSuggestions = [
        ...suggestions,
        ...categorySuggestions
      ].slice(0, limit);
      
      res.json(allSuggestions);
      
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch suggestions' });
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