import { Router, Request, Response, Express } from "express";
import { db } from "../../db";
import { terms, categories, users } from "../../../shared/schema";
import { eq, desc, sql, and, gte, or, like } from "drizzle-orm";
import { requireAdmin } from "../../middleware/adminAuth";
import { ZodError } from "zod";
import type { ApiResponse } from "../../../shared/types";
import { errorLogger, ErrorCategory } from "../../middleware/errorHandler";
import { log as logger } from "../../utils/logger";

const adminContentRouter = Router();

// Admin-only middleware
adminContentRouter.use(requireAdmin);

// Get admin dashboard overview
adminContentRouter.get("/dashboard", async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get counts
    const [termCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(terms);
    
    const [categoryCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories);
    
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const feedbackResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM user_feedback WHERE status = 'pending'`
    );
    const feedbackCount = feedbackResult.rows[0] || { count: 0 };

    // Recent activity
    const recentTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt
      })
      .from(terms)
      .orderBy(desc(terms.updatedAt))
      .limit(10);

    const recentFeedback = await db.execute(
      sql`
        SELECT f.id, f.type, f.message as content, f.created_at,
               u.id as user_id, u.email, u.first_name, u.last_name
        FROM user_feedback f
        LEFT JOIN users u ON f.user_id = u.id
        WHERE f.status = 'pending'
        ORDER BY f.created_at DESC
        LIMIT 10
      `
    );

    // Growth metrics
    const [weeklyGrowth] = await db
      .select({ count: sql<number>`count(*)` })
      .from(terms)
      .where(gte(terms.createdAt, lastWeek));

    const [monthlyGrowth] = await db
      .select({ count: sql<number>`count(*)` })
      .from(terms)
      .where(gte(terms.createdAt, lastMonth));

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

    // Apply filters
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(terms.name, `%${search}%`),
          like(terms.definition, `%${search}%`)
        )
      );
    }
    if (categoryId) {
      conditions.push(eq(terms.categoryId, String(categoryId)));
    }

    // Apply sorting
    const sortColumn = sortBy === 'name' ? terms.name : 
                      sortBy === 'viewCount' ? terms.viewCount :
                      sortBy === 'createdAt' ? terms.createdAt :
                      terms.updatedAt;

    // Build query with all conditions at once  
    const baseQuery = db.select({
      id: terms.id,
      name: terms.name,
      definition: terms.definition,
      shortDefinition: terms.shortDefinition,
      categoryId: terms.categoryId,
      category: categories.name,
      viewCount: terms.viewCount,
      createdAt: terms.createdAt,
      updatedAt: terms.updatedAt
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id));

    // Build final query with all parts
    const finalQuery = baseQuery
      .$dynamic()
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sortOrder === 'asc' ? sql`${sortColumn} ASC` : desc(sortColumn))
      .limit(Number(limit))
      .offset(offset);

    // Execute paginated query
    const results = await finalQuery;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(terms)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      success: true,
      data: {
        terms: results,
        pagination: {
          total: Number(countResult.count),
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(Number(countResult.count) / Number(limit))
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

    await db.delete(terms).where(eq(terms.id, String(id)));

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
      case 'delete':
        await db.delete(terms).where(sql`${terms.id} = ANY(${termIds})`);
        break;
      
      case 'updateCategory':
        // Use raw SQL for bulk category update to avoid type issues
        await db.execute(sql`
          UPDATE terms 
          SET category_id = ${data.categoryId}, updated_at = NOW()
          WHERE id = ANY(${termIds})
        `);
        break;
      
      case 'publish':
        // For future use when we have draft/published states
        break;
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

    const feedbackItems = await db.execute(
      sql`
        SELECT f.id, f.type, f.message as content, f.term_id, f.status, f.created_at,
               u.id as user_id, u.email, u.first_name, u.last_name,
               t.id as term_id, t.name as term_name
        FROM user_feedback f
        LEFT JOIN users u ON f.user_id = u.id
        LEFT JOIN terms t ON f.term_id = t.id
        WHERE f.status = ${status}
        ORDER BY f.created_at DESC
        LIMIT ${Number(limit)} OFFSET ${offset}
      `
    );

    const countQuery = await db.execute(
      sql`SELECT COUNT(*) as count FROM user_feedback WHERE status = ${status}`
    );
    const countResult = countQuery.rows[0] || { count: 0 };

    res.json({
      success: true,
      data: {
        feedback: feedbackItems,
        pagination: {
          total: Number((countResult as any)?.count || 0),
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(Number((countResult as any)?.count || 0) / Number(limit))
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

    const updatedFeedback = await db.execute(
      sql`
        UPDATE user_feedback 
        SET status = ${status}, admin_notes = ${adminNotes}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    );

    res.json({
      success: true,
      data: updatedFeedback.rows[0]
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
    const categoryList = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        termCount: sql<number>`count(${terms.id})`,
        createdAt: categories.createdAt
      })
      .from(categories)
      .leftJoin(terms, eq(categories.id, terms.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.name);

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
    const [termCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(terms)
      .where(eq(terms.categoryId, String(id)));

    if (Number(termCount.count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing terms. Please reassign or delete terms first.'
      });
    }

    await db.delete(categories).where(eq(categories.id, String(id)));

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