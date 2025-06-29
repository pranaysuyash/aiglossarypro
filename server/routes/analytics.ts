import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { requireAdmin, authenticateToken } from "../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../middleware/dev/mockAuth";
import { features } from "../config";
import { enhancedStorage as storage } from "../enhancedStorage";
import { log as logger } from "../utils/logger";
import { ERROR_MESSAGES } from "../constants";
import { TIME_CONSTANTS, CSV_CONSTANTS, ANALYTICS_CONSTANTS, HTTP_STATUS, TIME_CONSTANTS as TIME_PERIODS } from "../utils/constants";
import { calculateDateRange, calculateDateRangeFromTimeframe } from "../utils/dateHelpers";
import { generateCSV, sendCSVResponse } from "../utils/csvHelpers";
import { db } from "../db";
import { terms, termViews, categories } from "../../shared/schema";
import { eq, gte, desc, sql } from "drizzle-orm";
import {
  validateQuery,
  GeneralAnalyticsQuerySchema,
  UserAnalyticsQuerySchema,
  ContentAnalyticsQuerySchema,
  CategoryAnalyticsQuerySchema,
  ExportAnalyticsQuerySchema,
  type GeneralAnalyticsQuery,
  type UserAnalyticsQuery,
  type ContentAnalyticsQuery,
  type CategoryAnalyticsQuery,
  type ExportAnalyticsQuery
} from '../schemas/analyticsValidation';

/**
 * Analytics and reporting routes
 */
