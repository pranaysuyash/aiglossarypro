import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { requireAdmin, authenticateToken } from "../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../middleware/dev/mockAuth";
import { features } from "../config";

/**
 * Analytics and reporting routes
 */
export function registerAnalyticsRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  const tokenMiddleware = features.replitAuthEnabled ? authenticateToken : mockAuthenticateToken;
  
  // General analytics (public - basic metrics only)
  app.get('/api/analytics', async (req: Request, res: Response) => {
    try {
      const { 
        timeframe = '30d',
        granularity = 'daily'
      } = req.query;
      
      // Parse timeframe
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { db } = await import('../db');
      const { enhancedTerms, termViews, users } = await import('../../shared/enhancedSchema');
      const { sql, gte, count, desc } = await import('drizzle-orm');
      
      // Get basic analytics
      const [analytics] = await db
        .select({
          totalTerms: sql<number>`count(distinct ${enhancedTerms.id})`,
          totalViews: sql<number>`count(${termViews.id})`,
          uniqueUsers: sql<number>`count(distinct ${termViews.userId})`,
          avgViewsPerTerm: sql<number>`count(${termViews.id})::float / count(distinct ${enhancedTerms.id})`
        })
        .from(enhancedTerms)
        .leftJoin(termViews, sql`${termViews.termId} = ${enhancedTerms.id}`)
        .where(gte(termViews.viewedAt, startDate));
      
      res.json({
        success: true,
        data: {
          timeframe,
          granularity,
          metrics: analytics,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch analytics" 
      });
    }
  });

  // User-specific analytics (authenticated)
  app.get('/api/analytics/user', authMiddleware, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { timeframe = '30d' } = req.query;
      
      // Parse timeframe
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { db } = await import('../db');
      const { termViews, favorites, userProgress } = await import('../../shared/enhancedSchema');
      const { sql, gte, eq, count } = await import('drizzle-orm');
      
      // Get user-specific analytics
      const [userAnalytics] = await db
        .select({
          totalViews: sql<number>`count(${termViews.id})`,
          favoritesCount: sql<number>`(select count(*) from ${favorites} where user_id = ${userId})`,
          progressCount: sql<number>`(select count(*) from ${userProgress} where user_id = ${userId})`
        })
        .from(termViews)
        .where(sql`${termViews.userId} = ${userId} AND ${termViews.viewedAt} >= ${startDate}`);
      
      res.json({
        success: true,
        data: {
          timeframe,
          metrics: userAnalytics,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user analytics" 
      });
    }
  });

  // Content performance analytics (admin only)
  app.get('/api/analytics/content', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { 
        timeframe = '30d',
        limit = 20,
        sort = 'views'
      } = req.query;
      
      // Parse timeframe
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { db } = await import('../db');
      const { enhancedTerms, termViews } = await import('../../shared/enhancedSchema');
      const { sql, gte, eq, desc, count } = await import('drizzle-orm');
      
      // Get content analytics
      const contentAnalytics = await db
        .select({
          id: enhancedTerms.id,
          name: enhancedTerms.name,
          mainCategories: enhancedTerms.mainCategories,
          totalViews: enhancedTerms.viewCount,
          recentViews: sql<number>`count(${termViews.id})`,
          lastViewed: enhancedTerms.lastViewed
        })
        .from(enhancedTerms)
        .leftJoin(termViews, eq(termViews.termId, enhancedTerms.id))
        .where(gte(termViews.viewedAt, startDate))
        .groupBy(enhancedTerms.id)
        .orderBy(sort === 'views' ? desc(sql`count(${termViews.id})`) : desc(enhancedTerms.name))
        .limit(parseInt(limit as string));
      
      res.json({
        success: true,
        data: {
          timeframe,
          content: contentAnalytics,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching content analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch content analytics" 
      });
    }
  });

  // Category performance analytics (admin only)
  app.get('/api/analytics/categories', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      
      // Parse timeframe
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { db } = await import('../db');
      const { enhancedTerms, termViews } = await import('../../shared/enhancedSchema');
      const { sql, gte, eq, desc, count } = await import('drizzle-orm');
      
      // Get category analytics
      const categoryAnalytics = await db
        .select({
          category: sql<string>`unnest(${enhancedTerms.mainCategories})`,
          termCount: sql<number>`count(distinct ${enhancedTerms.id})`,
          totalViews: sql<number>`count(${termViews.id})`
        })
        .from(enhancedTerms)
        .leftJoin(termViews, eq(termViews.termId, enhancedTerms.id))
        .where(gte(termViews.viewedAt, startDate))
        .groupBy(sql`unnest(${enhancedTerms.mainCategories})`)
        .orderBy(desc(sql`count(${termViews.id})`))
        .limit(20);
      
      res.json({
        success: true,
        data: {
          timeframe,
          categories: categoryAnalytics,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching category analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch category analytics" 
      });
    }
  });

  // Real-time analytics (admin only)
  app.get('/api/analytics/realtime', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { db } = await import('../db');
      const { termViews, enhancedTerms } = await import('../../shared/enhancedSchema');
      const { sql, gte, desc, count } = await import('drizzle-orm');
      
      // Get last hour activity
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      
      const [realtimeData] = await db
        .select({
          activeUsers: sql<number>`count(distinct ${termViews.userId})`,
          recentViews: sql<number>`count(${termViews.id})`,
          popularTerm: sql<string>`mode() within group (order by ${enhancedTerms.name})`
        })
        .from(termViews)
        .leftJoin(enhancedTerms, sql`${termViews.termId} = ${enhancedTerms.id}`)
        .where(gte(termViews.viewedAt, lastHour));
      
      res.json({
        success: true,
        data: {
          ...realtimeData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching realtime analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch realtime analytics" 
      });
    }
  });

  // Export analytics data (admin only) - already has admin verification
  app.get('/api/analytics/export', authMiddleware, async (req: any, res: Response) => {
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
      
      const { 
        format = 'json',
        timeframe = '30d',
        type = 'summary'
      } = req.query;
      
      // Parse timeframe
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { db } = await import('../db');
      const { enhancedTerms, termViews, users } = await import('../../shared/enhancedSchema');
      const { sql, gte, desc, count } = await import('drizzle-orm');
      
      // Get export data
      const exportData = await db
        .select({
          termName: enhancedTerms.name,
          categories: enhancedTerms.mainCategories,
          totalViews: enhancedTerms.viewCount,
          recentViews: sql<number>`count(${termViews.id})`,
          lastViewed: enhancedTerms.lastViewed
        })
        .from(enhancedTerms)
        .leftJoin(termViews, sql`${termViews.termId} = ${enhancedTerms.id}`)
        .where(gte(termViews.viewedAt, startDate))
        .groupBy(enhancedTerms.id)
        .orderBy(desc(sql`count(${termViews.id})`));
      
      // Set appropriate headers for download
      const filename = `analytics-${type}-${timeframe}.${format}`;
      
      if (format === 'csv') {
        // Convert to CSV
        const csvHeader = 'Term Name,Categories,Total Views,Recent Views,Last Viewed\n';
        const csvData = exportData.map(row => 
          `"${row.termName}","${row.categories?.join(';') || ''}",${row.totalViews || 0},${row.recentViews || 0},"${row.lastViewed || ''}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvHeader + csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
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
      console.error("Error exporting analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to export analytics" 
      });
    }
  });

  console.log("✅ Analytics routes registered successfully");
}