import { and, count, desc, eq, sql, sum } from 'drizzle-orm';
import {
  enhancedTerms,
  termViews,
  userAchievements,
  users,
  userTermHistory,
} from '../../shared/enhancedSchema';
import { db } from '../db';
import { log as logger } from '../utils/logger';

export interface UserProgressStats {
  totalTermsViewed: number;
  totalBookmarks: number;
  currentStreak: number;
  bestStreak: number;
  categoriesExplored: number;
  timeSpentMinutes: number;
  achievements: Achievement[];
  dailyStats: DailyStats[];
  upgradePromptTriggers: UpgradePromptTrigger[];
}

export interface Achievement {
  id: string;
  type: string;
  value: number;
  currentStreak: number;
  bestStreak: number;
  progress: number;
  nextMilestone: number;
  unlockedAt: Date;
  isActive: boolean;
  metadata?: any;
}

export interface DailyStats {
  date: string;
  termsViewed: number;
  timeSpent: number;
  bookmarksCreated: number;
  categoriesExplored: number;
}

export interface UpgradePromptTrigger {
  type:
    | 'bookmark_limit'
    | 'high_engagement'
    | 'streak_milestone'
    | 'category_exploration'
    | 'historical_access';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata?: any;
}

export interface BookmarkLimits {
  free: number;
  premium: number;
}

export class ProgressTrackingService {
  private static bookmarkLimits: BookmarkLimits = {
    free: 50,
    premium: -1, // -1 means unlimited
  };

