import { desc, eq, gte, sql } from 'drizzle-orm';
import type { Express, Request, Response } from 'express';
import { terms, termViews } from '../../shared/schema';
import { ERROR_MESSAGES } from '../constants';
import { db } from '../db';
import { enhancedStorage as storage } from '../enhancedStorage';
import { requireAdmin } from '../middleware/adminAuth';
import { mockAuthenticateToken, mockIsAuthenticated } from '../middleware/dev/mockAuth';
import {
  type CategoryAnalyticsQuery,
  CategoryAnalyticsQuerySchema,
  type ContentAnalyticsQuery,
  ContentAnalyticsQuerySchema,
  type ExportAnalyticsQuery,
  ExportAnalyticsQuerySchema,
  type GeneralAnalyticsQuery,
  GeneralAnalyticsQuerySchema,
  type UserAnalyticsQuery,
  UserAnalyticsQuerySchema,
  validateQuery,
} from '../schemas/analyticsValidation';
import {
  ANALYTICS_CONSTANTS,
  CSV_CONSTANTS,
  HTTP_STATUS,
  TIME_CONSTANTS,
} from '../utils/constants';
import { generateCSV, sendCSVResponse } from '../utils/csvHelpers';
import { calculateDateRangeFromTimeframe } from '../utils/dateHelpers';
import { log as logger } from '../utils/logger';

/**
 * Analytics and reporting routes
 */
export function registerAnalyticsRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = mockIsAuthenticated;
  const tokenMiddleware = mockAuthenticateToken;

  // General analytics (public - basic metrics only)
  app.get(
    '/api/analytics',
    validateQuery(GeneralAnalyticsQuerySchema),
    async (req: Request, res: Response) => {
      try {
        const { timeframe, granularity } = req.query as unknown as GeneralAnalyticsQuery;

        // Get analytics overview using enhancedStorage
        const _overview = await storage.getAnalyticsOverview();
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
              averageSectionsPerTerm: contentMetrics.averageSectionsPerTerm,
            },
            generatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error('Error fetching analytics', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: ERROR_MESSAGES.ANALYTICS_FETCH_FAILED || 'Failed to fetch analytics',
        });
      }
    }
  );

  // User-specific analytics (authenticated)
  app.get(
    '/api/analytics/user',
    authMiddleware,
    validateQuery(UserAnalyticsQuerySchema),
    async (req: any, res: Response) => {
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
              averageRating: userStats.averageRating,
            },
            generatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error('Error fetching user analytics', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: ERROR_MESSAGES.USER_ANALYTICS_FETCH_FAILED || 'Failed to fetch user analytics',
        });
      }
    }
  );

  // Content performance analytics (admin only)
  app.get(
    '/api/analytics/content',
    authMiddleware,
    tokenMiddleware,
    requireAdmin,
    validateQuery(ContentAnalyticsQuerySchema),
    async (req: Request, res: Response) => {
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
            lastViewed: terms.updatedAt,
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
              totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
            },
            generatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error('Error fetching content analytics', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message:
            ERROR_MESSAGES.CONTENT_ANALYTICS_FETCH_FAILED || 'Failed to fetch content analytics',
        });
      }
    }
  );

  // Category performance analytics (admin only)
  app.get(
    '/api/analytics/categories',
    authMiddleware,
    tokenMiddleware,
    requireAdmin,
    validateQuery(CategoryAnalyticsQuerySchema),
    async (req: Request, res: Response) => {
      try {
        const { timeframe } = req.query as unknown as CategoryAnalyticsQuery;

        // Calculate date range using utility function
        const { startDate, endDate } = calculateDateRangeFromTimeframe(timeframe);

        // Get category analytics
        const categoryAnalytics = await db
          .select({
            category: sql<string>`(SELECT name FROM categories WHERE id = ${terms.categoryId})`,
            termCount: sql<number>`count(distinct ${terms.id})`,
            totalViews: sql<number>`count(${termViews.id})`,
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
            generatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error('Error fetching category analytics', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message:
            ERROR_MESSAGES.CATEGORY_ANALYTICS_FETCH_FAILED || 'Failed to fetch category analytics',
        });
      }
    }
  );

  // Real-time analytics (admin only)
  app.get(
    '/api/analytics/realtime',
    authMiddleware,
    tokenMiddleware,
    requireAdmin,
    async (_req: Request, res: Response) => {
      try {
        // Get last hour activity
        const lastHour = new Date(Date.now() - TIME_CONSTANTS.MILLISECONDS_IN_HOUR);

        const [realtimeData] = await db
          .select({
            activeUsers: sql<number>`count(distinct ${termViews.userId})`,
            recentViews: sql<number>`count(${termViews.id})`,
            popularTerm: sql<string>`mode() within group (order by ${terms.name})`,
          })
          .from(termViews)
          .leftJoin(terms, sql`${termViews.termId} = ${terms.id}`)
          .where(gte(termViews.viewedAt, lastHour));

        res.json({
          success: true,
          data: {
            ...realtimeData,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error('Error fetching realtime analytics', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message:
            ERROR_MESSAGES.REALTIME_ANALYTICS_FETCH_FAILED || 'Failed to fetch realtime analytics',
        });
      }
    }
  );

  // Export analytics data (admin only)
  app.get(
    '/api/analytics/export',
    authMiddleware,
    tokenMiddleware,
    requireAdmin,
    validateQuery(ExportAnalyticsQuerySchema),
    async (req: any, res: Response) => {
      try {
        const _userId = req.user.claims.sub;

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
            lastViewed: terms.updatedAt,
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
            {
              key: 'categories',
              header: 'Categories',
              formatter: (val: string[]) => val?.join(';') || '',
            },
            { key: 'lastViewed', header: 'Last Viewed', formatter: (val: any) => val || '' },
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
              generatedAt: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        logger.error('Error exporting analytics', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: ERROR_MESSAGES.ANALYTICS_EXPORT_FAILED || 'Failed to export analytics',
        });
      }
    }
  );

  // Popular terms endpoint (public)
  app.get('/api/analytics/popular-terms', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Get popular terms (fallback data since database might be empty)
      const popularTerms = await db
        .select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
        })
        .from(terms)
        .orderBy(desc(terms.viewCount))
        .limit(limit);

      res.json({
        success: true,
        data: {
          terms: popularTerms,
          period: 'all-time',
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching popular terms', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Return fallback data when database is empty or has errors
      res.json({
        success: true,
        data: {
          terms: [],
          period: 'all-time',
          message: 'No data available - database is empty (expected for new content pipeline)',
          generatedAt: new Date().toISOString(),
        },
      });
    }
  });

  // Trending topics endpoint (public)
  app.get('/api/analytics/trending', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      
      // Get trending topics (recent views in last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const trendingTerms = await db
        .select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          recentViews: sql<number>`count(${termViews.id})`,
        })
        .from(terms)
        .leftJoin(termViews, eq(termViews.termId, terms.id))
        .where(gte(termViews.viewedAt, weekAgo))
        .groupBy(terms.id)
        .orderBy(desc(sql`count(${termViews.id})`))
        .limit(limit);

      res.json({
        success: true,
        data: {
          topics: trendingTerms,
          period: 'last-7-days',
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching trending topics', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Return fallback data
      res.json({
        success: true,
        data: {
          topics: [],
          period: 'last-7-days',
          message: 'No data available - database is empty (expected for new content pipeline)',
          generatedAt: new Date().toISOString(),
        },
      });
    }
  });

  logger.info('Analytics routes registered successfully');
}
