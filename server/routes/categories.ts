import type { Express, Request, Response } from 'express';
import type { ApiResponse, ICategory, ITerm, PaginatedResponse } from '../../shared/types';
import { optimizedStorage as storage } from '../optimizedStorage';
import { log } from '../utils/logger';

/**
 * Category management routes
 */
export function registerCategoryRoutes(app: Express): void {
  // Get all categories with pagination and field selection
  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 100,
        search,
        fields = 'id,name,description,termCount',
        includeStats = false,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 500); // Max 500 items per page
      const offset = (pageNum - 1) * limitNum;
      const fieldList = (fields as string).split(',').map((f) => f.trim());

      // Get categories with optimized field selection
      let categories: any[] = [];
      let totalCount = 0;

      try {
        categories = await storage.getCategoriesOptimized({
          offset,
          limit: limitNum,
          fields: fieldList,
          search: search as string,
          includeStats: includeStats === 'true',
        });

        // Get total count for pagination
        totalCount = await storage.getCategoriesCount({
          search: search as string,
        });
      } catch (dbError) {
        // Log the database error for debugging
        log.warn('Database query failed, returning empty result', {
          error: dbError,
          component: 'CategoryRoutes',
          query: 'getCategoriesOptimized',
        });

        // Return empty result set instead of error for empty database
        categories = [];
        totalCount = 0;
      }

      const response = {
        success: true,
        data: categories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          hasMore: offset + categories.length < totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      };

      // Set cache headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        ETag: `"categories-${pageNum}-${limitNum}-${fields}"`,
      });

      res.json(response);
    } catch (error) {
      log.error('Error fetching categories', { error, component: 'CategoryRoutes' });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get category by ID
  app.get('/api/categories/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { includeTerms = false } = req.query;

      let category = null;

      try {
        category = await storage.getCategoryById(id);
      } catch (dbError) {
        log.warn('Database query failed for category by ID', {
          error: dbError,
          component: 'CategoryRoutes',
          categoryId: id,
          query: 'getCategoryById',
        });

        // Return 404 for database errors on single category lookup
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      const response: ApiResponse<ICategory> = {
        success: true,
        data: category,
      };

      res.json(response);
    } catch (error) {
      log.error(`Error fetching category ${req.params.id}`, {
        error,
        component: 'CategoryRoutes',
        categoryId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category',
      });
    }
  });

  // Get terms by category with optimized pagination
  app.get('/api/categories/:id/terms', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 50,
        sort = 'name',
        order = 'asc',
        fields = 'id,name,shortDefinition,viewCount',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 items per page
      const offset = (pageNum - 1) * limitNum;
      const fieldList = (fields as string).split(',').map((f) => f.trim());

      // Use optimized database query with field selection
      let result = { data: [], total: 0 };

      try {
        result = await storage.getTermsByCategory(id, {
          offset,
          limit: limitNum,
          sort: sort as string,
          order: order as 'asc' | 'desc',
          fields: fieldList,
        });
      } catch (dbError) {
        log.warn('Database query failed for terms by category', {
          error: dbError,
          component: 'CategoryRoutes',
          categoryId: id,
          query: 'getTermsByCategory',
        });

        // Return empty result set instead of error for empty database
        result = { data: [], total: 0 };
      }

      const response: PaginatedResponse<any> = {
        data: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        hasMore: offset + result.data.length < result.total,
      };

      // Set cache headers
      res.set({
        'Cache-Control': 'public, max-age=300',
        ETag: `"cat-${id}-terms-${pageNum}-${limitNum}-${sort}-${order}"`,
      });

      res.json({
        success: true,
        ...response,
      });
    } catch (error) {
      log.error(`Error fetching terms for category ${req.params.id}`, {
        error,
        component: 'CategoryRoutes',
        categoryId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category terms',
      });
    }
  });

  // Get category statistics
  app.get('/api/categories/:id/stats', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Use efficient database query instead of fetching all terms
      let stats = null;

      try {
        // Try to use optimized method if available
        if (typeof storage.getCategoryStats === 'function') {
          stats = await storage.getCategoryStats(id);

          res.json({
            success: true,
            data: stats,
          });
          return;
        }
      } catch (optimizedError) {
        log.warn('Optimized getCategoryStats failed, using fallback', {
          error: optimizedError,
          component: 'CategoryRoutes',
        });
      }

      // Fallback: Use search to get category terms efficiently
      try {
        const searchResults = await storage.searchTerms(`category:${id}`);

        stats = {
          totalTerms: searchResults.length,
          avgViewCount:
            searchResults.length > 0
              ? Math.round(
                  searchResults.reduce(
                    (sum: number, term: ITerm) => sum + (term.viewCount || 0),
                    0
                  ) / searchResults.length
                )
              : 0,
          lastUpdated: new Date(),
        };

        res.json({
          success: true,
          data: stats,
        });
      } catch (searchError) {
        log.warn('Search fallback failed, using basic approach', {
          error: searchError,
          component: 'CategoryRoutes',
        });

        // Last fallback: check if category exists first
        let category = null;
        try {
          category = await storage.getCategoryById(id);
        } catch (categoryError) {
          log.warn('Category lookup failed', {
            error: categoryError,
            component: 'CategoryRoutes',
            categoryId: id,
          });
        }

        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found',
          });
        }

        stats = {
          totalTerms: 0,
          avgViewCount: 0,
          lastUpdated: new Date(),
          message: 'Category found but stats calculation method needs implementation',
        };

        res.json({
          success: true,
          data: stats,
        });
      }
    } catch (error) {
      log.error(`Error fetching category stats ${req.params.id}`, {
        error,
        component: 'CategoryRoutes',
        categoryId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category statistics',
      });
    }
  });
}
