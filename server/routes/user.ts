import type { Express, Request, Response } from "express";
import { optimizedStorage as storage } from "../optimizedStorage";
import { isAuthenticated } from "../replitAuth";
import { authenticateToken } from "../middleware/adminAuth";
import { mockIsAuthenticated } from "../middleware/dev/mockAuth";
import { features } from "../config";
import type { AuthenticatedRequest, UserProgress, UserActivity, ApiResponse } from "../../shared/types";
import { log as logger } from "../utils/logger";
import { parsePagination, parseId, parseNumericQuery, userRouteValidation } from "../middleware/inputValidation";
import { hasUserAccess } from "../utils/userHelpers";
import { getUserAccessStatus, canViewTerm, getRemainingDailyViews } from "../utils/accessControl";

/**
 * User-specific routes (favorites, progress, activity)
 */
export function registerUserRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  
  // Favorites management
  app.get('/api/favorites', authMiddleware, parsePagination, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { page, limit, offset } = (req as any).pagination;
      
      const result = await storage.getUserFavorites(userId, { limit, offset });

      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit,
        hasMore: result.hasMore
      });
    } catch (error) {
      logger.error('Error fetching user favorites', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch favorites" 
      });
    }
  });

  app.get('/api/favorites/:id', authMiddleware, parseId(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = (req as any).parsedId;
      
      const isFavorite = await storage.isTermFavorite(userId, termId);
      
      res.json({
        success: true,
        data: { isFavorite }
      });
    } catch (error) {
      logger.error('Error checking favorite status', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to check favorite status" 
      });
    }
  });

  app.post('/api/favorites/:id', authMiddleware, parseId(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = (req as any).parsedId;
      
      await storage.addFavorite(userId, termId);
      
      res.json({
        success: true,
        message: "Term added to favorites"
      });
    } catch (error) {
      logger.error('Error adding favorite', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to add favorite" 
      });
    }
  });

  app.delete('/api/favorites/:id', authMiddleware, parseId(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = (req as any).parsedId;
      
      await storage.removeFavorite(userId, termId);
      
      res.json({
        success: true,
        message: "Term removed from favorites"
      });
    } catch (error) {
      logger.error('Error removing favorite', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to remove favorite" 
      });
    }
  });

  // Progress tracking
  app.get('/api/user/progress', authMiddleware, parsePagination, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { page, limit } = (req as any).pagination;
      const { status } = req.query;
      
      const progress = await storage.getUserProgress(userId, {
        page,
        limit,
        status: status as string
      });
      
      res.json({
        success: true,
        data: progress.items,
        total: progress.total,
        page,
        limit,
        hasMore: progress.hasMore
      });
    } catch (error) {
      logger.error('Error fetching user progress', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch progress" 
      });
    }
  });

  app.get('/api/progress/:id', authMiddleware, parseId(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = (req as any).parsedId;
      
      const progress = await storage.getTermProgress(userId, termId);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      logger.error('Error fetching term progress', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch term progress" 
      });
    }
  });

  app.post('/api/progress/:id', authMiddleware, parseId(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = (req as any).parsedId;
      const { status, progress } = req.body;
      
      const parsedProgress = parseInt(progress) || 0;
      if (parsedProgress < 0 || parsedProgress > 100) {
        return res.status(400).json({
          success: false,
          message: "Progress must be between 0 and 100"
        });
      }
      
      await storage.updateTermProgress(userId, termId, {
        status,
        progress: parsedProgress
      });
      
      res.json({
        success: true,
        message: "Progress updated successfully"
      });
    } catch (error) {
      logger.error('Error updating term progress', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to update progress" 
      });
    }
  });

  app.delete('/api/progress/:id', authMiddleware, parseId(), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = (req as any).parsedId;
      
      await storage.removeTermProgress(userId, termId);
      
      res.json({
        success: true,
        message: "Progress removed successfully"
      });
    } catch (error) {
      logger.error('Error removing term progress', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to remove progress" 
      });
    }
  });

  // User activity and analytics
  app.get('/api/user/activity', authMiddleware, parsePagination, parseNumericQuery('days', 30, 1, 365), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { page, limit } = (req as any).pagination;
      const { type } = req.query;
      const days = (req.query as any).parsed?.days || 30;
      
      const activity = await storage.getUserActivity(userId, {
        page,
        limit,
        type: type as string,
        days
      });
      
      res.json({
        success: true,
        data: activity.items,
        total: activity.total,
        page,
        limit,
        hasMore: activity.hasMore
      });
    } catch (error) {
      logger.error('Error fetching user activity', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user activity" 
      });
    }
  });

  app.get('/api/user/streak', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserStreak(userId);
      
      res.json({
        success: true,
        data: streak
      });
    } catch (error) {
      logger.error('Error fetching user streak', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user streak" 
      });
    }
  });

  // User statistics
  app.get('/api/user/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching user stats', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch user statistics" 
      });
    }
  });

  // Access status endpoint for monetization
  app.get('/api/user/access-status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Calculate days since account creation
      const accountAge = Math.floor((Date.now() - new Date(user.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24));
      const isNewUser = accountAge < 7;
      
      // Use centralized access control logic
      const accessStatus = getUserAccessStatus(user);
      const dailyLimits = accessStatus.dailyLimits;
      
      const status = {
        hasAccess: accessStatus.hasAccess,
        accessType: accessStatus.accessType,
        subscriptionTier: user.subscriptionTier || 'free',
        lifetimeAccess: user.lifetimeAccess || false,
        dailyViews: dailyLimits.dailyViews,
        dailyLimit: dailyLimits.limit,
        remainingViews: dailyLimits.remaining,
        daysUntilReset: accessStatus.accessType === 'free' ? 1 : 0,
        purchaseDate: user.purchaseDate?.toISOString(),
        isNewUser,
        accountAge,
        canAccessPremiumFeatures: accessStatus.canAccessPremiumFeatures,
        isAdmin: accessStatus.isAdmin
      };
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error fetching access status', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch access status" 
      });
    }
  });

  // Term access check endpoint
  app.get('/api/user/term-access/:termId', authMiddleware, parseId('termId'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const termId = (req as any).parsedId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Use centralized access control logic
      const accessCheck = canViewTerm(user, termId);
      
      res.json({
        success: true,
        data: {
          canView: accessCheck.canView,
          reason: accessCheck.reason,
          ...accessCheck.metadata
        }
      });
    } catch (error) {
      logger.error('Error checking term access', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({ 
        success: false,
        message: "Failed to check term access" 
      });
    }
  });
}