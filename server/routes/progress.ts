import { desc, eq } from 'drizzle-orm';
import type { Express } from 'express';
import { enhancedTerms, users, userTermHistory } from '../../shared/enhancedSchema';
import { db } from '../db';
import { getUserInfo, multiAuthMiddleware } from '../middleware/multiAuth';
import ProgressTrackingService from '../services/progressTrackingService';
import type { AuthenticatedRequest } from '../types/express';
import { log as logger } from '../utils/logger';

export function registerProgressRoutes(app: Express): void {
  // Get comprehensive progress statistics
  app.get('/api/progress/stats', multiAuthMiddleware, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const userId = userInfo.id;

      logger.info(`Fetching progress stats for user: ${userId}`);

      const stats = await ProgressTrackingService.getUserProgressStats(userId);
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching progress stats:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Failed to fetch progress statistics' });
    }
  });

  // Track term interaction
  app.post('/api/progress/track-interaction', multiAuthMiddleware, async (req, res) => {
    try {
      const userInfo = getUserInfo(req);
      if (!userInfo) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const userId = userInfo.id;

      const { termId, sectionsViewed = [], timeSpentSeconds = 0 } = req.body;

      if (!termId) {
        return res.status(400).json({ error: 'Term ID is required' });
      }

      await ProgressTrackingService.trackTermInteraction(
        userId,
        termId,
        sectionsViewed,
        timeSpentSeconds
      );

      res.json({ success: true });
    } catch (error) {
      logger.error('Error tracking term interaction:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Failed to track interaction' });
    }
  });

  // Toggle bookmark
  app.post('/api/progress/bookmark', async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { termId, isBookmarked } = req.body;

      if (!termId || typeof isBookmarked !== 'boolean') {
        return res.status(400).json({ error: 'Term ID and bookmark status are required' });
      }

      const result = await ProgressTrackingService.toggleBookmark(userId, termId, isBookmarked);

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      res.json(result);
    } catch (error) {
      logger.error('Error toggling bookmark:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Failed to toggle bookmark' });
    }
  });

  // Get user's bookmarks
  app.get('/api/progress/bookmarks', async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const bookmarks = await ProgressTrackingService.getUserBookmarks(userId, limit);

      res.json(bookmarks);
    } catch (error) {
      logger.error('Error fetching bookmarks:', error);
      res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
  });

  // Get bookmark count
  app.get('/api/progress/bookmark-count', async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const count = await ProgressTrackingService.getUserBookmarkCount(userId);
      const limits = ProgressTrackingService.getBookmarkLimits();

      res.json({
        count,
        limits,
        percentageUsed: limits.free > 0 ? Math.round((count / limits.free) * 100) : 0,
      });
    } catch (error) {
      logger.error('Error fetching bookmark count:', error);
      res.status(500).json({ error: 'Failed to fetch bookmark count' });
    }
  });

  // Get user's term history
  app.get('/api/progress/history', async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await db
        .select({
          termId: userTermHistory.termId,
          termName: enhancedTerms.name,
          termSlug: enhancedTerms.slug,
          firstViewedAt: userTermHistory.firstViewedAt,
          lastAccessedAt: userTermHistory.lastAccessedAt,
          viewCount: userTermHistory.viewCount,
          timeSpentSeconds: userTermHistory.timeSpentSeconds,
          completionPercentage: userTermHistory.completionPercentage,
          sectionsViewed: userTermHistory.sectionsViewed,
          isBookmarked: userTermHistory.isBookmarked,
          bookmarkDate: userTermHistory.bookmarkDate,
          difficultyLevel: enhancedTerms.difficultyLevel,
          mainCategories: enhancedTerms.mainCategories,
        })
        .from(userTermHistory)
        .innerJoin(enhancedTerms, eq(userTermHistory.termId, enhancedTerms.id))
        .where(eq(userTermHistory.userId, userId))
        .orderBy(desc(userTermHistory.lastAccessedAt))
        .limit(limit)
        .offset(offset);

      res.json(history);
    } catch (error) {
      logger.error('Error fetching term history:', error);
      res.status(500).json({ error: 'Failed to fetch term history' });
    }
  });

  // Get user achievements
  app.get('/api/progress/achievements', async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const stats = await ProgressTrackingService.getUserProgressStats(userId);
      res.json(stats.achievements);
    } catch (error) {
      logger.error('Error fetching achievements:', error);
      res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  });

  // Get upgrade prompt triggers
  app.get('/api/progress/upgrade-triggers', async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const stats = await ProgressTrackingService.getUserProgressStats(userId);
      res.json(stats.upgradePromptTriggers);
    } catch (error) {
      logger.error('Error fetching upgrade triggers:', error);
      res.status(500).json({ error: 'Failed to fetch upgrade triggers' });
    }
  });

  // Get daily learning stats
  app.get('/api/progress/daily-stats', async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const days = parseInt(req.query.days as string) || 30;
      const stats = await ProgressTrackingService.getUserProgressStats(userId);

      res.json(stats.dailyStats.slice(-days));
    } catch (error) {
      logger.error('Error fetching daily stats:', error);
      res.status(500).json({ error: 'Failed to fetch daily stats' });
    }
  });

  // Check if user should see upgrade prompt
  app.get('/api/progress/should-show-upgrade', async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user has premium access
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const isPremium = user[0]?.lifetimeAccess || false;

      if (isPremium) {
        return res.json({ shouldShow: false, triggers: [] });
      }

      const stats = await ProgressTrackingService.getUserProgressStats(userId);
      const highPriorityTriggers = stats.upgradePromptTriggers.filter((t) => t.severity === 'high');

      res.json({
        shouldShow: stats.upgradePromptTriggers.length > 0,
        triggers: stats.upgradePromptTriggers,
        highPriorityTriggers,
        stats: {
          totalBookmarks: stats.totalBookmarks,
          currentStreak: stats.currentStreak,
          totalTermsViewed: stats.totalTermsViewed,
          categoriesExplored: stats.categoriesExplored,
        },
      });
    } catch (error) {
      logger.error('Error checking upgrade prompt status:', error);
      res.status(500).json({ error: 'Failed to check upgrade prompt status' });
    }
  });

  // Get learning summary for dashboard
  app.get('/api/progress/summary', async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const stats = await ProgressTrackingService.getUserProgressStats(userId);

      // Create a condensed summary for dashboard use
      const summary = {
        totalTermsViewed: stats.totalTermsViewed,
        totalBookmarks: stats.totalBookmarks,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        categoriesExplored: stats.categoriesExplored,
        timeSpentHours: Math.floor(stats.timeSpentMinutes / 60),
        timeSpentMinutes: stats.timeSpentMinutes % 60,
        recentAchievements: stats.achievements.slice(0, 3),
        weeklyActivity: stats.dailyStats.slice(-7),
        upgradePromptAvailable: stats.upgradePromptTriggers.length > 0,
        topUpgradeTrigger: stats.upgradePromptTriggers[0] || null,
      };

      res.json(summary);
    } catch (error) {
      logger.error('Error fetching progress summary:', error);
      res.status(500).json({ error: 'Failed to fetch progress summary' });
    }
  });

  logger.info('Progress tracking routes registered');
}

export default registerProgressRoutes;
