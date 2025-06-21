import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import type { ICategory, ApiResponse, PaginatedResponse } from "../../shared/types";

/**
 * Category management routes
 */
export function registerCategoryRoutes(app: Express): void {
  
  // Get all categories
  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, search } = req.query;
      
      const categories = await storage.getCategories({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string
      });
      
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
      
      const category = await storage.getCategoryById(id, {
        includeTerms: includeTerms === 'true'
      });
      
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
      
      const result = await storage.getTermsByCategory(id, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string
      });
      
      const response: PaginatedResponse<any> = {
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
      const stats = await storage.getCategoryStats(id);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error(`Error fetching category stats ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch category statistics" 
      });
    }
  });
}