export function registerAnalyticsRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  const tokenMiddleware = features.replitAuthEnabled ? authenticateToken : mockAuthenticateToken;
  
  // General analytics (public - basic metrics only)
  app.get('/api/analytics', validateQuery(GeneralAnalyticsQuerySchema), async (req: Request, res: Response) => {
    try {
      const { timeframe, granularity } = req.query as unknown as GeneralAnalyticsQuery;
      
      // Get analytics overview using enhancedStorage
      const overview = await storage.getAnalyticsOverview();
      const contentMetrics = await storage.getContentMetrics();
      
      res.json({
        success: true,
        data: {
          timeframe,
          granularity,
          metrics: {
            totalTerms: contentMetrics.totalTerms,
            totalViews: contentMetrics.totalViews || 0,
            totalCategories: contentMetrics.totalCategories,
            averageSectionsPerTerm: contentMetrics.averageSectionsPerTerm
          },
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error("Error fetching analytics", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        message: ERROR_MESSAGES.ANALYTICS_FETCH_FAILED || "Failed to fetch analytics" 
      });
    }
  });

  // User-specific analytics (authenticated)
  app.get('/api/analytics/user', authMiddleware, validateQuery(UserAnalyticsQuerySchema), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { timeframe } = req.query as unknown as UserAnalyticsQuery;
      
      // Get user progress stats using enhancedStorage
      const userStats = await storage.getUserProgressStats(userId);
      const timeSpent = await storage.getUserTimeSpent(userId, timeframe);
      
      res.json({
        success: true,
        data: {
          timeframe,
          metrics: {
            totalViews: userStats.totalTermsViewed,
            favoritesCount: userStats.favoriteTerms,
            progressCount: userStats.completedSections,
            timeSpent: timeSpent,
            streakDays: userStats.streakDays,
            averageRating: userStats.averageRating
          },
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error("Error fetching user analytics", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        message: ERROR_MESSAGES.USER_ANALYTICS_FETCH_FAILED || "Failed to fetch user analytics" 
      });
    }
  });

  // Content performance analytics (admin only)
  app.get('/api/analytics/content', authMiddleware, tokenMiddleware, requireAdmin, validateQuery(ContentAnalyticsQuerySchema), async (req: Request, res: Response) => {
    try {
      const { timeframe, limit, sort, page } = req.query as unknown as ContentAnalyticsQuery;
      
      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Calculate date range using utility function
      const { startDate, endDate } = calculateDateRangeFromTimeframe(timeframe);
      
      // Get content analytics
      const contentAnalytics = await db
        .select({
          id: terms.id,
          name: terms.name,
          mainCategories: terms.categoryId,
          totalViews: terms.viewCount,
          recentViews: sql<number>`count(${termViews.id})`,
          lastViewed: terms.updatedAt
        })
        .from(terms)
        .leftJoin(termViews, eq(termViews.termId, terms.id))
        .where(gte(termViews.viewedAt, startDate))
        .groupBy(terms.id)
        .orderBy(sort === 'views' ? desc(sql`count(${termViews.id})`) : desc(terms.name))
        .limit(limit)
        .offset(offset);
      
      // Get total count for pagination
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(terms)
        .leftJoin(termViews, eq(termViews.termId, terms.id))
        .where(gte(termViews.viewedAt, startDate));
        
      res.json({
        success: true,
        data: {
          timeframe,
          content: contentAnalytics,
          pagination: {
            page,
            limit,
            total: totalCount[0]?.count || 0,
            totalPages: Math.ceil((totalCount[0]?.count || 0) / limit)
          },
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error("Error fetching content analytics", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        message: ERROR_MESSAGES.CONTENT_ANALYTICS_FETCH_FAILED || "Failed to fetch content analytics" 
      });
    }
  });

  // Category performance analytics (admin only)
  app.get('/api/analytics/categories', authMiddleware, tokenMiddleware, requireAdmin, validateQuery(CategoryAnalyticsQuerySchema), async (req: Request, res: Response) => {
    try {
      const { timeframe } = req.query as unknown as CategoryAnalyticsQuery;
      
      // Calculate date range using utility function
      const { startDate, endDate } = calculateDateRangeFromTimeframe(timeframe);
      
      // Get category analytics
      const categoryAnalytics = await db
        .select({
          category: sql<string>`(SELECT name FROM categories WHERE id = ${terms.categoryId})`,
          termCount: sql<number>`count(distinct ${terms.id})`,
          totalViews: sql<number>`count(${termViews.id})`
        })
        .from(terms)
        .leftJoin(termViews, eq(termViews.termId, terms.id))
        .where(gte(termViews.viewedAt, startDate))
        .groupBy(terms.categoryId)
        .orderBy(desc(sql`count(${termViews.id})`))
        .limit(ANALYTICS_CONSTANTS.REALTIME_CATEGORY_LIMIT);
      
      res.json({
        success: true,
        data: {
          timeframe,
          categories: categoryAnalytics,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error("Error fetching category analytics", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: ERROR_MESSAGES.CATEGORY_ANALYTICS_FETCH_FAILED || "Failed to fetch category analytics" 
      });
    }
  });

  // Real-time analytics (admin only)
  app.get('/api/analytics/realtime', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      
      // Get last hour activity
      const lastHour = new Date(Date.now() - TIME_CONSTANTS.MILLISECONDS_IN_HOUR);
      
      const [realtimeData] = await db
        .select({
          activeUsers: sql<number>`count(distinct ${termViews.userId})`,
          recentViews: sql<number>`count(${termViews.id})`,
          popularTerm: sql<string>`mode() within group (order by ${terms.name})`
        })
        .from(termViews)
        .leftJoin(terms, sql`${termViews.termId} = ${terms.id}`)
        .where(gte(termViews.viewedAt, lastHour));
      
      res.json({
        success: true,
        data: {
          ...realtimeData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error("Error fetching realtime analytics", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: ERROR_MESSAGES.REALTIME_ANALYTICS_FETCH_FAILED || "Failed to fetch realtime analytics" 
      });
    }
  });

  // Export analytics data (admin only)
  app.get('/api/analytics/export', authMiddleware, tokenMiddleware, requireAdmin, validateQuery(ExportAnalyticsQuerySchema), async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const { format, timeframe, type } = req.query as unknown as ExportAnalyticsQuery;
      
      // Calculate date range using utility function
      const { startDate, endDate } = calculateDateRangeFromTimeframe(timeframe);
      
      // Get export data
      const exportData = await db
        .select({
          termName: terms.name,
          categories: terms.categoryId,
          totalViews: terms.viewCount,
          recentViews: sql<number>`count(${termViews.id})`,
          lastViewed: terms.updatedAt
        })
        .from(terms)
        .leftJoin(termViews, sql`${termViews.termId} = ${terms.id}`)
        .where(gte(termViews.viewedAt, startDate))
        .groupBy(terms.id)
        .orderBy(desc(sql`count(${termViews.id})`));
      
      // Set appropriate headers for download
      const filename = `analytics-${type}-${timeframe}.${format}`;
      
      if (format === 'csv') {
        // Generate CSV using utility function with centralized columns
        const columns = [
          ...CSV_CONSTANTS.ANALYTICS_COLUMNS,
          { key: 'categories', header: 'Categories', formatter: (val: string[]) => val?.join(';') || '' },
          { key: 'lastViewed', header: 'Last Viewed', formatter: (val: any) => val || '' }
        ];
        
        const csvData = generateCSV(exportData, columns);
        sendCSVResponse(res, csvData, filename);
      } else {
        res.setHeader('Content-Type', CSV_CONSTANTS.CONTENT_TYPE_JSON);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json({
          success: true,
          data: {
            timeframe,
            type,
            exportData,
            generatedAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      logger.error("Error exporting analytics", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: ERROR_MESSAGES.ANALYTICS_EXPORT_FAILED || "Failed to export analytics" 
      });
    }
  });

  logger.info("Analytics routes registered successfully");
}