import type { Express, Request, Response } from "express";
import { optimizedStorage as storage } from "../optimizedStorage";
import type { ICategory, ApiResponse, PaginatedResponse } from "../../shared/types";

/**
 * Category management routes
 */
export function registerCategoryRoutes(app: Express): void {
  
  // Get all categories
  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, search } = req.query;
      
      const categories = await storage.getCategories();
      
      const response: ApiResponse<ICategory[]> = {
        success: true,
        data: categories
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch categories",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get category by ID
  app.get('/api/categories/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { includeTerms = false } = req.query;
      
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ 
          success: false,
          message: "Category not found" 
        });
      }
      
      const response: ApiResponse<ICategory> = {
        success: true,
        data: category
      };
      
      res.json(response);
    } catch (error) {
      console.error(`Error fetching category ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch category" 
      });
    }
  });

  // Get terms by category
  app.get('/api/categories/:id/terms', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50, sort = 'name' } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      // Use efficient database query instead of fetching all terms
      try {
        // Try to use optimized method if available
        if (typeof storage.getTermsByCategory === 'function') {
          const result = await storage.getTermsByCategory(id, {
            offset,
            limit: limitNum,
            sort: sort as string
          });
          
          const response: PaginatedResponse<any> = {
            data: result.data,
            total: result.total,
            page: pageNum,
            limit: limitNum,
            hasMore: offset + result.data.length < result.total
          };
          
          res.json({
            success: true,
            ...response
          });
          return;
        }
      } catch (optimizedError) {
        console.warn('Optimized getTermsByCategory failed, using fallback:', optimizedError);
      }
      
      // Fallback: Use enhanced storage method
      try {
        const searchResults = await storage.searchTerms(`category:${id}`, limitNum, offset);
        
        const response: PaginatedResponse<any> = {
          data: searchResults.data,
          total: searchResults.total,
          page: pageNum, 
          limit: limitNum,
          hasMore: searchResults.hasMore
        };
        
        res.json({
          success: true,
          ...response
        });
      } catch (searchError) {
        console.warn('Search fallback failed, using basic approach:', searchError);
        
        // Last fallback: basic category filtering (not ideal but better than fetching all terms)
        const category = await storage.getCategoryById(id);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: "Category not found"
          });
        }
        
        // Return empty result rather than inefficient full fetch
        const response: PaginatedResponse<any> = {
          data: [],
          total: 0,
          page: pageNum,
          limit: limitNum,
          hasMore: false
        };
        
        res.json({
          success: true,
          ...response,
          message: "Category found but terms retrieval method needs implementation"
        });
      }
    } catch (error) {
      console.error(`Error fetching terms for category ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch category terms" 
      });
    }
  });

  // Get category statistics
  app.get('/api/categories/:id/stats', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Use efficient database query instead of fetching all terms
      try {
        // Try to use optimized method if available
        if (typeof storage.getCategoryStats === 'function') {
          const stats = await storage.getCategoryStats(id);
          
          res.json({
            success: true,
            data: stats
          });
          return;
        }
      } catch (optimizedError) {
        console.warn('Optimized getCategoryStats failed, using fallback:', optimizedError);
      }
      
      // Fallback: Use search to get category terms efficiently
      try {
        const searchResults = await storage.searchTerms(`category:${id}`, 1000, 0);
        
        const stats = {
          totalTerms: searchResults.total,
          avgViewCount: searchResults.data.length > 0 
            ? Math.round(searchResults.data.reduce((sum: number, term: ITerm) => sum + (term.viewCount || 0), 0) / searchResults.data.length)
            : 0,
          lastUpdated: new Date()
        };
        
        res.json({
          success: true,
          data: stats
        });
      } catch (searchError) {
        console.warn('Search fallback failed, using basic approach:', searchError);
        
        // Last fallback: return basic stats without fetching all terms
        const category = await storage.getCategoryById(id);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: "Category not found"
          });
        }
        
        const stats = {
          totalTerms: 0,
          avgViewCount: 0,
          lastUpdated: new Date(),
          message: "Category found but stats calculation method needs implementation"
        };
        
        res.json({
          success: true,
          data: stats
        });
      }
    } catch (error) {
      console.error(`Error fetching category stats ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch category statistics" 
      });
    }
  });
}