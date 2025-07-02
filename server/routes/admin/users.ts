import type { Express, Request, Response } from "express";
import { enhancedStorage as storage } from "../../enhancedStorage";
import { requireAdmin, authenticateToken } from "../../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../../middleware/dev/mockAuth";
import { features } from "../../config";
import type { ApiResponse } from "../../../shared/types";
import { log as logger } from "../../utils/logger";
import { DEFAULT_LIMITS } from "../../constants";
import { validateQuery, paginationSchema } from "../../utils/validation";

/**
 * Admin user management routes
 */
export function registerAdminUserRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = mockIsAuthenticated;
  const tokenMiddleware = mockAuthenticateToken;
  
  // Get all users with pagination and search
  app.get('/api/admin/users', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = DEFAULT_LIMITS.PAGE_SIZE } = validateQuery(paginationSchema)(req);
      const { search } = req.query;
      
      // Set user context for enhanced storage
      const authReq = req as any;
      storage.setContext({
        user: {
          id: authReq.user?.claims?.sub || authReq.user?.id || 'unknown',
          email: authReq.user?.claims?.email || authReq.user?.email || 'unknown',
          isAdmin: authReq.user?.isAdmin || false,
          first_name: authReq.user?.claims?.first_name || authReq.user?.firstName,
          last_name: authReq.user?.claims?.last_name || authReq.user?.lastName
        },
        requestId: authReq.requestId,
        timestamp: new Date()
      });
      
      const users = await storage.getAllUsers();
      
      // Apply search filtering if provided
      let filteredUsers = users.data;
      if (search) {
        const searchTerm = String(search).toLowerCase();
        filteredUsers = users.data.filter((user: any) => 
          user.email?.toLowerCase().includes(searchTerm) ||
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm)
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
        hasMore: endIndex < filteredUsers.length
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error fetching users", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        message: "Failed to fetch users"
      });
    }
  });

  // Get user details by ID
  app.get('/api/admin/users/:userId', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Set user context for enhanced storage
      const authReq = req as any;
      storage.setContext({
        user: {
          id: authReq.user?.claims?.sub || authReq.user?.id || 'unknown',
          email: authReq.user?.claims?.email || authReq.user?.email || 'unknown',
          isAdmin: authReq.user?.isAdmin || false,
          first_name: authReq.user?.claims?.first_name || authReq.user?.firstName,
          last_name: authReq.user?.claims?.last_name || authReq.user?.lastName
        },
        requestId: authReq.requestId,
        timestamp: new Date()
      });
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      const response: ApiResponse<any> = {
        success: true,
        data: user
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error fetching user details", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        message: "Failed to fetch user details"
      });
    }
  });

  // Update user details
  app.put('/api/admin/users/:userId', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;
      
      // Set user context for enhanced storage
      const authReq = req as any;
      storage.setContext({
        user: {
          id: authReq.user?.claims?.sub || authReq.user?.id || 'unknown',
          email: authReq.user?.claims?.email || authReq.user?.email || 'unknown',
          isAdmin: authReq.user?.isAdmin || false,
          first_name: authReq.user?.claims?.first_name || authReq.user?.firstName,
          last_name: authReq.user?.claims?.last_name || authReq.user?.lastName
        },
        requestId: authReq.requestId,
        timestamp: new Date()
      });
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      const response: ApiResponse<any> = {
        success: true,
        data: updatedUser,
        message: "User updated successfully"
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error updating user", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        message: "Failed to update user"
      });
    }
  });

  // Delete user
  app.delete('/api/admin/users/:userId', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Set user context for enhanced storage
      const authReq = req as any;
      storage.setContext({
        user: {
          id: authReq.user?.claims?.sub || authReq.user?.id || 'unknown',
          email: authReq.user?.claims?.email || authReq.user?.email || 'unknown',
          isAdmin: authReq.user?.isAdmin || false,
          first_name: authReq.user?.claims?.first_name || authReq.user?.firstName,
          last_name: authReq.user?.claims?.last_name || authReq.user?.lastName
        },
        requestId: authReq.requestId,
        timestamp: new Date()
      });
      
      await storage.deleteUser(userId);
      
      const response: ApiResponse<any> = {
        success: true,
        message: "User deleted successfully"
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error deleting user", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        message: "Failed to delete user"
      });
    }
  });

  // Get user activity/analytics
  app.get('/api/admin/users/:userId/activity', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Set user context for enhanced storage
      const authReq = req as any;
      storage.setContext({
        user: {
          id: authReq.user?.claims?.sub || authReq.user?.id || 'unknown',
          email: authReq.user?.claims?.email || authReq.user?.email || 'unknown',
          isAdmin: authReq.user?.isAdmin || false,
          first_name: authReq.user?.claims?.first_name || authReq.user?.firstName,
          last_name: authReq.user?.claims?.last_name || authReq.user?.lastName
        },
        requestId: authReq.requestId,
        timestamp: new Date()
      });
      
      const activity = await storage.getUserActivity(userId);
      
      const response: ApiResponse<any> = {
        success: true,
        data: activity
      };
      
      res.json(response);
    } catch (error) {
      logger.error("Error fetching user activity", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        message: "Failed to fetch user activity"
      });
    }
  });

  logger.info('📝 Admin user management routes registered');
}