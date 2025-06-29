import { Router, Request, Response, Express } from "express";
import { enhancedStorage as storage } from "../../enhancedStorage";
import { requireAdmin } from "../../middleware/adminAuth";
import { ZodError } from "zod";
import type { ApiResponse } from "../../../shared/types";
import { errorLogger, ErrorCategory } from "../../middleware/errorHandler";
import { log as logger } from "../../utils/logger";
import { BULK_ACTIONS } from "../../constants";
import { db } from "../../db";
import { terms } from "../../../shared/schema";
import { eq } from "drizzle-orm";

const adminContentRouter = Router();

// Admin-only middleware
adminContentRouter.use(requireAdmin);

// Get admin dashboard overview
adminContentRouter.get("/dashboard", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get counts using enhanced storage
    const adminStats = await storage.getAdminStats();
    const termCount = { count: adminStats.termCount || 0 };
    const categoryCount = { count: adminStats.categoryCount || 0 };
    const userCount = { count: adminStats.userCount || 0 };
    const feedbackCount = { count: adminStats.pendingFeedback || 0 };

    // Recent activity using enhanced storage
    const recentTerms = await storage.getRecentTerms(10);
    const recentFeedback = await storage.getRecentFeedback(10);

    // Growth metrics
    const weeklyGrowth = { count: adminStats.weeklyGrowth || 0 };
    const monthlyGrowth = { count: adminStats.monthlyGrowth || 0 };

    res.json({
      success: true,
      data: {
        stats: {
          totalTerms: Number(termCount.count),
          totalCategories: Number(categoryCount.count),
          totalUsers: Number(userCount.count),
          pendingFeedback: Number((feedbackCount as any)?.count || 0),
          weeklyNewTerms: Number(weeklyGrowth.count),
          monthlyNewTerms: Number(monthlyGrowth.count)
        },
        recentActivity: {
          terms: recentTerms,
          feedback: recentFeedback
        }
      }
    });
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Content management - List all terms with filters
adminContentRouter.get("/terms", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { 
      search, 
      categoryId, 
      status, 
      sortBy = 'updatedAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 20 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Use enhanced storage method
    const result = await storage.getAllTerms({
      limit: Number(limit),
      offset,
      categoryId: categoryId ? String(categoryId) : undefined,
      searchTerm: search ? String(search) : undefined,
      sortBy: String(sortBy),
      sortOrder: String(sortOrder) as 'asc' | 'desc'
    });

    res.json({
      success: true,
      data: {
        terms: result.terms,
        pagination: {
          total: result.total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(result.total / Number(limit))
        }
      }
    });
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch terms'
    });
  }
});

// Create or update term
adminContentRouter.post("/terms/:id?", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const termData = req.body;

    if (id) {
      // Update existing term
      const [updatedTerm] = await db
        .update(terms)
        .set({
          ...termData,
          updatedAt: new Date()
        })
        .where(eq(terms.id, String(id)))
        .returning();

      res.json({
        success: true,
        data: updatedTerm
      });
    } else {
      // Create new term
      const [newTerm] = await db
        .insert(terms)
        .values({
          ...termData,
          createdAt: new Date(),
          updatedAt: new Date(),
          viewCount: 0
        })
        .returning();

      res.json({
        success: true,
        data: newTerm
      });
    }
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: error instanceof ZodError ? JSON.stringify(error.errors) : 'Failed to save term'
    });
  }
});

// Delete term
adminContentRouter.delete("/terms/:id", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;

    await storage.deleteTerm(String(id));

    res.json({
      success: true,
      data: { message: 'Term deleted successfully' }
    });
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: 'Failed to delete term'
    });
  }
});

// Bulk operations
adminContentRouter.post("/terms/bulk", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { action, termIds, data } = req.body;

    switch (action) {
      case BULK_ACTIONS.DELETE:
        await storage.bulkDeleteTerms(termIds);
        break;
      
      case BULK_ACTIONS.UPDATE_CATEGORY:
        await storage.bulkUpdateTermCategory(termIds, data.categoryId);
        break;
      
      case BULK_ACTIONS.UPDATE_STATUS:
        // For future use when we have draft/published states
        await storage.bulkUpdateTermStatus(termIds, data.status);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid bulk action. Valid actions: ${Object.values(BULK_ACTIONS).join(', ')}`
        });
    }

    res.json({
      success: true,
      data: { message: `Bulk ${action} completed successfully` }
    });
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk operation'
    });
  }
});

// Feedback moderation
adminContentRouter.get("/feedback", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const feedbackResult = await storage.getFeedback(
      { status: status as string },
      { limit: Number(limit), offset: offset }
    );

    res.json({
      success: true,
      data: {
        feedback: feedbackResult.feedback,
        pagination: {
          total: feedbackResult.total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(feedbackResult.total / Number(limit))
        }
      }
    });
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

// Update feedback status
adminContentRouter.patch("/feedback/:id", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updatedFeedback = await storage.updateFeedback(id, {
      status,
      adminNotes
    });

    res.json({
      success: true,
      data: updatedFeedback
    });
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback'
    });
  }
});

// Category management
adminContentRouter.get("/categories", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const categoryList = await storage.getCategoriesWithStats();

    res.json({
      success: true,
      data: categoryList
    });
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Create or update category
adminContentRouter.post("/categories/:id?", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;

    if (id) {
      const [updated] = await db
        .update(categories)
        .set(categoryData)
        .where(eq(categories.id, String(id)))
        .returning();

      res.json({
        success: true,
        data: updated
      });
    } else {
      const [created] = await db
        .insert(categories)
        .values({
          ...categoryData,
          createdAt: new Date()
        })
        .returning();

      res.json({
        success: true,
        data: created
      });
    }
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: 'Failed to save category'
    });
  }
});

// Delete category
adminContentRouter.delete("/categories/:id", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;

    // Check if category has terms
    const categoryStats = await storage.getCategoryStats(String(id));
    
    if (categoryStats.termCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing terms. Please reassign or delete terms first.'
      });
    }

    await storage.deleteCategory(String(id));

    res.json({
      success: true,
      data: { message: 'Category deleted successfully' }
    });
  } catch (error) {
    await errorLogger.logError(error, req, ErrorCategory.DATABASE, 'medium');
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

// Register content management routes
export function registerAdminContentRoutes(app: Express): void {
  app.use('/api/admin/content', adminContentRouter);
  logger.info('✅ Admin content management routes registered');
}

export { adminContentRouter }; 