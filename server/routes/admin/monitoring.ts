import type { Express, Request, Response } from "express";
import { authenticateFirebaseToken, requireFirebaseAdmin } from "../../middleware/firebaseAuth";
import { features } from "../../config";
import { getPerformanceMetrics, resetPerformanceMetrics } from "../../middleware/performanceMonitor";
import { log as logger } from "../../utils/logger";

/**
 * Admin monitoring and analytics routes
 */
export function registerAdminMonitoringRoutes(app: Express): void {
  
  // Get performance metrics
  app.get('/api/admin/performance', authenticateFirebaseToken, requireFirebaseAdmin, async (req: Request, res: Response) => {
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
      logger.error('Error fetching performance metrics', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch performance metrics'
      });
    }
  });
  
  // Reset performance metrics
  app.post('/api/admin/performance/reset', authenticateFirebaseToken, requireFirebaseAdmin, async (req: Request, res: Response) => {
    try {
      resetPerformanceMetrics();
      
      res.json({
        success: true,
        message: 'Performance metrics reset successfully'
      });
    } catch (error) {
      logger.error('Error resetting performance metrics', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        message: 'Failed to reset performance metrics'
      });
    }
  });
  
  logger.info('📊 Admin monitoring routes registered');
} 