  // Track user interaction with a term
  static async trackTermInteraction(
    userId: string,
    termId: string,
    sectionsViewed: string[] = [],
    timeSpentSeconds: number = 0
  ): Promise<void> {
    try {
      // Check if interaction already exists
      const existingHistory = await db
        .select()
        .from(userTermHistory)
        .where(and(eq(userTermHistory.userId, userId), eq(userTermHistory.termId, termId)))
        .limit(1);

      if (existingHistory.length > 0) {
        // Update existing record
        const history = existingHistory[0];
        const newSectionsViewed = Array.from(
          new Set([...(history.sectionsViewed || []), ...sectionsViewed])
        );
        const newTimeSpent = (history.timeSpentSeconds || 0) + timeSpentSeconds;
        const newViewCount = (history.viewCount || 0) + 1;

        await db
          .update(userTermHistory)
          .set({
            lastAccessedAt: new Date(),
            viewCount: newViewCount,
            sectionsViewed: newSectionsViewed,
            timeSpentSeconds: newTimeSpent,
            completionPercentage: Math.min(100, Math.round((newSectionsViewed.length / 42) * 100)),
            updatedAt: new Date(),
          })
          .where(eq(userTermHistory.id, history.id));
      } else {
        // Create new record
        await db.insert(userTermHistory).values({
          userId,
          termId,
          sectionsViewed,
          timeSpentSeconds,
          viewCount: 1,
          completionPercentage: Math.round((sectionsViewed.length / 42) * 100),
          firstViewedAt: new Date(),
          lastAccessedAt: new Date(),
        });
      }

      // Update daily streak
      await ProgressTrackingService.updateDailyStreak(userId);

      // Update term views counter
      await ProgressTrackingService.updateTermViewsCounter(userId, termId);

      logger.info(`Tracked term interaction: ${userId} -> ${termId}`);
    } catch (error) {
      logger.error('Error tracking term interaction:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Toggle bookmark status
  static async toggleBookmark(
    userId: string,
    termId: string,
    isBookmarked: boolean
  ): Promise<{ success: boolean; message?: string; bookmarkCount?: number }> {
    try {
      // Check current bookmark count for free users
      const userBookmarkCount = await ProgressTrackingService.getUserBookmarkCount(userId);

      // Check if user has premium access
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const isPremium = user[0]?.lifetimeAccess || false;

      if (
        isBookmarked &&
        !isPremium &&
        userBookmarkCount >= ProgressTrackingService.bookmarkLimits.free
      ) {
        return {
          success: false,
          message: `Free users can only bookmark ${ProgressTrackingService.bookmarkLimits.free} terms. Upgrade to premium for unlimited bookmarks.`,
          bookmarkCount: userBookmarkCount,
        };
      }

      // Update bookmark status
      await db
        .update(userTermHistory)
        .set({
          isBookmarked,
          bookmarkDate: isBookmarked ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(and(eq(userTermHistory.userId, userId), eq(userTermHistory.termId, termId)));

      // If no existing history, create one
      const historyExists = await db
        .select({ id: userTermHistory.id })
        .from(userTermHistory)
        .where(and(eq(userTermHistory.userId, userId), eq(userTermHistory.termId, termId)))
        .limit(1);

      if (historyExists.length === 0) {
        await db.insert(userTermHistory).values({
          userId,
          termId,
          isBookmarked,
          bookmarkDate: isBookmarked ? new Date() : null,
          firstViewedAt: new Date(),
          lastAccessedAt: new Date(),
        });
      }

      // Update bookmarks achievement
      await ProgressTrackingService.updateBookmarksAchievement(userId);

      const newBookmarkCount = await ProgressTrackingService.getUserBookmarkCount(userId);

      return {
        success: true,
        bookmarkCount: newBookmarkCount,
      };
    } catch (error) {
      logger.error('Error toggling bookmark:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get user's bookmark count
  static async getUserBookmarkCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(userTermHistory)
        .where(and(eq(userTermHistory.userId, userId), eq(userTermHistory.isBookmarked, true)));

      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Error getting bookmark count:', error);
      return 0;
    }
  }

  // Get user's bookmarked terms
  static async getUserBookmarks(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const bookmarks = await db
        .select({
          termId: userTermHistory.termId,
          termName: enhancedTerms.name,
          termSlug: enhancedTerms.slug,
          bookmarkDate: userTermHistory.bookmarkDate,
          viewCount: userTermHistory.viewCount,
          completionPercentage: userTermHistory.completionPercentage,
          difficultyLevel: enhancedTerms.difficultyLevel,
          mainCategories: enhancedTerms.mainCategories,
        })
        .from(userTermHistory)
        .innerJoin(enhancedTerms, eq(userTermHistory.termId, enhancedTerms.id))
        .where(and(eq(userTermHistory.userId, userId), eq(userTermHistory.isBookmarked, true)))
        .orderBy(desc(userTermHistory.bookmarkDate))
        .limit(limit);

      return bookmarks;
    } catch (error) {
      logger.error('Error getting user bookmarks:', error);
      return [];
    }
  }

  // Get comprehensive user progress statistics
  static async getUserProgressStats(userId: string): Promise<UserProgressStats> {
    try {
      const [
        totalTermsViewed,
        totalBookmarks,
        achievements,
        dailyStats,
        timeSpentResult,
        categoriesResult,
      ] = await Promise.all([
        ProgressTrackingService.getTotalTermsViewed(userId),
        ProgressTrackingService.getUserBookmarkCount(userId),
        ProgressTrackingService.getUserAchievements(userId),
        ProgressTrackingService.getDailyStats(userId),
        ProgressTrackingService.getTotalTimeSpent(userId),
        ProgressTrackingService.getCategoriesExplored(userId),
      ]);

      const currentStreak = achievements.find((a) => a.type === 'daily_streak')?.currentStreak || 0;
      const bestStreak = achievements.find((a) => a.type === 'daily_streak')?.bestStreak || 0;

      const upgradePromptTriggers = await ProgressTrackingService.getUpgradePromptTriggers(userId, {
        totalTermsViewed,
        totalBookmarks,
        currentStreak,
        categoriesExplored: categoriesResult,
        timeSpentMinutes: Math.round(timeSpentResult / 60),
      });

      return {
        totalTermsViewed,
        totalBookmarks,
        currentStreak,
        bestStreak,
        categoriesExplored: categoriesResult,
        timeSpentMinutes: Math.round(timeSpentResult / 60),
        achievements,
        dailyStats,
        upgradePromptTriggers,
      };
    } catch (error) {
      logger.error('Error getting user progress stats:', error);
      throw error;
    }
  }

  // Get total terms viewed by user
  private static async getTotalTermsViewed(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(userTermHistory)
      .where(eq(userTermHistory.userId, userId));

    return result[0]?.count || 0;
  }

  // Get total time spent by user
  private static async getTotalTimeSpent(userId: string): Promise<number> {
    const result = await db
      .select({ total: sum(userTermHistory.timeSpentSeconds) })
      .from(userTermHistory)
      .where(eq(userTermHistory.userId, userId));

    return Number(result[0]?.total) || 0;
  }

  // Get categories explored by user
  private static async getCategoriesExplored(userId: string): Promise<number> {
    const result = await db
      .select({
        categories: sql<string[]>`array_agg(DISTINCT unnest(${enhancedTerms.mainCategories}))`,
      })
      .from(userTermHistory)
      .innerJoin(enhancedTerms, eq(userTermHistory.termId, enhancedTerms.id))
      .where(eq(userTermHistory.userId, userId));

    const categories = result[0]?.categories || [];
    return categories.filter((cat) => cat !== null).length;
  }

  // Get user achievements
  private static async getUserAchievements(userId: string): Promise<Achievement[]> {
    const achievements = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));

    return achievements.map((a) => ({
      id: a.id,
      type: a.achievementType,
      value: a.achievementValue,
      currentStreak: a.currentStreak,
      bestStreak: a.bestStreak,
      progress: a.progress,
      nextMilestone: a.nextMilestone || 0,
      unlockedAt: a.unlockedAt,
      isActive: a.isActive,
      metadata: a.metadata,
    }));
  }

  // Get daily statistics for the last 30 days
  private static async getDailyStats(userId: string, days: number = 30): Promise<DailyStats[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        date: sql<string>`DATE(${userTermHistory.lastAccessedAt})`,
        termsViewed: count(),
        timeSpent: sum(userTermHistory.timeSpentSeconds),
        bookmarksCreated: sql<number>`COUNT(CASE WHEN ${userTermHistory.isBookmarked} = true THEN 1 END)`,
        categoriesExplored: sql<number>`COUNT(DISTINCT unnest(${enhancedTerms.mainCategories}))`,
      })
      .from(userTermHistory)
      .innerJoin(enhancedTerms, eq(userTermHistory.termId, enhancedTerms.id))
      .where(
        and(
          eq(userTermHistory.userId, userId),
          sql`${userTermHistory.lastAccessedAt} >= ${startDate}`
        )
      )
      .groupBy(sql`DATE(${userTermHistory.lastAccessedAt})`)
      .orderBy(sql`DATE(${userTermHistory.lastAccessedAt})`);

    return stats.map((stat) => ({
      date: stat.date,
      termsViewed: stat.termsViewed,
      timeSpent: Number(stat.timeSpent) || 0,
      bookmarksCreated: stat.bookmarksCreated,
      categoriesExplored: stat.categoriesExplored,
    }));
  }

  // Generate upgrade prompt triggers based on user behavior
  private static async getUpgradePromptTriggers(
    userId: string,
    stats: {
      totalTermsViewed: number;
      totalBookmarks: number;
      currentStreak: number;
      categoriesExplored: number;
      timeSpentMinutes: number;
    }
  ): Promise<UpgradePromptTrigger[]> {
    const triggers: UpgradePromptTrigger[] = [];

    // Check if user has premium access
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const isPremium = user[0]?.lifetimeAccess || false;

    if (isPremium) {
      return triggers; // No upgrade prompts for premium users
    }

    // Bookmark limit trigger
    if (stats.totalBookmarks >= ProgressTrackingService.bookmarkLimits.free * 0.8) {
      triggers.push({
        type: 'bookmark_limit',
        severity:
          stats.totalBookmarks >= ProgressTrackingService.bookmarkLimits.free ? 'high' : 'medium',
        message: `You've used ${stats.totalBookmarks} of ${ProgressTrackingService.bookmarkLimits.free} free bookmarks. Upgrade for unlimited bookmarks!`,
        metadata: {
          currentBookmarks: stats.totalBookmarks,
          limit: ProgressTrackingService.bookmarkLimits.free,
        },
      });
    }

    // High engagement trigger
    if (stats.totalTermsViewed >= 100 && stats.timeSpentMinutes >= 120) {
      triggers.push({
        type: 'high_engagement',
        severity: 'medium',
        message: `You've explored ${stats.totalTermsViewed} terms and spent ${stats.timeSpentMinutes} minutes learning. Unlock your full potential with premium!`,
        metadata: { termsViewed: stats.totalTermsViewed, timeSpent: stats.timeSpentMinutes },
      });
    }

    // Streak milestone trigger
    if (stats.currentStreak >= 7 && stats.currentStreak % 7 === 0) {
      triggers.push({
        type: 'streak_milestone',
        severity: 'high',
        message: `Amazing! You've maintained a ${stats.currentStreak}-day learning streak. Celebrate with premium access!`,
        metadata: { streak: stats.currentStreak },
      });
    }

    // Category exploration trigger
    if (stats.categoriesExplored >= 15) {
      triggers.push({
        type: 'category_exploration',
        severity: 'medium',
        message: `You've explored ${stats.categoriesExplored} different AI/ML categories. Dive deeper with premium features!`,
        metadata: { categoriesExplored: stats.categoriesExplored },
      });
    }

    // Historical access trigger (check if user has been using the platform for 7+ days)
    const firstView = await db
      .select({ firstView: sql<Date>`MIN(${userTermHistory.firstViewedAt})` })
      .from(userTermHistory)
      .where(eq(userTermHistory.userId, userId));

    if (firstView[0]?.firstView) {
      const daysSinceFirst = Math.floor(
        (Date.now() - firstView[0].firstView.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceFirst >= 7) {
        triggers.push({
          type: 'historical_access',
          severity: 'low',
          message: `You've been learning with us for ${daysSinceFirst} days. Ready to unlock everything?`,
          metadata: { daysSinceFirst },
        });
      }
    }

    return triggers;
  }

  // Update daily streak achievement
  private static async updateDailyStreak(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if user has activity today
      const todayActivity = await db
        .select({ count: count() })
        .from(userTermHistory)
        .where(
          and(
            eq(userTermHistory.userId, userId),
            sql`DATE(${userTermHistory.lastAccessedAt}) = DATE(${today})`
          )
        );

      if (todayActivity[0]?.count === 0) {
        return; // No activity today, don't update streak
      }

      // Get or create streak achievement
      const streakAchievement = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementType, 'daily_streak')
          )
        )
        .limit(1);

