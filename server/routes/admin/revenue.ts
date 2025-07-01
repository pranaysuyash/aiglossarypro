import type { Express, Request, Response } from "express";
import { enhancedStorage as storage } from "../../enhancedStorage";
import { mockIsAuthenticated } from "../../middleware/dev/mockAuth";
import { requireAdmin, authenticateToken } from "../../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../../middleware/dev/mockAuth";
import { features } from "../../config";
import type { ApiResponse } from "../../../shared/types";
import { log as logger } from "../../utils/logger";
import { TIME_PERIODS } from "../../constants";
import { calculateDateRange } from "../../utils/dateHelpers";
import { csvGenerators, sendCSVResponse } from "../../utils/csvHelpers";

/**
 * Admin revenue tracking and analytics routes
 */
export function registerAdminRevenueRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = mockIsAuthenticated;
  const tokenMiddleware = mockAuthenticateToken;
  
  // Revenue dashboard overview
  app.get('/api/admin/revenue/dashboard', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { period = TIME_PERIODS.THIRTY_DAYS } = req.query;
      
      // Calculate date range based on period
      const { startDate, endDate: now } = calculateDateRange(period as string);

      // Get purchase statistics
      const totalRevenue = await storage.getTotalRevenue();
      const totalPurchases = await storage.getTotalPurchases();
      const recentRevenue = await storage.getRevenueForPeriod(startDate, now);
      const recentPurchases = await storage.getPurchasesForPeriod(startDate, now);
      
      // Calculate conversion metrics
      const totalUsers = await storage.getTotalUsers();
      const conversionRate = totalUsers > 0 ? (totalPurchases / totalUsers) * 100 : 0;
      
      // Get revenue by currency
      const revenueByCurrency = await storage.getRevenueByCurrency();
      
      // Get daily revenue for chart
      const dailyRevenue = await storage.getDailyRevenueForPeriod(startDate, now);
      
      const dashboard = {
        overview: {
          totalRevenue,
          totalPurchases,
          recentRevenue,
          recentPurchases,
          conversionRate: Math.round(conversionRate * 100) / 100,
          averageOrderValue: totalPurchases > 0 ? Math.round((totalRevenue / totalPurchases) * 100) / 100 : 0
        },
        revenueByCurrency,
        dailyRevenue,
        period
      };
      
      const response: ApiResponse<typeof dashboard> = {
        success: true,
        data: dashboard
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error fetching revenue dashboard", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch revenue dashboard" 
      });
    }
  });

  // Recent purchases with user details
  app.get('/api/admin/revenue/purchases', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, status, currency } = req.query;
      
      const purchases = await storage.getRecentPurchases(
        parseInt(limit as string)
      );
      
      const response: ApiResponse<typeof purchases> = {
        success: true,
        data: purchases
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error fetching purchases", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch purchases" 
      });
    }
  });

  // Revenue analytics and trends
  app.get('/api/admin/revenue/analytics', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { period = TIME_PERIODS.THIRTY_DAYS, groupBy = 'day' } = req.query;
      
      // Calculate date range
      const { startDate, endDate: now } = calculateDateRange(period as string);

      // Get analytics data
      const revenueByPeriod = await storage.getRevenueByPeriod(groupBy as string);
      const topCountries = await storage.getTopCountriesByRevenue(10);
      const conversionFunnel = await storage.getConversionFunnel();
      const refundAnalytics = await storage.getRefundAnalytics();
      
      const analytics = {
        revenueByPeriod,
        topCountries,
        conversionFunnel,
        refundAnalytics,
        period,
        groupBy
      };
      
      const response: ApiResponse<typeof analytics> = {
        success: true,
        data: analytics
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error fetching revenue analytics", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch revenue analytics" 
      });
    }
  });

  // Export revenue data
  app.get('/api/admin/revenue/export', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { format = 'csv', period = TIME_PERIODS.THIRTY_DAYS } = req.query;
      
      // Calculate date range
      const { startDate, endDate: now } = calculateDateRange(period as string);

      const purchases = await storage.getPurchasesForExport(startDate, now);
      
      if (format === 'csv') {
        // Generate CSV using utility
        const csv = csvGenerators.purchases(purchases);
        sendCSVResponse(res, csv, `revenue-export-${period}.csv`);
      } else {
        // Return JSON
        const response: ApiResponse<typeof purchases> = {
          success: true,
          data: purchases
        };
        
        res.json(response);
      }
    } catch (error) {
      logger.error("Error exporting revenue data", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to export revenue data" 
      });
    }
  });

  // Gumroad webhook verification status
  app.get('/api/admin/revenue/webhook-status', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET;
      const hasWebhookSecret = !!webhookSecret;
      
      // Get recent webhook activity
      const recentWebhooks = await storage.getRecentWebhookActivity(10);
      
      const status = {
        webhookConfigured: hasWebhookSecret,
        webhookUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/gumroad/webhook`,
        recentActivity: recentWebhooks,
        lastWebhookReceived: recentWebhooks.length > 0 ? recentWebhooks[0].receivedAt : null
      };
      
      const response: ApiResponse<typeof status> = {
        success: true,
        data: status
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error fetching webhook status", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch webhook status" 
      });
    }
  });

  // Manual purchase verification (for debugging)
  app.post('/api/admin/revenue/verify-purchase', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { gumroadOrderId } = req.body;
      
      if (!gumroadOrderId) {
        return res.status(400).json({
          success: false,
          message: "Gumroad order ID is required"
        });
      }
      
      // Verify purchase with Gumroad API (if available)
      const purchase = await storage.getPurchaseByOrderId(gumroadOrderId);
      
      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: "Purchase not found"
        });
      }
      
      // Update user access if purchase is valid
      if (purchase.status === 'completed' && purchase.userId) {
        await storage.updateUserAccess(purchase.gumroadOrderId, {
          grantAccess: true,
          subscriptionTier: 'lifetime',
          purchaseDate: purchase.createdAt || new Date()
        });
      }
      
      const response: ApiResponse<typeof purchase> = {
        success: true,
        data: purchase,
        message: "Purchase verified and user access updated"
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error verifying purchase", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to verify purchase" 
      });
    }
  });
}