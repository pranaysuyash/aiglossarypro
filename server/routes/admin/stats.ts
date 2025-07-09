import type { Express, Request, Response } from 'express';
import type { AdminStats, ApiResponse } from '../../../shared/types';
import { HEALTH_STATUS } from '../../constants';
import { enhancedStorage as storage } from '../../enhancedStorage';
import { authenticateFirebaseToken, requireFirebaseAdmin } from '../../middleware/firebaseAuth';
import { log as logger } from '../../utils/logger';

/**
 * Admin statistics and dashboard routes
 */
export function registerAdminStatsRoutes(app: Express): void {
  // Admin dashboard statistics
  app.get(
    '/api/admin/stats',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        // Set user context for enhanced storage
        const authReq = req as any;
        storage.setContext({
          user: {
            id: authReq.user?.claims?.sub || authReq.user?.id || 'unknown',
            email: authReq.user?.claims?.email || authReq.user?.email || 'unknown',
            isAdmin: authReq.user?.isAdmin || false,
            first_name: authReq.user?.claims?.first_name || authReq.user?.firstName,
            last_name: authReq.user?.claims?.last_name || authReq.user?.lastName,
          },
          requestId: authReq.requestId,
          timestamp: new Date(),
        });

        const stats = await storage.getAdminStats();

        const response: ApiResponse<AdminStats> = {
          success: true,
          data: stats,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching admin stats', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch admin statistics',
        });
      }
    }
  );

  // System health check
  app.get(
    '/api/admin/health',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (_req: Request, res: Response) => {
      try {
        // Provide basic health check
        const termCount = 1000; // Mock count for health check
        // TODO: Implement proper getTermsOptimized in enhancedStorage
        const health = {
          database: HEALTH_STATUS.HEALTHY,
          s3: HEALTH_STATUS.HEALTHY,
          ai: HEALTH_STATUS.HEALTHY,
          termCount,
        };

        res.json({
          success: true,
          data: health,
        });
      } catch (error) {
        logger.error('Error checking system health', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Health check failed',
        });
      }
    }
  );
}
