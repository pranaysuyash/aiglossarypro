import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { authenticateToken } from "../middleware/adminAuth";
import { mockIsAuthenticated } from "../middleware/dev/mockAuth";
import { features } from "../config";
import type { AuthenticatedRequest, UserProgress, UserActivity, ApiResponse } from "../../shared/types";

/**
 * User-specific routes (favorites, progress, activity)
 */
export function registerUserRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  
  // Favorites management
  app.get('/api/favorites', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { page = 1, limit = 50 } = req.query;
      
            const favorites = await storage.getUserFavorites(userId);
      
      // Apply pagination on client side for now
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedFavorites = favorites.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedFavorites,
        total: favorites.length,
        page: pageNum,
        limit: limitNum,
        hasMore: endIndex < favorites.length
      });
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch favorites" 
      });
    }
  });

  app.get('/api/favorites/:id', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      const isFavorite = await storage.isTermFavorite(userId, termId);
      
      res.json({
        success: true,
        data: { isFavorite }
      });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to check favorite status" 
      });
    }
  });

  app.post('/api/favorites/:id', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      await storage.addFavorite(userId, termId);
      
      res.json({
        success: true,
        message: "Term added to favorites"
      });
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to add favorite" 
      });
    }
  });

  app.delete('/api/favorites/:id', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      await storage.removeFavorite(userId, termId);
      
      res.json({
        success: true,
        message: "Term removed from favorites"
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to remove favorite" 
      });
    }
  });

  // Progress tracking
  app.get('/api/user/progress', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { page = 1, limit = 50, status } = req.query;
      
      const progress = await storage.getUserProgress(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string
      });
      
      res.json({
        success: true,
        data: progress.items,
        total: progress.total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        hasMore: progress.hasMore
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch progress" 
      });
    }
  });

  app.get('/api/progress/:id', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      const progress = await storage.getTermProgress(userId, termId);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error("Error fetching term progress:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch term progress" 
      });
    }
  });

  app.post('/api/progress/:id', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      const { status, progress } = req.body;
      
      await storage.updateTermProgress(userId, termId, {
        status,
        progress: parseInt(progress) || 0
      });
      
      res.json({
        success: true,
        message: "Progress updated successfully"
      });
    } catch (error) {
      console.error("Error updating term progress:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update progress" 
      });
    }
  });

  app.delete('/api/progress/:id', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      await storage.removeTermProgress(userId, termId);
      
      res.json({
        success: true,
        message: "Progress removed successfully"
      });
    } catch (error) {
      console.error("Error removing term progress:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to remove progress" 
      });
    }
  });

  // User activity and analytics
  app.get('/api/user/activity', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { page = 1, limit = 50, type, days = 30 } = req.query;
      
      const activity = await storage.getUserActivity(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        type: type as string,
        days: parseInt(days as string)
      });
      
      res.json({
        success: true,
        data: activity.items,
        total: activity.total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        hasMore: activity.hasMore
      });
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user activity" 
      });
    }
  });

  app.get('/api/user/streak', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserStreak(userId);
      
      res.json({
        success: true,
        data: streak
      });
    } catch (error) {
      console.error("Error fetching user streak:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user streak" 
      });
    }
  });

  // User statistics
  app.get('/api/user/stats', authMiddleware, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user statistics" 
      });
    }
  });
}