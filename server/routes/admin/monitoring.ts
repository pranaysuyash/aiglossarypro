import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../../replitAuth";
import { requireAdmin, authenticateToken } from "../../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../../middleware/dev/mockAuth";
import { features } from "../../config";
import { getPerformanceMetrics, resetPerformanceMetrics } from "../../middleware/performanceMonitor";

/**
 * Admin monitoring and analytics routes
 */
export function registerAdminMonitoringRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  const tokenMiddleware = features.replitAuthEnabled ? authenticateToken : mockAuthenticateToken;
  
  // Get performance metrics
  app.get('/api/admin/performance', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const metrics = getPerformanceMetrics();
      
      res.json({
        success: true,
        data: {
          ...metrics,
          slowQueriesCount: metrics.slowQueries.length,
          recentSlowQueries: metrics.slowQueries.slice(-10) // Last 10 slow queries
        }
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch performance metrics'
      });
    }
  });
  
  // Reset performance metrics
  app.post('/api/admin/performance/reset', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      resetPerformanceMetrics();
      
      res.json({
        success: true,
        message: 'Performance metrics reset successfully'
      });
    } catch (error) {
      console.error('Error resetting performance metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset performance metrics'
      });
    }
  });
  
  console.log('📊 Admin monitoring routes registered');
} 