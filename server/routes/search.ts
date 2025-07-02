import type { Express, Request, Response } from "express";
import { enhancedStorage as storage } from "../enhancedStorage";
import type { SearchResult, SearchFilters, ApiResponse } from "../../shared/types";
import { enhancedTerms as terms, categories } from "../../shared/enhancedSchema";
import { eq, ilike, or, sql, desc, asc } from "drizzle-orm";
import { db } from "../db";
import { searchQuerySchema, paginationSchema } from "../middleware/security";
// import { enhancedSearch, getSearchSuggestions } from "../enhancedSearchService";

/**
 * Search and discovery routes
 */
export function registerSearchRoutes(app: Express): void {
  
  // Main search endpoint
  app.get('/api/search', (req, res, next) => {
    try {
      // Validate search query and pagination
      searchQuerySchema.parse(req.query.q);
      paginationSchema.parse(req.query);
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid search parameters' });
    }
  }, async (req: Request, res: Response) => {
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
      
      console.log('Search query:', q);
      
      // Temporary basic search result to test API
      const searchResult: SearchResult = {
        terms: [],
        total: 0,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
        hasMore: false
      };
      
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
      
      // Use basic search for suggestions
      const suggestionResults = await db.select({ name: terms.name })
        .from(terms)
        .where(ilike(terms.name, `${query}%`))
        .orderBy(desc(terms.viewCount))
        .limit(Math.min(limit - 3, 15));
      
      const termSuggestions = suggestionResults.map(r => r.name);
      
      // Get category suggestions (using storage layer)
      // TODO: Add searchCategories(query, limit) method to enhancedStorage in Phase 2
      const allCategories = await storage.getCategories();
      const categorySuggestions = allCategories
        .filter(cat => cat.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(cat => ({ name: cat.name }));
      
      // Combine suggestions in a more structured format
      const allSuggestions = [
        ...termSuggestions.map(name => ({ 
          id: `term-${name}`, 
          name, 
          type: 'term',
          category: null 
        })),
        ...categorySuggestions.map((cat: any) => ({ 
          id: `category-${cat.name}`, 
          name: cat.name, 
          type: 'category',
          category: null 
        }))
      ];
      
      res.json(allSuggestions.slice(0, limit));
      
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
  });

  /**
   * Fuzzy search endpoint for handling typos and partial matches
   * GET /api/search/fuzzy?q=query&threshold=0.3&limit=20
   */
  app.get('/api/search/fuzzy', async (req: Request, res: Response) => {
    try {
      const { 
        q, 
        threshold = 0.3,
        limit = 20,
        page = 1,
        category,
        difficulty,
        sort = 'relevance'
      } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Search query is required"
        });
      }
      
      // Use same basic search as main endpoint
      const searchResults = await db.select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        viewCount: terms.viewCount,
        categoryId: categories.id,
        categoryName: categories.name
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(or(
        ilike(terms.name, `%${q.trim()}%`),
        ilike(terms.definition, `%${q.trim()}%`)
      ))
      .orderBy(desc(terms.viewCount), asc(terms.name))
      .limit(100);
      
      const transformedResults = searchResults.map(result => ({
        id: result.id || '',
        name: result.name || '',
        definition: result.definition || '',
        shortDefinition: result.shortDefinition || undefined,
        viewCount: result.viewCount || 0,
        relevanceScore: 1, // Basic relevance score
        category: result.categoryId && result.categoryName ? {
          id: result.categoryId,
          name: result.categoryName
        } : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedResults = transformedResults.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        data: {
          results: paginatedResults,
          total: transformedResults.length,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(transformedResults.length / parseInt(limit as string)),
          searchTime: 0,
          suggestions: [],
          searchType: 'fuzzy',
          threshold: parseFloat(threshold as string)
        }
      });
      
    } catch (error) {
      console.error('Error in fuzzy search:', error);
      res.status(500).json({ 
        success: false,
        message: "Fuzzy search failed",
        error: error instanceof Error ? error.message : "Unknown error"
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