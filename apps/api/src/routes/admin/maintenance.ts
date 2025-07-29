import type { Express, Request, Response } from 'express'
import type { Request, Response } from 'express';
import type { ApiResponse } from '@aiglossarypro/shared/types';
import { enhancedStorage as storage } from '../../enhancedStorage';
import { authenticateFirebaseToken, requireFirebaseAdmin } from '../../middleware/firebaseAuth';
import { log as logger } from '../../utils/logger';

// Maintenance operation types
const MAINTENANCE_OPERATIONS = {
  REINDEX: 'reindex',
  CLEANUP: 'cleanup',
  VACUUM: 'vacuum',
  CLEAR_CACHE: 'clearCache',
  BACKUP: 'backup',
} as const;

type MaintenanceOperation = (typeof MAINTENANCE_OPERATIONS)[keyof typeof MAINTENANCE_OPERATIONS];

/**
 * Admin system maintenance routes
 */
export function registerAdminMaintenanceRoutes(app: Express): void {
  // Database maintenance operations
  app.post(
    '/api/admin/maintenance',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { operation } = req.body;

        // Set user context for enhanced storage
        const authReq = req as unknown;
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

        let result;
        switch (operation as MaintenanceOperation) {
          case MAINTENANCE_OPERATIONS.REINDEX:
            result = await storage.reindexDatabase();
            break;
          case MAINTENANCE_OPERATIONS.CLEANUP:
            result = await storage.cleanupDatabase();
            break;
          case MAINTENANCE_OPERATIONS.VACUUM:
            result = await storage.vacuumDatabase();
            break;
          case MAINTENANCE_OPERATIONS.CLEAR_CACHE:
            result = await storage.clearCache();
            break;
          default:
            return res.status(400).json({
              success: false,
              message: `Invalid maintenance operation. Valid operations: ${Object.values(MAINTENANCE_OPERATIONS).join(', ')}`,
            });
        }

        const response: ApiResponse<any> = {
          success: true,
          message: `Maintenance operation '${operation}' completed successfully`,
          data: result,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error performing maintenance operation', {
          operation: req.body.operation,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Maintenance operation failed',
        });
      }
    }
  );

  // Get maintenance status/history
  app.get(
    '/api/admin/maintenance/status',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        // Set user context for enhanced storage
        const authReq = req as unknown;
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

        const status = await storage.getMaintenanceStatus();

        const response: ApiResponse<any> = {
          success: true,
          data: {
            ...status,
            availableOperations: Object.values(MAINTENANCE_OPERATIONS),
            lastUpdated: new Date(),
          },
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching maintenance status', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch maintenance status',
        });
      }
    }
  );

  // Clear all data (dangerous operation)
  app.post(
    '/api/admin/maintenance/clear-all',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { confirm } = req.body;

        if (confirm !== 'CLEAR_ALL_DATA') {
          return res.status(400).json({
            success: false,
            message: "Invalid confirmation. Please send { confirm: 'CLEAR_ALL_DATA' } to proceed.",
          });
        }

        // Set user context for enhanced storage
        const authReq = req as unknown;
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

        const result = await storage.clearAllData();

        logger.warn('Admin cleared all data', {
          userId: authReq.user?.claims?.sub || authReq.user?.id,
          userEmail: authReq.user?.claims?.email || authReq.user?.email,
          tablesCleared: result.tablesCleared,
        });

        const response: ApiResponse<any> = {
          success: true,
          message: 'All data cleared successfully',
          data: result,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error clearing all data', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to clear all data',
        });
      }
    }
  );

  // Database backup
  app.post(
    '/api/admin/maintenance/backup',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        // Set user context for enhanced storage
        const authReq = req as unknown;
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

        const result = await storage.createBackup();

        const response: ApiResponse<any> = {
          success: true,
          message: 'Database backup created successfully',
          data: result,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error creating backup', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to create backup',
        });
      }
    }
  );

  // System health check
  app.get(
    '/api/admin/maintenance/health',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        // Set user context for enhanced storage
        const authReq = req as unknown;
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

        const health = await storage.getSystemHealth();

        const response: ApiResponse<any> = {
          success: true,
          data: health,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error checking system health', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to check system health',
        });
      }
    }
  );

  logger.info('🔧 Admin maintenance routes registered');
}
