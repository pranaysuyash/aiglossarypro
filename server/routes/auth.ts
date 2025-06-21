import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import type { AuthenticatedRequest, IUser, ApiResponse } from "../../shared/types";

/**
 * Authentication and user management routes
 */
export function registerAuthRoutes(app: Express): void {
  
  // Get current authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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
  app.get('/api/settings', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
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

  app.put('/api/settings', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
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
  app.get('/api/user/export', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
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
  app.delete('/api/user/data', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
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