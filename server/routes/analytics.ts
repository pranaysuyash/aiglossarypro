import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import type { AuthenticatedRequest, AnalyticsData, ApiResponse } from "../../shared/types";

/**
 * Analytics and reporting routes
 */
export function registerAnalyticsRoutes(app: Express): void {
  
  // General analytics (public)
  app.get('/api/analytics', async (req: Request, res: Response) => {
    try {
      const { 
        timeframe = '30d',
        granularity = 'daily'
      } = req.query;
      
      const analytics = await storage.getAnalytics({
        timeframe: timeframe as string,
        granularity: granularity as string
      });
      
      const response: ApiResponse<AnalyticsData> = {
        success: true,
        data: analytics
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch analytics" 
      });
    }
  });

  // User-specific analytics (authenticated)
  app.get('/api/analytics/user', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { timeframe = '30d' } = req.query;
      
      const userAnalytics = await storage.getUserAnalytics(userId, {
        timeframe: timeframe as string
      });
      
      res.json({
        success: true,
        data: userAnalytics
      });
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user analytics" 
      });
    }
  });

  // Content performance analytics
  app.get('/api/analytics/content', async (req: Request, res: Response) => {
    try {
      const { 
        type = 'terms',
        timeframe = '30d',
        limit = 20,
        sort = 'views'
      } = req.query;
      
      const contentAnalytics = await storage.getContentAnalytics({
        type: type as string,
        timeframe: timeframe as string,
        limit: parseInt(limit as string),
        sortBy: sort as string
      });
      
      res.json({
        success: true,
        data: contentAnalytics
      });
    } catch (error) {
      console.error("Error fetching content analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch content analytics" 
      });
    }
  });

  // Search analytics
  app.get('/api/analytics/search', async (req: Request, res: Response) => {
    try {
      const { timeframe = '30d', limit = 50 } = req.query;
      
      const searchAnalytics = await storage.getSearchAnalytics({
        timeframe: timeframe as string,
        limit: parseInt(limit as string)
      });
      
      res.json({
        success: true,
        data: searchAnalytics
      });
    } catch (error) {
      console.error("Error fetching search analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch search analytics" 
      });
    }
  });

  // Category performance analytics
  app.get('/api/analytics/categories', async (req: Request, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      
      const categoryAnalytics = await storage.getCategoryAnalytics({
        timeframe: timeframe as string
      });
      
      res.json({
        success: true,
        data: categoryAnalytics
      });
    } catch (error) {
      console.error("Error fetching category analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch category analytics" 
      });
    }
  });

  // Real-time analytics
  app.get('/api/analytics/realtime', async (req: Request, res: Response) => {
    try {
      const realtimeData = await storage.getRealtimeAnalytics();
      
      res.json({
        success: true,
        data: realtimeData
      });
    } catch (error) {
      console.error("Error fetching realtime analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch realtime analytics" 
      });
    }
  });

  // Export analytics data
  app.get('/api/analytics/export', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role verification for full export
      
      const { 
        format = 'json',
        timeframe = '30d',
        type = 'summary'
      } = req.query;
      
      const exportData = await storage.exportAnalytics({
        format: format as string,
        timeframe: timeframe as string,
        type: type as string
      });
      
      // Set appropriate headers for download
      const filename = `analytics-${type}-${timeframe}.${format}`;
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (format === 'csv') {
        res.send(exportData);
      } else {
        res.json({
          success: true,
          data: exportData
        });
      }
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to export analytics" 
      });
    }
  });

  // Analytics dashboard data
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const dashboardData = await storage.getAnalyticsDashboard();
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error("Error fetching analytics dashboard:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch analytics dashboard" 
      });
    }
  });

  // Trending terms endpoint
  app.get('/api/analytics/trending', async (req: Request, res: Response) => {
    try {
      const { timeframe = '7d', limit = 10 } = req.query;
      
      // Parse timeframe
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { db } = await import('../db');
      const { enhancedTerms, termViews } = await import('../../shared/enhancedSchema');
      const { sql, gte, desc, eq } = await import('drizzle-orm');
      
      // Get trending terms based on recent view growth
      const trendingTerms = await db
        .select({
          id: enhancedTerms.id,
          name: enhancedTerms.name,
          category: enhancedTerms.category,
          totalViews: enhancedTerms.viewCount,
          recentViews: sql<number>`count(${termViews.id})`,
          trendScore: sql<number>`count(${termViews.id})::float / GREATEST(${enhancedTerms.viewCount}, 1) * 100`
        })
        .from(enhancedTerms)
        .leftJoin(termViews, eq(termViews.termId, enhancedTerms.id))
        .where(gte(termViews.viewedAt, startDate))
        .groupBy(enhancedTerms.id)
        .having(sql`count(${termViews.id}) > 0`)
        .orderBy(desc(sql`count(${termViews.id})`))
        .limit(parseInt(limit as string));
      
      res.json({
        success: true,
        data: {
          timeframe,
          trending: trendingTerms,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching trending terms:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch trending terms" 
      });
    }
  });

  // Content quality monitoring
  app.get('/api/analytics/content-quality', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { isUserAdmin } = await import('../utils/authUtils');
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const { db } = await import('../db');
      const { aiContentFeedback, aiContentVerification, enhancedTerms, contentAnalytics } = await import('../../shared/enhancedSchema');
      const { sql, lt, eq, desc, count } = await import('drizzle-orm');
      
      // Get terms with quality issues
      const [qualityStats] = await db
        .select({
          totalTerms: sql<number>`count(distinct ${enhancedTerms.id})`,
          lowRatedTerms: sql<number>`count(distinct ${enhancedTerms.id}) filter (where ${contentAnalytics.userRating} < 3)`,
          unverifiedTerms: sql<number>`count(distinct ${enhancedTerms.id}) filter (where ${aiContentVerification.verificationStatus} = 'unverified')`,
          flaggedTerms: sql<number>`count(distinct ${enhancedTerms.id}) filter (where ${aiContentVerification.verificationStatus} = 'flagged')`,
          pendingFeedback: sql<number>`count(${aiContentFeedback.id}) filter (where ${aiContentFeedback.status} = 'pending')`
        })
        .from(enhancedTerms)
        .leftJoin(contentAnalytics, eq(contentAnalytics.termId, enhancedTerms.id))
        .leftJoin(aiContentVerification, eq(aiContentVerification.termId, enhancedTerms.id))
        .leftJoin(aiContentFeedback, eq(aiContentFeedback.termId, enhancedTerms.id));

      // Get terms that need attention (low ratings)
      const termsNeedingAttention = await db
        .select({
          id: enhancedTerms.id,
          name: enhancedTerms.name,
          category: enhancedTerms.category,
          avgRating: sql<number>`avg(${contentAnalytics.userRating})`,
          totalViews: enhancedTerms.viewCount,
          feedbackCount: sql<number>`count(${aiContentFeedback.id})`,
          verificationStatus: aiContentVerification.verificationStatus
        })
        .from(enhancedTerms)
        .leftJoin(contentAnalytics, eq(contentAnalytics.termId, enhancedTerms.id))
        .leftJoin(aiContentFeedback, eq(aiContentFeedback.termId, enhancedTerms.id))
        .leftJoin(aiContentVerification, eq(aiContentVerification.termId, enhancedTerms.id))
        .groupBy(enhancedTerms.id, aiContentVerification.verificationStatus)
        .having(sql`avg(${contentAnalytics.userRating}) < 3 OR count(${aiContentFeedback.id}) > 0`)
        .orderBy(sql`avg(${contentAnalytics.userRating})`)
        .limit(20);

      res.json({
        success: true,
        data: {
          stats: qualityStats,
          termsNeedingAttention,
          alerts: [
            ...(qualityStats.pendingFeedback > 0 ? [{
              type: 'warning',
              message: `${qualityStats.pendingFeedback} pending feedback items need review`,
              action: 'review_feedback'
            }] : []),
            ...(qualityStats.unverifiedTerms > 10 ? [{
              type: 'info',
              message: `${qualityStats.unverifiedTerms} terms need verification`,
              action: 'verify_content'
            }] : []),
            ...(qualityStats.lowRatedTerms > 0 ? [{
              type: 'error',
              message: `${qualityStats.lowRatedTerms} terms have low user ratings`,
              action: 'improve_content'
            }] : [])
          ]
        }
      });
    } catch (error) {
      console.error("Error fetching content quality data:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch content quality data" 
      });
    }
  });

  // Performance analytics for admin
  app.get('/api/analytics/performance', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { isUserAdmin } = await import('../utils/authUtils');
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      const { timeframe = '7d' } = req.query;
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const { db } = await import('../db');
      const { termViews, users, enhancedTerms, aiUsageAnalytics } = await import('../../shared/enhancedSchema');
      const { sql, gte, desc, count } = await import('drizzle-orm');
      
      // Get performance metrics
      const [metrics] = await db
        .select({
          totalViews: sql<number>`count(${termViews.id})`,
          uniqueUsers: sql<number>`count(distinct ${termViews.userId})`,
          avgViewsPerUser: sql<number>`count(${termViews.id})::float / NULLIF(count(distinct ${termViews.userId}), 0)`,
          topCategory: sql<string>`mode() within group (order by ${enhancedTerms.category})`,
          aiRequestsCount: sql<number>`(select count(*) from ${aiUsageAnalytics} where created_at >= ${startDate})`,
          aiSuccessRate: sql<number>`(select avg(case when success then 1 else 0 end) * 100 from ${aiUsageAnalytics} where created_at >= ${startDate})`
        })
        .from(termViews)
        .leftJoin(enhancedTerms, sql`${termViews.termId} = ${enhancedTerms.id}`)
        .where(gte(termViews.viewedAt, startDate));

      // Get daily activity for the timeframe
      const dailyActivity = [];
      for (let i = days - 1; i >= 0; i--) {
        const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
        
        const [activity] = await db
          .select({
            views: count(termViews.id),
            uniqueUsers: sql<number>`count(distinct ${termViews.userId})`
          })
          .from(termViews)
          .where(sql`${termViews.viewedAt} >= ${dayStart} AND ${termViews.viewedAt} <= ${dayEnd}`);
        
        dailyActivity.push({
          date: day.toISOString().split('T')[0],
          views: activity.views || 0,
          uniqueUsers: activity.uniqueUsers || 0
        });
      }

      res.json({
        success: true,
        data: {
          timeframe,
          metrics,
          dailyActivity,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching performance analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch performance analytics" 
      });
    }
  });
}