import type { Express, Request, Response } from 'express'
import type { Request, Response } from 'express';
import type { ApiResponse, PaginatedResponse } from '@aiglossarypro/shared/types';
import { optimizedStorage as storage } from '../optimizedStorage';
import { log } from '../utils/logger';

/**
 * Subcategory management routes
 */
export function registerSubcategoryRoutes(app: Express): void {
  // Get all subcategories with pagination and field selection
  app.get('/api/subcategories', async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 100,
        search,
        categoryId,
        fields = 'id,name,categoryId,termCount',
        includeStats = false,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 500); // Max 500 items per page
      const offset = (pageNum - 1) * limitNum;
      const fieldList = (fields as string).split(',').map(f => f.trim());

      // Get subcategories with basic query first to test
      const subcategories = await storage.getSubcategoriesOptimized({
        offset,
        limit: limitNum,
        fields: fieldList,
        search: search as string,
        categoryId: categoryId as string,
        includeStats: false, // Disable stats for now to test basic functionality
      });

      // Get total count for pagination
      const totalCount = await storage.getSubcategoriesCount({
        search: search as string,
        categoryId: categoryId as string,
      });

      const response = {
        success: true,
        data: subcategories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          hasMore: offset + subcategories.length < totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      };

      // Set cache headers for better performance
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        ETag: `"subcategories-${pageNum}-${limitNum}-${fields}"`,
      });

      res.json(response);
    } catch (error) {
      log.error('Error fetching subcategories', { error, component: 'SubcategoryRoutes' });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subcategories',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get subcategory by ID
  app.get('/api/subcategories/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { includeTerms = false } = req.query;

      const subcategory = await storage.getSubcategoryById(id);

      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found',
        });
      }

      const response: ApiResponse<any> = {
        success: true,
        data: subcategory,
      };

      res.json(response);
    } catch (error) {
      log.error(`Error fetching subcategory ${req.params.id}`, {
        error,
        component: 'SubcategoryRoutes',
        subcategoryId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subcategory',
      });
    }
  });

  // Get terms by subcategory with optimized pagination
  app.get('/api/subcategories/:id/terms', async (req: Request, res: Response) => {
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
      const fieldList = (fields as string).split(',').map(f => f.trim());

      // Use optimized database query with field selection
      const result = await storage.getTermsBySubcategory(id, {
        offset,
        limit: limitNum,
        sort: sort as string,
        order: order as 'asc' | 'desc',
        fields: fieldList,
      });

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
        ETag: `"subcat-${id}-terms-${pageNum}-${limitNum}-${sort}-${order}"`,
      });

      res.json({
        success: true,
        ...response,
      });
    } catch (error) {
      log.error(`Error fetching terms for subcategory ${req.params.id}`, {
        error,
        component: 'SubcategoryRoutes',
        subcategoryId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subcategory terms',
      });
    }
  });

  // Get subcategories by category
  app.get('/api/categories/:categoryId/subcategories', async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 100, search, fields = 'id,name,termCount' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 500);
      const offset = (pageNum - 1) * limitNum;
      const fieldList = (fields as string).split(',').map(f => f.trim());

      const subcategories = await storage.getSubcategoriesOptimized({
        offset,
        limit: limitNum,
        fields: fieldList,
        search: search as string,
        categoryId: categoryId,
        includeStats: true,
      });

      const totalCount = await storage.getSubcategoriesCount({
        search: search as string,
        categoryId: categoryId,
      });

      const response = {
        success: true,
        data: subcategories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          hasMore: offset + subcategories.length < totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      };

      res.set({
        'Cache-Control': 'public, max-age=300',
        ETag: `"cat-${categoryId}-subcats-${pageNum}-${limitNum}"`,
      });

      res.json(response);
    } catch (error) {
      log.error(`Error fetching subcategories for category ${req.params.categoryId}`, {
        error,
        component: 'SubcategoryRoutes',
        categoryId: req.params.categoryId,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category subcategories',
      });
    }
  });
}