      if (streakAchievement.length === 0) {
        // Create new streak achievement
        await db.insert(userAchievements).values({
          userId,
          achievementType: 'daily_streak',
          achievementValue: 1,
          currentStreak: 1,
          bestStreak: 1,
          lastStreakDate: today,
          progress: 1,
          nextMilestone: 7,
          isActive: true,
        });
      } else {
        const achievement = streakAchievement[0];
        const lastStreakDate = new Date(achievement.lastStreakDate || today);
        lastStreakDate.setHours(0, 0, 0, 0);

        let newStreak = achievement.currentStreak || 0;

        // Check if streak continues
        if (lastStreakDate.getTime() === yesterday.getTime()) {
          newStreak += 1;
        } else if (lastStreakDate.getTime() < yesterday.getTime()) {
          newStreak = 1; // Reset streak
        }

        await db
          .update(userAchievements)
          .set({
            currentStreak: newStreak,
            bestStreak: Math.max(achievement.bestStreak, newStreak || 0),
            lastStreakDate: today,
            progress: newStreak,
            nextMilestone: Math.ceil((newStreak || 0) / 7) * 7,
            updatedAt: new Date(),
          })
          .where(eq(userAchievements.id, achievement.id));
      }
    } catch (error) {
      logger.error('Error updating daily streak:', error);
    }
  }

  // Update bookmarks achievement
  private static async updateBookmarksAchievement(userId: string): Promise<void> {
    try {
      const bookmarkCount = await ProgressTrackingService.getUserBookmarkCount(userId);

      const bookmarksAchievement = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementType, 'bookmarks_created')
          )
        )
        .limit(1);

      const nextMilestone = Math.ceil(bookmarkCount / 10) * 10;

      if (bookmarksAchievement.length === 0) {
        await db.insert(userAchievements).values({
          userId,
          achievementType: 'bookmarks_created',
          achievementValue: bookmarkCount,
          progress: bookmarkCount,
          nextMilestone,
          isActive: true,
        });
      } else {
        await db
          .update(userAchievements)
          .set({
            achievementValue: bookmarkCount,
            progress: bookmarkCount,
            nextMilestone,
            updatedAt: new Date(),
          })
          .where(eq(userAchievements.id, bookmarksAchievement[0].id));
      }
    } catch (error) {
      logger.error('Error updating bookmarks achievement:', error);
    }
  }

  // Update term views counter (for legacy compatibility)
  private static async updateTermViewsCounter(userId: string, termId: string): Promise<void> {
    try {
      // Check if view already exists for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingView = await db
        .select()
        .from(termViews)
        .where(
          and(
            eq(termViews.userId, userId),
            eq(termViews.termId, termId),
            sql`DATE(${termViews.viewedAt}) = DATE(${today})`
          )
        )
        .limit(1);

      if (existingView.length === 0) {
        await db.insert(termViews).values({
          userId,
          termId,
          viewedAt: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error updating term views counter:', error);
    }
  }

  // Get bookmark limits for user type
  static getBookmarkLimits(): BookmarkLimits {
    return ProgressTrackingService.bookmarkLimits;
  }
}

export default ProgressTrackingService;
