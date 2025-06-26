import type { Express, Request, Response } from "express";
import { optimizedStorage as storage } from "../optimizedStorage";
import { isAuthenticated } from "../../replitAuth";
import { requireAdmin, authenticateToken } from "../../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../../middleware/dev/mockAuth";
import { features } from "../../config";
import type { ApiResponse } from "../../../shared/types";

/**
 * Admin revenue tracking and analytics routes
 */
export function registerAdminRevenueRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  const tokenMiddleware = features.replitAuthEnabled ? authenticateToken : mockAuthenticateToken;
  
  // Revenue dashboard overview
  app.get('/api/admin/revenue/dashboard', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

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
      console.error("Error fetching revenue dashboard:", error);
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
      
      const purchases = await storage.getRecentPurchases({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        currency: currency as string
      });
      
      const response: ApiResponse<typeof purchases> = {
        success: true,
        data: purchases
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch purchases" 
      });
    }
  });

  // Revenue analytics and trends
  app.get('/api/admin/revenue/analytics', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { period = '30d', groupBy = 'day' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get analytics data
      const revenueByPeriod = await storage.getRevenueByPeriod(startDate, now, groupBy as string);
      const topCountries = await storage.getTopCountriesByRevenue(10);
      const conversionFunnel = await storage.getConversionFunnel();
      const refundAnalytics = await storage.getRefundAnalytics(startDate, now);
      
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
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch revenue analytics" 
      });
    }
  });

  // Export revenue data
  app.get('/api/admin/revenue/export', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { format = 'csv', period = '30d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const purchases = await storage.getPurchasesForExport(startDate, now);
      
      if (format === 'csv') {
        // Generate CSV
        const csvHeader = 'Date,Order ID,User ID,Email,Amount,Currency,Status,Country,Payment Method\n';
        const csvRows = purchases.map(purchase => [
          purchase.createdAt.toISOString(),
          purchase.gumroadOrderId,
          purchase.userId,
          purchase.userEmail,
          purchase.amount / 100, // Convert cents to dollars
          purchase.currency,
          purchase.status,
          purchase.country || '',
          purchase.paymentMethod || ''
        ].join(',')).join('\n');
        
        const csv = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="revenue-export-${period}.csv"`);
        res.send(csv);
      } else {
        // Return JSON
        const response: ApiResponse<typeof purchases> = {
          success: true,
          data: purchases
        };
        
        res.json(response);
      }
    } catch (error) {
      console.error("Error exporting revenue data:", error);
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
      console.error("Error fetching webhook status:", error);
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
        await storage.updateUserAccess(purchase.userId, {
          lifetimeAccess: true,
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
      console.error("Error verifying purchase:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to verify purchase" 
      });
    }
  });
}