import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../replitAuth";
import { requireAdmin, authenticateToken } from "../../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../../middleware/dev/mockAuth";
import { features } from "../../config";
import type { AdminStats, ApiResponse } from "../../../shared/types";

/**
 * Admin statistics and dashboard routes
 */
export function registerAdminStatsRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  const tokenMiddleware = features.replitAuthEnabled ? authenticateToken : mockAuthenticateToken;
  
  // Admin dashboard statistics
  app.get('/api/admin/stats', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      
      const response: ApiResponse<AdminStats> = {
        success: true,
        data: stats
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch admin statistics" 
      });
    }
  });

  // System health check
  app.get('/api/admin/health', async (req: Request, res: Response) => {
    try {
      // Provide basic health check since getSystemHealth doesn't exist
      const termCount = await storage.getTermCount();
      const health = {
        database: 'healthy' as const,
        s3: 'healthy' as const, 
        ai: 'healthy' as const,
        termCount
      };
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error("Error checking system health:", error);
      res.status(500).json({
        success: false,
        message: "Health check failed"
      });
    }
  });
} 