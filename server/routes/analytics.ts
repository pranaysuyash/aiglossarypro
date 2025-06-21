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
}