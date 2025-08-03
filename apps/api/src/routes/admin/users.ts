import type { Express, Request, Response } from 'express';
import type { ApiResponse } from '@aiglossarypro/shared';
import { DEFAULT_LIMITS } from '../../constants';
import { enhancedStorage as storage } from '../../enhancedStorage';
import { authenticateFirebaseToken, requireFirebaseAdmin } from '../../middleware/firebaseAuth';
import { log as logger } from '../../utils/logger';
import { paginationSchema, validateQuery } from '../../utils/validation';

/**
 * Admin user management routes
 */
export function registerAdminUserRoutes(app: Express): void {
  // Get all users with pagination and search
  app.get(
    '/api/admin/users',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const { page = 1, limit = DEFAULT_LIMITS.PAGE_SIZE } = validateQuery(paginationSchema)(req);
        const { search } = req.query;

        // Set user context for enhanced storage
        storage.setContext({
          user: {
            id: user?.claims?.sub || user?.id || 'unknown',
            email: user?.claims?.email || user?.email || 'unknown',
            isAdmin: user?.isAdmin || false,
            first_name: user?.claims?.first_name || user?.firstName,
            last_name: user?.claims?.last_name || user?.lastName,
          },
          requestId: (req as any).requestId,
          timestamp: new Date(),
        });

        const users = await storage.getAllUsers();

        // Apply search filtering if provided
        let filteredUsers = users.data;
        if (search) {
          const searchTerm = String(search).toLowerCase();
          filteredUsers = users.data.filter(
            (userData: any) =>
              userData.email?.toLowerCase().includes(searchTerm) ||
              userData.firstName?.toLowerCase().includes(searchTerm) ||
              userData.lastName?.toLowerCase().includes(searchTerm)
          );
        }

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        const response = {
          success: true,
          data: paginatedUsers,
          total: filteredUsers.length,
          page,
          limit,
          hasMore: endIndex < filteredUsers.length,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching users', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch users',
        });
      }
    }
  );

  // Get user details by ID
  app.get(
    '/api/admin/users/:userId',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const { userId } = req.params;

        // Set user context for enhanced storage
        storage.setContext({
          user: {
            id: user?.claims?.sub || user?.id || 'unknown',
            email: user?.claims?.email || user?.email || 'unknown',
            isAdmin: user?.isAdmin || false,
            first_name: user?.claims?.first_name || user?.firstName,
            last_name: user?.claims?.last_name || user?.lastName,
          },
          requestId: (req as any).requestId,
          timestamp: new Date(),
        });

        const foundUser = await storage.getUserById(userId);

        if (!foundUser) {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
          return;
        }

        const response: ApiResponse<any> = {
          success: true,
          data: foundUser,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching user details', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user details',
        });
      }
    }
  );

  // Update user details
  app.put(
    '/api/admin/users/:userId',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const { userId } = req.params;
        const updateData = req.body;

        // Set user context for enhanced storage
        storage.setContext({
          user: {
            id: user?.claims?.sub || user?.id || 'unknown',
            email: user?.claims?.email || user?.email || 'unknown',
            isAdmin: user?.isAdmin || false,
            first_name: user?.claims?.first_name || user?.firstName,
            last_name: user?.claims?.last_name || user?.lastName,
          },
          requestId: (req as any).requestId,
          timestamp: new Date(),
        });

        const updatedUser = await storage.updateUser(userId, updateData);

        const response: ApiResponse<any> = {
          success: true,
          data: updatedUser,
          message: 'User updated successfully',
        };

        res.json(response);
      } catch (error) {
        logger.error('Error updating user', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to update user',
        });
      }
    }
  );

  // Delete user
  app.delete(
    '/api/admin/users/:userId',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const { userId } = req.params;

        // Set user context for enhanced storage
        storage.setContext({
          user: {
            id: user?.claims?.sub || user?.id || 'unknown',
            email: user?.claims?.email || user?.email || 'unknown',
            isAdmin: user?.isAdmin || false,
            first_name: user?.claims?.first_name || user?.firstName,
            last_name: user?.claims?.last_name || user?.lastName,
          },
          requestId: (req as any).requestId,
          timestamp: new Date(),
        });

        await storage.deleteUser(userId);

        const response: ApiResponse<any> = {
          success: true,
          message: 'User deleted successfully',
        };

        res.json(response);
      } catch (error) {
        logger.error('Error deleting user', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to delete user',
        });
      }
    }
  );

  // Get user activity/analytics
  app.get(
    '/api/admin/users/:userId/activity',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        const { userId } = req.params;

        // Set user context for enhanced storage
        storage.setContext({
          user: {
            id: user?.claims?.sub || user?.id || 'unknown',
            email: user?.claims?.email || user?.email || 'unknown',
            isAdmin: user?.isAdmin || false,
            first_name: user?.claims?.first_name || user?.firstName,
            last_name: user?.claims?.last_name || user?.lastName,
          },
          requestId: (req as any).requestId,
          timestamp: new Date(),
        });

        const activity = await storage.getUserActivity(userId);

        const response: ApiResponse<any> = {
          success: true,
          data: activity,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching user activity', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user activity',
        });
      }
    }
  );

  logger.info('📝 Admin user management routes registered');
}
