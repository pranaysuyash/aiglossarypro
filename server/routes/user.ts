import type { Express, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/types';
import { features } from '../config';
import { authenticateToken } from '../middleware/adminAuth';
import { mockAuthenticateToken, mockIsAuthenticated } from '../middleware/dev/mockAuth';
import { parseId, parseNumericQuery, parsePagination } from '../middleware/inputValidation';
import { getUserInfo, multiAuthMiddleware } from '../middleware/multiAuth';
import { optimizedStorage as storage } from '../optimizedStorage';
import { log as logger } from '../utils/logger';

import logger from '../utils/logger';
// Extended request interfaces for parsed middleware data
interface RequestWithPagination extends Request {
  pagination: {
    page: number;
    limit: number;
    offset: number;
  };
}

interface RequestWithParsedId extends Request {
  parsedId: string;
}

interface RequestWithParsedQuery extends Request {
  parsed?: {
    days?: number;
  };
}

import { canViewTerm, getUserAccessStatus } from '../utils/accessControl';

/**
 * User-specific routes (favorites, progress, activity)
 */
export function registerUserRoutes(app: Express): void {
  // Choose authentication middleware based on enabled features
  const authMiddleware =
    features.firebaseAuthEnabled || features.simpleAuthEnabled
      ? multiAuthMiddleware
      : multiAuthMiddleware; // Always use multiAuthMiddleware
  const tokenMiddleware =
    features.firebaseAuthEnabled || features.simpleAuthEnabled
      ? authenticateToken
      : authenticateToken; // Always use authenticateToken

  // Favorites management
  app.get(
    '/api/favorites',
    authMiddleware as any,
    parsePagination as any,
    async (req: any, res: Response) => {
      try {
        const userInfo = getUserInfo(req);
        if (!userInfo) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
        }
        const userId = userInfo.id;
        const { page, limit, offset } = req.pagination;

        const result = await (storage as any).getUserFavoritesOptimized(userId, { limit, offset });

        res.json({
          success: true,
          data: result.data,
          total: result.total,
          page,
          limit,
          hasMore: result.hasMore,
        });
      } catch (error) {
        logger.error('Error fetching user favorites', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch favorites',
        });
      }
    }
  );

  app.get(
    '/api/favorites/:id',
    authMiddleware as any,
    tokenMiddleware,
    parseId() as any,
    async (req: any, res: Response) => {
      try {
        const userInfo = getUserInfo(req);
        if (!userInfo) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
        }
        const userId = userInfo.id;
        const termId = req.parsedId;

        const isFavorite = await storage.isTermFavorite(userId, termId);

        res.json({
          success: true,
          data: { isFavorite },
        });
      } catch (error) {
        logger.error('Error checking favorite status', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to check favorite status',
        });
      }
    }
  );

  app.post(
    '/api/favorites/:id',
    authMiddleware as any,
    tokenMiddleware,
    parseId() as any,
    async (req: any, res: Response) => {
      try {
        const userInfo = getUserInfo(req);
        if (!userInfo) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required',
          });
        }
        const userId = userInfo.id;
        const termId = req.parsedId;

        await storage.addFavorite(userId, termId);

        res.json({
          success: true,
          message: 'Term added to favorites',
        });
      } catch (error) {
        logger.error('Error adding favorite', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to add favorite',
        });
      }
    }
  );

  app.delete(
    '/api/favorites/:id',
    authMiddleware as any,
    parseId() as any,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const termId = req.parsedId;

        await storage.removeFavorite(userId, termId);

        res.json({
          success: true,
          message: 'Term removed from favorites',
        });
      } catch (error) {
        logger.error('Error removing favorite', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to remove favorite',
        });
      }
    }
  );

  // Progress tracking
  app.get(
    '/api/user/progress',
    authMiddleware as any,
    parsePagination as any,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const { page, limit } = req.pagination;
        // const { status } = req.query; // Currently not used

        const progress = await storage.getUserProgress(userId);

        res.json({
          success: true,
          data: progress || [],
          total: progress ? progress.length : 0,
          page,
          limit,
          hasMore: false,
        });
      } catch (error) {
        logger.error('Error fetching user progress', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch progress',
        });
      }
    }
  );

  app.get(
    '/api/progress/:id',
    authMiddleware as any,
    parseId() as any,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const termId = req.parsedId;

        const allProgress = await storage.getUserProgress(userId);
        const progress = allProgress?.find((p: any) => p.termId === termId);

        res.json({
          success: true,
          data: progress,
        });
      } catch (error) {
        logger.error('Error fetching term progress', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch term progress',
        });
      }
    }
  );

  app.post(
    '/api/progress/:id',
    authMiddleware as any,
    parseId() as any,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const termId = req.parsedId;
        const { progress } = req.body;

        const parsedProgress = parseInt(progress) || 0;
        if (parsedProgress < 0 || parsedProgress > 100) {
          return res.status(400).json({
            success: false,
            message: 'Progress must be between 0 and 100',
          });
        }

        // Mark term as learned (simplified since updateUserProgress doesn't exist)
        await storage.markTermAsLearned(userId, termId);

        res.json({
          success: true,
          message: 'Progress updated successfully',
        });
      } catch (error) {
        logger.error('Error updating term progress', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to update progress',
        });
      }
    }
  );

  app.delete(
    '/api/progress/:id',
    authMiddleware as any,
    parseId() as any,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const termId = req.parsedId;

        await storage.unmarkTermAsLearned(userId, termId);

        res.json({
          success: true,
          message: 'Progress removed successfully',
        });
      } catch (error) {
        logger.error('Error removing term progress', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to remove progress',
        });
      }
    }
  );

  // User activity and analytics
  app.get(
    '/api/user/activity',
    authMiddleware as any,
    parsePagination,
    parseNumericQuery('days', 30, 1, 365),
    async (req, res) => {
      const typedReq = req as AuthenticatedRequest & RequestWithPagination & RequestWithParsedQuery;
      try {
        // const _userId = typedReq.user.claims.sub; // Currently not used
        const { page, limit } = typedReq.pagination;
        // const { type } = typedReq.query; // Currently not used
        // const _days = typedReq.parsed?.days || 30; // Currently not used

        // Since getUserActivity doesn't exist in OptimizedStorage, return empty for now
        const activity = {
          items: [],
          total: 0,
          hasMore: false,
        };

        res.json({
          success: true,
          data: activity.items,
          total: activity.total,
          page,
          limit,
          hasMore: activity.hasMore,
        });
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

  app.get(
    '/api/user/streak',
    authMiddleware as any,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const streak = await storage.getUserStreak(userId);

        res.json({
          success: true,
          data: streak,
        });
      } catch (error) {
        logger.error('Error fetching user streak', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user streak',
        });
      }
    }
  );

  // User statistics
  app.get(
    '/api/user/stats',
    authMiddleware as any,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const stats = await storage.getUserStats(userId);

        res.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        logger.error('Error fetching user stats', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user statistics',
        });
      }
    }
  );

  // Access status endpoint for monetization - special endpoint that handles unauthenticated users
  app.get('/api/user/access-status', async (req: Request, res: Response) => {
    try {
      // Try to extract user info from JWT token if available
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.auth_token;
      let userInfo = null;

      if (token) {
        try {
          const { verifyToken } = await import('../auth/simpleAuth');
          const decoded = verifyToken(token);
          if (decoded) {
            userInfo = {
              id: decoded.sub,
              email: decoded.email || '',
              name: decoded.name || '',
              provider: 'jwt',
            };
          }
        } catch (error) {
          // Token verification failed, continue as unauthenticated
        }
      }
      if (!userInfo) {
        // Return default unauthenticated status instead of error
        return res.json({
          success: true,
          data: {
            hasAccess: false,
            accessType: 'unauthenticated',
            subscriptionTier: 'free',
            lifetimeAccess: false,
            dailyViews: 0,
            dailyLimit: 0,
            remainingViews: 0,
            daysUntilReset: 0,
            purchaseDate: null,
            isNewUser: false,
            accountAge: 0,
            canAccessPremiumFeatures: false,
            isAdmin: false,
            requiresAuth: true,
          },
        });
      }

      const user = await storage.getUser(userInfo.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Calculate days since account creation
      const accountAge = Math.floor(
        (Date.now() - new Date(user.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24)
      );
      const isNewUser = accountAge < 7;

      // Use centralized access control logic
      const userForAccessControl = {
        ...user,
        email: user.email || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
        isAdmin: user.isAdmin || undefined,
        lifetimeAccess: user.lifetimeAccess || undefined,
        subscriptionTier: user.subscriptionTier || undefined,
        purchaseDate: user.purchaseDate || undefined,
        dailyViews: user.dailyViews || undefined,
        lastViewReset: user.lastViewReset || undefined,
        referrerId: user.referrerId || undefined,
      };
      const accessStatus = getUserAccessStatus(userForAccessControl);
      const dailyLimits = accessStatus.dailyLimits;

      const status = {
        hasAccess: accessStatus.hasAccess,
        accessType: accessStatus.accessType,
        subscriptionTier: user.subscriptionTier || 'free',
        lifetimeAccess: user.lifetimeAccess || user.isAdmin || false,
        dailyViews: dailyLimits.dailyViews,
        dailyLimit: dailyLimits.limit,
        remainingViews: dailyLimits.remaining,
        daysUntilReset: accessStatus.accessType === 'free' ? 1 : 0,
        purchaseDate: user.purchaseDate?.toISOString(),
        isNewUser,
        accountAge,
        canAccessPremiumFeatures: accessStatus.canAccessPremiumFeatures,
        isAdmin: accessStatus.isAdmin,
        requiresAuth: false,
      };

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Error fetching access status', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return a graceful error response instead of 500
      res.json({
        success: true,
        data: {
          hasAccess: false,
          accessType: 'error',
          subscriptionTier: 'free',
          lifetimeAccess: false,
          dailyViews: 0,
          dailyLimit: 0,
          remainingViews: 0,
          daysUntilReset: 0,
          purchaseDate: null,
          isNewUser: false,
          accountAge: 0,
          canAccessPremiumFeatures: false,
          isAdmin: false,
          requiresAuth: true,
          error: 'Failed to fetch access status',
        },
      });
    }
  });

  // Daily usage statistics endpoint
  app.get('/api/user/daily-usage', authMiddleware as any, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      // const today = new Date().toISOString().split('T')[0]; // Currently not used

      // Get user info using storage
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Use centralized access control logic
      const userForAccessControl = {
        ...user,
        email: user.email || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
        isAdmin: user.isAdmin || undefined,
        lifetimeAccess: user.lifetimeAccess || undefined,
        subscriptionTier: user.subscriptionTier || undefined,
        purchaseDate: user.purchaseDate || undefined,
        dailyViews: user.dailyViews || undefined,
        lastViewReset: user.lastViewReset || undefined,
        referrerId: user.referrerId || undefined,
      };
      const accessStatus = getUserAccessStatus(userForAccessControl);
      const dailyLimits = accessStatus.dailyLimits;

      let isInGracePeriod = false;
      let gracePeriodDaysLeft = 0;

      const userCreatedAt = new Date(user.createdAt || new Date());
      const daysSinceCreation = Math.floor(
        (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const gracePeriodDays = 7; // Same as rate limiting config
      isInGracePeriod = daysSinceCreation <= gracePeriodDays;
      gracePeriodDaysLeft = Math.max(0, gracePeriodDays - daysSinceCreation);

      const todayViews = dailyLimits.dailyViews;

      const dailyLimit = dailyLimits.limit;
      const remainingViews = dailyLimits.remaining;

      res.json({
        success: true,
        data: {
          todayViews,
          dailyLimit,
          remainingViews,
          isInGracePeriod,
          gracePeriodDaysLeft,
          resetTime: 'tomorrow at midnight',
          percentageUsed: isInGracePeriod ? 0 : Math.round((todayViews / dailyLimit) * 100),
        },
      });
    } catch (error) {
      logger.error('Error fetching daily usage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch daily usage statistics',
      });
    }
  });

  // Term access check endpoint
  app.get(
    '/api/user/term-access/:termId',
    authMiddleware as any,
    parseId('termId'),
    async (req: AuthenticatedRequest & RequestWithParsedId, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const termId = req.parsedId;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }

        // Use centralized access control logic
        const userForAccessControl = {
          ...user,
          email: user.email || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          profileImageUrl: user.profileImageUrl || undefined,
          isAdmin: user.isAdmin || undefined,
          lifetimeAccess: user.lifetimeAccess || undefined,
          subscriptionTier: user.subscriptionTier || undefined,
          purchaseDate: user.purchaseDate || undefined,
          dailyViews: user.dailyViews || undefined,
          lastViewReset: user.lastViewReset || undefined,
          referrerId: user.referrerId || undefined,
        };
        const accessCheck = canViewTerm(userForAccessControl, termId);

        res.json({
          success: true,
          data: {
            canView: accessCheck.canView,
            reason: accessCheck.reason,
            ...accessCheck.metadata,
          },
        });
      } catch (error) {
        logger.error('Error checking term access', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to check term access',
        });
      }
    }
  );

  // Get enhanced user settings
  app.get(
    '/api/user/enhanced-settings',
    authMiddleware as any,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }

        // Get user preferences or create default ones
        const preferences = user.preferences || {};

        // Return enhanced settings
        const enhancedSettings = {
          userId: user.id,

          // Display preferences
          experienceLevel: preferences.experienceLevel || 'intermediate',
          preferredSections: preferences.preferredSections || [],
          hiddenSections: preferences.hiddenSections || [],

          // Content preferences
          showMathematicalDetails: preferences.showMathematicalDetails !== false,
          showCodeExamples: preferences.showCodeExamples !== false,
          showInteractiveElements: preferences.showInteractiveElements !== false,

          // Personalization
          favoriteCategories: preferences.favoriteCategories || [],
          favoriteApplications: preferences.favoriteApplications || [],

          // UI preferences
          compactMode: preferences.compactMode || false,
          darkMode: preferences.darkMode || false,

          // Include all other preferences
          ...preferences,

          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
        };

        res.json({
          success: true,
          data: enhancedSettings,
        });
      } catch (error) {
        logger.error('Error fetching enhanced settings', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to fetch enhanced settings',
        });
      }
    }
  );
}
