import { asc, desc, ilike, or } from 'drizzle-orm';
import type { Express, Request, Response } from 'express'
import type { Request, Response } from 'express';
import { z } from 'zod';
import { enhancedTerms as terms } from '@aiglossarypro/shared';
import type { ApiResponse, SearchResult } from '@aiglossarypro/shared';
import { db } from '@aiglossarypro/database';
import { enhancedStorage as storage } from '../enhancedStorage';
import { paginationSchema, searchQuerySchema } from '../middleware/security';
import { validate } from '../middleware/validationMiddleware';
import { searchSchemas } from '../schemas/engagementValidation';
import {
  getPopularSearchTerms as getOptimizedPopularTerms,
  optimizedSearch,
  optimizedSearchSuggestions,
} from '../optimizedSearchService';

import logger from '../utils/logger';
/**
 * Search and discovery routes
 */
export function registerSearchRoutes(app: Express): void {
  // Main search endpoint
  app.get(
    '/api/search',
    validate.query(searchSchemas.search, { 
      sanitizeHtml: true,
      logErrors: true 
    }),
    async (req: Request, res: Response) => {
      try {
        const {
          q,
          page,
          limit,
          filters,
          sort
        } = req.query as unknown;

        logger.info('Search query:', q);

        // Use optimized search service for better performance
        const searchResponse = await optimizedSearch({
          query: q,
          page: page,
          limit: limit,
          category: filters?.category,
          sort: sort,
          includeDefinition: true,
        });

        // Helper function to highlight search terms
        const highlightSearchTerms = (text: string, query: string): string => {
          if (!text || !query) {return text;}
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          return text.replace(regex, '<mark>$1</mark>');
        };

        // Transform search response to match shared types with highlighting
        const searchResult: SearchResult = {
          terms: searchResponse.results.map(result => ({
            id: result.id,
            name: result.name,
            definition: result.definition || result.shortDefinition || '',
            shortDefinition: result.shortDefinition,
            category: result.category?.name || 'Uncategorized',
            categoryId: result.category?.id,
            viewCount: result.viewCount,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            characteristics: result.characteristics?.[0] || undefined,
            // Add highlighted versions for search results
            highlightedName: highlightSearchTerms(result.name, q as string),
            highlightedDefinition: highlightSearchTerms(
              result.shortDefinition || result.definition?.substring(0, 200) || '',
              q as string
            ),
            searchQuery: q as string,
          })),
          total: searchResponse.total,
          page: searchResponse.page,
          limit: searchResponse.limit,
          hasMore: searchResponse.page < searchResponse.totalPages,
          query: q as string,
        };

        const response: ApiResponse<SearchResult> = {
          success: true,
          data: searchResult,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error performing search:', error);
        res.status(500).json({
          success: false,
          message: 'Search failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * Get autocomplete suggestions for search
   * GET /api/search/suggestions?q=query&limit=10
   */
  app.get('/api/search/suggestions', 
    validate.query(searchSchemas.suggest, { 
      sanitizeHtml: true 
    }),
    async (req: Request, res: Response) => {
    try {
      const { q: query, limit } = req.query as unknown;

      // Use optimized search for suggestions
      const termSuggestions = await optimizedSearchSuggestions(query, Math.min(limit - 3, 15));

      // Get category suggestions (using storage layer)
      // TODO: Add searchCategories(query, limit) method to enhancedStorage in Phase 2
      const allCategories = await storage.getCategories();
      const categorySuggestions = allCategories
        .filter(cat => cat.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(cat => ({ name: cat.name }));

      // Helper function to highlight search terms
      const highlightSearchTerms = (text: string, query: string): string => {
        if (!text || !query) {return text;}
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
      };

      // Combine suggestions in a more structured format with highlighting
      const allSuggestions = [
        ...termSuggestions.map(name => ({
          id: `term-${name}`,
          name,
          type: 'term',
          category: null,
          highlightedName: highlightSearchTerms(name, query),
        })),
        ...categorySuggestions.map((cat: any) => ({
          id: `category-${cat.name}`,
          name: cat.name,
          type: 'category',
          category: null,
          highlightedName: highlightSearchTerms(cat.name, query),
        })),
      ];

      res.json(allSuggestions.slice(0, limit));
    } catch (error) {
      logger.error('Error fetching search suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
  });

  /**
   * Fuzzy search endpoint for handling typos and partial matches
   * GET /api/search/fuzzy?q=query&threshold=0.3&limit=20
   */
  app.get('/api/search/fuzzy', 
    validate.query(z.object({
      q: z.string().min(1).max(500),
      threshold: z.coerce.number().min(0).max(1).default(0.3),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      page: z.coerce.number().int().min(1).default(1)
    }), { sanitizeHtml: true }),
    async (req: Request, res: Response) => {
    try {
      const {
        q,
        limit,
        page,
        threshold
      } = req.query as unknown;

      // Use same basic search as main endpoint
      const searchResults = await db
        .select({
          id: terms.id,
          name: terms.name,
          definition: terms.fullDefinition,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          mainCategories: terms.mainCategories,
        })
        .from(terms)
        .where(or(ilike(terms.name, `%${q.trim()}%`), ilike(terms.fullDefinition, `%${q.trim()}%`)))
        .orderBy(desc(terms.viewCount), asc(terms.name))
        .limit(100);

      const transformedResults = searchResults.map(result => ({
        id: result.id || '',
        name: result.name || '',
        definition: result.definition || '',
        shortDefinition: result.shortDefinition || undefined,
        viewCount: result.viewCount || 0,
        relevanceScore: 1, // Basic relevance score
        category:
          result.mainCategories && result.mainCategories.length > 0
            ? result.mainCategories[0]
            : 'General',
        createdAt: new Date(),
        updatedAt: new Date(),
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
          threshold: threshold,
        },
      });
    } catch (error) {
      logger.error('Error in fuzzy search:', error);
      res.status(500).json({
        success: false,
        message: 'Fuzzy search failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Popular search terms
  app.get('/api/search/popular', 
    validate.query(z.object({
      limit: z.coerce.number().int().min(1).max(50).default(10)
    })),
    async (req: Request, res: Response) => {
    try {
      const { limit } = req.query as unknown;

      // Use optimized popular terms for better performance
      const popularTerms = await getOptimizedPopularTerms(limit);

      res.json({
        success: true,
        data: popularTerms,
      });
    } catch (error) {
      logger.error('Error fetching popular search terms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular search terms',
      });
    }
  });

  // Search filters metadata
  app.get('/api/search/filters', async (_req: Request, res: Response) => {
    try {
      const filters = await storage.getSearchFilters();

      res.json({
        success: true,
        data: filters,
      });
    } catch (error) {
      logger.error('Error fetching search filters:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch search filters',
      });
    }
  });

  // Advanced search endpoint
  app.post('/api/search/advanced', 
    validate.body(z.object({
      query: z.string().optional(),
      filters: z.object({
        categories: z.array(z.string()).optional(),
        difficulty: z.array(z.enum(['beginner', 'intermediate', 'advanced'])).optional(),
        hasImplementation: z.boolean().optional(),
        hasInteractive: z.boolean().optional(),
        dateRange: z.object({
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional()
        }).optional()
      }).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      sort: z.enum(['relevance', 'name', 'popularity', 'recent']).default('relevance')
    }), { sanitizeHtml: true, logErrors: true }),
    async (req: Request, res: Response) => {
    try {
      const { query, filters, page, limit, sort } = req.body;

      const searchResult = await storage.advancedSearch({
        query: query?.trim(),
        filters,
        page: page,
        limit: limit,
        sortBy: sort,
      });

      res.json({
        success: true,
        data: searchResult,
      });
    } catch (error) {
      logger.error('Error performing advanced search:', error);
      res.status(500).json({
        success: false,
        message: 'Advanced search failed',
      });
    }
  });
}
