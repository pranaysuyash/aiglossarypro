import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { authenticateToken } from "../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../middleware/dev/mockAuth";
import { features } from "../config";
import type { AuthenticatedRequest, IUser, ApiResponse } from "../../shared/types";

/**
 * Authentication and user management routes
 */
export function registerAuthRoutes(app: Express): void {
  
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  const tokenMiddleware = features.replitAuthEnabled ? authenticateToken : mockAuthenticateToken;
  
  // Get current authenticated user
  app.get('/api/auth/user', authMiddleware, tokenMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const dbUser = await storage.getUser(userId);
      
      // Transform database user to IUser format
      const user: IUser | undefined = dbUser ? {
        id: dbUser.id,
        email: dbUser.email || '',
        name: dbUser.firstName && dbUser.lastName 
          ? `${dbUser.firstName} ${dbUser.lastName}`
          : dbUser.email || 'Unknown User',
        avatar: dbUser.profileImageUrl || undefined,
        createdAt: dbUser.createdAt || new Date()
      } : undefined;
      
      const response: ApiResponse<IUser> = {
        success: true,
        data: user
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching user:", error);
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
      const userId = req.user!.claims.sub;
      const settings = await storage.getUserSettings(userId);
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user settings" 
      });
    }
  });

  app.put('/api/settings', authMiddleware, tokenMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const settings = req.body;
      
      await storage.updateUserSettings(userId, settings);
      
      res.json({
        success: true,
        message: "Settings updated successfully"
      });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update user settings" 
      });
    }
  });

  // User data export
  app.get('/api/user/export', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const userData = await storage.exportUserData(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
      res.json(userData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to export user data" 
      });
    }
  });

  // Delete user data (GDPR compliance)
  app.delete('/api/user/data', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUserData(userId);
      
      res.json({
        success: true,
        message: "User data deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to delete user data" 
      });
    }
  });
}