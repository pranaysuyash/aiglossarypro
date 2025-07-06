import type { Express, Request, Response } from "express";
import { optimizedStorage as storage } from "../optimizedStorage";
import { authenticateToken } from "../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../middleware/dev/mockAuth";
import { multiAuthMiddleware, getUserInfo } from "../middleware/multiAuth";
import { features } from "../config";
import type { AuthenticatedRequest, IUser, ApiResponse } from "../../shared/types";
import { log as logger } from "../utils/logger";

/**
 * Authentication and user management routes
 */
export function registerAuthRoutes(app: Express): void {
  
  // Choose authentication middleware based on enabled features
  const authMiddleware = features.firebaseAuthEnabled || features.simpleAuthEnabled 
    ? multiAuthMiddleware 
    : mockIsAuthenticated;
  const tokenMiddleware = features.firebaseAuthEnabled || features.simpleAuthEnabled 
    ? authenticateToken 
    : mockAuthenticateToken;
  
  // Get current authenticated user
  app.get('/api/auth/user', authMiddleware, tokenMiddleware, async (req: Request, res: Response) => {
    try {
      // Check if user is logged out (for development mock auth)
      if (process.env.NODE_ENV === 'development' && !req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }
      
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }
      
      const dbUser = await storage.getUser(userInfo.id);
      
      // Transform database user to IUser format
      const user: IUser | undefined = dbUser ? {
        id: dbUser.id,
        email: dbUser.email || userInfo.email,
        name: dbUser.firstName && dbUser.lastName 
          ? `${dbUser.firstName} ${dbUser.lastName}`
          : userInfo.name || 'Unknown User',
        avatar: dbUser.profileImageUrl || undefined,
        createdAt: dbUser.createdAt || new Date(),
        isAdmin: dbUser.isAdmin || false,
        lifetimeAccess: dbUser.lifetimeAccess || false,
        subscriptionTier: dbUser.subscriptionTier || 'free',
        purchaseDate: dbUser.purchaseDate || undefined
      } : undefined;
      
      const response: ApiResponse<IUser> = {
        success: true,
        data: user
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error fetching user', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // User settings routes
  app.get('/api/settings', authMiddleware, tokenMiddleware, async (req: Request, res: Response) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }
      
      const settings = await storage.getUserSettings(userInfo.id);
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Error fetching user settings', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user settings" 
      });
    }
  });

  app.put('/api/settings', authMiddleware, tokenMiddleware, async (req: Request, res: Response) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }
      
      const settings = req.body;
      
      await storage.updateUserSettings(userInfo.id, settings);
      
      res.json({
        success: true,
        message: "Settings updated successfully"
      });
    } catch (error) {
      logger.error('Error updating user settings', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to update user settings" 
      });
    }
  });

  // User data export
  app.get('/api/user/export', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }
      const userData = await storage.exportUserData(userInfo.id);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userInfo.id}.json"`);
      res.json(userData);
    } catch (error) {
      logger.error('Error exporting user data', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to export user data" 
      });
    }
  });

  // Delete user data (GDPR compliance)
  app.delete('/api/user/data', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }
      await storage.deleteUserData(userInfo.id);
      
      res.json({
        success: true,
        message: "User data deleted successfully"
      });
    } catch (error) {
      logger.error('Error deleting user data', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to delete user data" 
      });
    }
  });
}