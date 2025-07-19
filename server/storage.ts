import {
  categories,
  favorites,
  subcategories,
  termSubcategories,
  terms,
  termViews,
  userProgress,
  userSettings,
  users,
} from '@shared/enhancedSchema';
import type { InsertPurchase, Purchase, UpsertUser, User } from '@shared/schema';
import { purchases } from '@shared/schema';
import { endOfDay, format, formatDistanceToNow, startOfDay, subDays } from 'date-fns';
import { and, desc, eq, gte, ilike, isNull, lte, not, sql } from 'drizzle-orm';
import { db } from './db';

import logger from './utils/logger';
// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<any[]>;
  getCategoryById(id: string): Promise<any>;

  // Term operations
  getFeaturedTerms(): Promise<any[]>;
  getTermById(id: string): Promise<any>;
  getRecentlyViewedTerms(userId: string): Promise<any[]>;
  recordTermView(termId: string, userId: string | null): Promise<void>;
  searchTerms(query: string): Promise<any[]>;

  // Favorites operations
  getUserFavorites(userId: string): Promise<any[]>;
  isTermFavorite(userId: string, termId: string): Promise<boolean>;
  addFavorite(userId: string, termId: string): Promise<void>;
  removeFavorite(userId: string, termId: string): Promise<void>;

  // Progress operations
  getUserProgress(userId: string): Promise<any>;
  isTermLearned(userId: string, termId: string): Promise<boolean>;
  markTermAsLearned(userId: string, termId: string): Promise<void>;
  unmarkTermAsLearned(userId: string, termId: string): Promise<void>;

  // User activity operations
  getUserActivity(userId: string): Promise<any>;
  getUserStreak(userId: string): Promise<any>;

  // Recommendations
  getRecommendedTerms(userId: string): Promise<any[]>;
  getRecommendedTermsForTerm(termId: string, userId: string | null): Promise<any[]>;

  // Settings
  getUserSettings(userId: string): Promise<any>;
  updateUserSettings(userId: string, settings: any): Promise<void>;

  // Analytics
  getAnalytics(): Promise<any>;

  // User data
  exportUserData(userId: string): Promise<any>;
  deleteUserData(userId: string): Promise<void>;

  // Monetization operations
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;

  // Revenue tracking
  getTotalRevenue(): Promise<number>;
  getTotalPurchases(): Promise<number>;
  getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getPurchasesForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getTotalUsers(): Promise<number>;
  getRevenueByCurrency(): Promise<Array<{ currency: string; amount: number; count: number }>>;
  getDailyRevenueForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; revenue: number; purchases: number }>>;
  getRecentPurchases(options: any): Promise<any>;
  getRevenueByPeriod(startDate: Date, endDate: Date, groupBy: string): Promise<Array<any>>;
  getTopCountriesByRevenue(limit: number): Promise<Array<any>>;
  getConversionFunnel(): Promise<any>;
  getRefundAnalytics(startDate: Date, endDate: Date): Promise<any>;
  getPurchasesForExport(startDate: Date, endDate: Date): Promise<Array<any>>;
  getRecentWebhookActivity(limit: number): Promise<Array<any>>;
  getPurchaseByOrderId(gumroadOrderId: string): Promise<Purchase | undefined>;
  updateUserAccess(userId: string, updates: any): Promise<void>;

  // Admin operations
  getAdminStats(): Promise<any>;
  clearAllData(): Promise<void>;

  // Content Management Methods
  getPendingContent?(): Promise<any[]>;
  approveContent?(id: string): Promise<any>;
  rejectContent?(id: string): Promise<any>;

  // Feedback System Methods
  submitFeedback?(feedback: any): Promise<void>;
  storeFeedback?(feedback: any): Promise<void>;
  getFeedback?(filters?: any, pagination?: any): Promise<any>;
  getFeedbackStats?(): Promise<any>;
  updateFeedbackStatus?(id: string, status: any, notes?: string): Promise<any>;
  initializeFeedbackSchema?(): Promise<void>;
  createFeedbackIndexes?(): Promise<void>;
  getRecentFeedback?(limit: number): Promise<any[]>;

  // Enhanced Term Management Methods
  getTermsByIds?(ids: string[]): Promise<any[]>;
  getEnhancedTermById?(id: string): Promise<any>;
  updateEnhancedTerm?(id: string, data: any): Promise<void>;
  getTermSections?(termId: string): Promise<any[]>;
  updateTermSection?(termId: string, sectionId: string, data: any): Promise<void>;
  incrementTermViewCount?(termId: string): Promise<void>;
  getTermsOptimized?(options?: { limit?: number }): Promise<any[]>;

  // User Analytics and Progress Tracking Methods
  getUserAnalytics?(userId: string): Promise<any>;
  getUserSectionProgress?(userId: string, options?: any): Promise<any[]>;
  trackTermView?(userId: string, termId: string, sectionId?: string): Promise<void>;
  trackSectionCompletion?(userId: string, termId: string, sectionId: string): Promise<void>;
  updateUserProgress?(userId: string, updates: any): Promise<void>;
  getUserTimeSpent?(userId: string, timeframe?: string): Promise<number>;
  getCategoryProgress?(userId: string): Promise<any[]>;

  // Streak and Achievement Methods
  updateUserStreak?(userId: string, streak: any): Promise<void>;
  isAchievementUnlocked?(userId: string, achievementId: string): Promise<boolean>;
  unlockAchievement?(userId: string, achievement: any): Promise<void>;

  // Admin and Bulk Operations Methods
  getAllTerms?(options?: any): Promise<any>;
  getRecentTerms?(limit: number): Promise<any[]>;
  deleteTerm?(id: string): Promise<void>;
  bulkDeleteTerms?(ids: string[]): Promise<any>;
  bulkUpdateTermCategory?(ids: string[], categoryId: string): Promise<any>;
  bulkUpdateTermStatus?(ids: string[], status: string): Promise<any>;
  getTermsOptimized?(options?: { limit?: number }): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<any[]> {
    // Get all categories with term counts in a single optimized query
    const categoriesWithCount = await db
      .select({
        id: categories.id,
        name: categories.name,
        termCount: sql<number>`count(DISTINCT ${terms.id})`,
      })
      .from(categories)
      .leftJoin(terms, eq(categories.id, terms.categoryId))
      .groupBy(categories.id, categories.name)
      .orderBy(categories.name);

    // Get all subcategories in a single query
    const allSubcategories = await db
      .select({
        id: subcategories.id,
        name: subcategories.name,
        categoryId: subcategories.categoryId,
      })
      .from(subcategories)
      .orderBy(subcategories.name);

    // Group subcategories by category ID for efficient lookup
    const subcategoriesByCategory = new Map<string, any[]>();
    for (const subcat of allSubcategories) {
      if (!subcategoriesByCategory.has(subcat.categoryId)) {
        subcategoriesByCategory.set(subcat.categoryId, []);
      }
      subcategoriesByCategory.get(subcat.categoryId)?.push(subcat);
    }

    // Combine categories with their subcategories
    const result = categoriesWithCount.map(category => ({
      ...category,
      subcategories: subcategoriesByCategory.get(category.id) || [],
    }));

    return result;
  }

  async getCategoryById(id: string): Promise<any> {
    // Get the category
    const [category] = await db.select().from(categories).where(eq(categories.id, id));

    if (!category) {
      return null;
    }

    // Get subcategories
    const subcats = await db
      .select()
      .from(subcategories)
      .where(eq(subcategories.categoryId, id))
      .orderBy(subcategories.name);

    // Get terms in this category
    const termsInCategory = await db
      .select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
        viewCount: terms.viewCount,
      })
      .from(terms)
      .where(eq(terms.categoryId, id))
      .orderBy(terms.name);

    return {
      ...category,
      subcategories: subcats,
      terms: termsInCategory,
    };
  }

  // Term operations
  async getFeaturedTerms(): Promise<any[]> {
    // Get terms with high view counts or manually featured - OPTIMIZED VERSION
    const featuredTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        definition: terms.definition,
        viewCount: terms.viewCount,
        category: categories.name,
        categoryId: categories.id,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .orderBy(desc(terms.viewCount))
      .limit(6);

    // Return without subcategories for now to fix performance
    // TODO: Implement efficient subcategory loading if needed
    return featuredTerms.map(term => ({
      ...term,
      subcategories: [], // Empty for performance - can be populated later if needed
    }));
  }

  async getTermById(id: string): Promise<any> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return null;
    }
    // Get the term with category
    const [term] = await db
      .select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        definition: terms.definition,
        characteristics: terms.characteristics,
        visualUrl: terms.visualUrl,
        visualCaption: terms.visualCaption,
        mathFormulation: terms.mathFormulation,
        applications: terms.applications,
        references: terms.references,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
        category: categories.name,
        categoryId: categories.id,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(eq(terms.id, id));

    if (!term) {
      return null;
    }

    // Get subcategories for this term
    const termSubcats = await db
      .select({
        id: subcategories.id,
        name: subcategories.name,
      })
      .from(termSubcategories)
      .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
      .where(eq(termSubcategories.termId, id));

    // Get related terms (simpler approach - terms in the same category)
    const relatedTerms = term.categoryId
      ? await db
          .select({
            id: terms.id,
            name: terms.name,
          })
          .from(terms)
          .where(and(eq(terms.categoryId, term.categoryId), not(eq(terms.id, id))))
          .limit(6)
      : [];

    // Format the date
    const formattedDate = term.updatedAt
      ? format(term.updatedAt, 'MMMM d, yyyy')
      : term.createdAt
        ? format(term.createdAt, 'MMMM d, yyyy')
        : 'Unknown date';

    return {
      ...term,
      updatedAt: formattedDate,
      subcategories: termSubcats.map(sc => sc.name),
      relatedTerms,
    };
  }

  async getRecentlyViewedTerms(userId: string): Promise<any[]> {
    // Get recently viewed terms with relative time
    const recentViews = await db
      .select({
        termId: termViews.termId,
        viewedAt: termViews.viewedAt,
        name: terms.name,
        category: categories.name,
      })
      .from(termViews)
      .innerJoin(terms, eq(termViews.termId, terms.id))
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(eq(termViews.userId, userId))
      .orderBy(desc(termViews.viewedAt))
      .limit(10);

    // Format the dates
    return recentViews.map(view => ({
      id: view.termId,
      name: view.name,
      category: view.category,
      viewedAt: view.viewedAt?.toISOString() || new Date().toISOString(),
      relativeTime: view.viewedAt
        ? formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true })
        : 'Never',
    }));
  }

  async recordTermView(termId: string, userId: string | null): Promise<void> {
    // First, check if the term exists
    const [term] = await db
      .select({
        id: terms.id,
        viewCount: terms.viewCount,
      })
      .from(terms)
      .where(eq(terms.id, termId));

    if (!term) {
      throw new Error('Term not found');
    }

    // Update view count on the term
    await db
      .update(terms)
      .set({
        viewCount: (term.viewCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(terms.id, termId));

    // If user is authenticated, record this view
    if (userId) {
      // Insert the view
      await db
        .insert(termViews)
        .values({
          termId,
          userId,
          viewedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [termViews.termId, termViews.userId],
          set: { viewedAt: new Date() },
        });
    }
  }

  async searchTerms(query: string): Promise<any[]> {
    // Search for terms matching the query - simplified version
    const results = await db
      .select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        category: categories.name,
        categoryId: categories.id,
        viewCount: terms.viewCount,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(ilike(terms.name, `%${query}%`))
      .orderBy(terms.name)
      .limit(20);

    // For each term, get its subcategories
    const resultWithSubcats = [];

    for (const term of results) {
      // Get subcategories for this term
      const termSubcats = await db
        .select({
          name: subcategories.name,
        })
        .from(termSubcategories)
        .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(eq(termSubcategories.termId, term.id));

      resultWithSubcats.push({
        ...term,
        subcategories: termSubcats.map(sc => sc.name),
      });
    }

    return resultWithSubcats;
  }

  // Favorites operations
  async getFavorites(userId: string): Promise<any[]> {
    // Get user's favorite terms
    const userFavorites = await db
      .select({
        termId: favorites.termId,
        createdAt: favorites.createdAt,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        viewCount: terms.viewCount,
        category: categories.name,
        categoryId: categories.id,
      })
      .from(favorites)
      .innerJoin(terms, eq(favorites.termId, terms.id))
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    // For each term, get its subcategories
    const result = [];

    for (const fav of userFavorites) {
      // Get subcategories for this term
      const termSubcats = await db
        .select({
          name: subcategories.name,
        })
        .from(termSubcategories)
        .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(eq(termSubcategories.termId, fav.termId));

      result.push({
        id: fav.termId,
        name: fav.name,
        shortDefinition: fav.shortDefinition,
        viewCount: fav.viewCount,
        category: fav.category,
        categoryId: fav.categoryId,
        favoriteDate: fav.createdAt?.toISOString() || new Date().toISOString(),
        subcategories: termSubcats.map(sc => sc.name),
      });
    }

    return result;
  }

  async getUserFavorites(userId: string): Promise<any[]> {
    return this.getFavorites(userId);
  }

  async isTermFavorite(userId: string, termId: string): Promise<boolean> {
    // Check if the term is in user's favorites
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.termId, termId)));

    return !!favorite;
  }

  async addFavorite(userId: string, termId: string): Promise<void> {
    // First check if the term exists
    const [term] = await db.select().from(terms).where(eq(terms.id, termId));

    if (!term) {
      throw new Error('Term not found');
    }

    // Add to favorites
    await db
      .insert(favorites)
      .values({
        userId,
        termId,
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  }

  async removeFavorite(userId: string, termId: string): Promise<void> {
    // Remove from favorites
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.termId, termId)));
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<any> {
    // Get total terms count
    const [{ count: totalTerms }] = await db
      .select({
        count: sql<number>`count(${terms.id})`,
      })
      .from(terms);

    // Get learned terms count
    const [{ count: termsLearned }] = await db
      .select({
        count: sql<number>`count(${userProgress.termId})`,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    // Get user activity for last week
    const lastWeekActivity = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const startOfDayDate = startOfDay(day);
      const endOfDayDate = endOfDay(day);

      // Count views on this day
      const [{ count }] = await db
        .select({
          count: sql<number>`count(${termViews.id})`,
        })
        .from(termViews)
        .where(
          and(
            eq(termViews.userId, userId),
            gte(termViews.viewedAt, startOfDayDate),
            lte(termViews.viewedAt, endOfDayDate)
          )
        );

      lastWeekActivity.push(count);
    }

    // Calculate streak
    // Get all days with activity, ordered by date
    const activeViews = await db
      .select({
        day: sql<string>`date_trunc('day', ${termViews.viewedAt})`,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId))
      .groupBy(sql`date_trunc('day', ${termViews.viewedAt})`)
      .orderBy(desc(sql`date_trunc('day', ${termViews.viewedAt})`));

    let streak = 0;
    if (activeViews.length > 0) {
      const now = new Date();
      const yesterday = startOfDay(subDays(now, 1));
      const lastActive = new Date(activeViews[0].day);

      // Check if user was active today or yesterday
      if (
        startOfDay(lastActive).getTime() === startOfDay(now).getTime() ||
        startOfDay(lastActive).getTime() === yesterday.getTime()
      ) {
        streak = 1;

        // Count consecutive days backwards
        for (let i = 1; i < activeViews.length; i++) {
          const currentDay = new Date(activeViews[i].day);
          const previousDay = new Date(activeViews[i - 1].day);

          // Check if days are consecutive
          const diffInDays = Math.round(
            (startOfDay(previousDay).getTime() - startOfDay(currentDay).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (diffInDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      termsLearned,
      totalTerms,
      streak,
      lastWeekActivity,
    };
  }

  async isTermLearned(userId: string, termId: string): Promise<boolean> {
    // Check if the term is marked as learned
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)));

    return !!progress;
  }

  async markTermAsLearned(userId: string, termId: string): Promise<void> {
    // First check if the term exists
    const [term] = await db.select().from(terms).where(eq(terms.id, termId));

    if (!term) {
      throw new Error('Term not found');
    }

    // Mark as learned
    await db
      .insert(userProgress)
      .values({
        userId,
        termId,
        learnedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  async unmarkTermAsLearned(userId: string, termId: string): Promise<void> {
    // Unmark as learned
    await db
      .delete(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)));
  }

  // User activity operations
  async getUserActivity(userId: string): Promise<any> {
    // Get view counts per day for last 14 days
    const viewsData = [];
    const learnedData = [];
    const labels = [];

    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'MMM d');
      labels.push(dateStr);

      const startOfDayDate = startOfDay(day);
      const endOfDayDate = endOfDay(day);

      // Count views on this day
      const [{ count: viewCount }] = await db
        .select({
          count: sql<number>`count(${termViews.id})`,
        })
        .from(termViews)
        .where(
          and(
            eq(termViews.userId, userId),
            gte(termViews.viewedAt, startOfDayDate),
            lte(termViews.viewedAt, endOfDayDate)
          )
        );

      // Count terms learned on this day
      const [{ count: learnedCount }] = await db
        .select({
          count: sql<number>`count(${userProgress.termId})`,
        })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            gte(userProgress.learnedAt, startOfDayDate),
            lte(userProgress.learnedAt, endOfDayDate)
          )
        );

      viewsData.push(viewCount);
      learnedData.push(learnedCount);
    }

    // Get total views
    const [{ count: totalViews }] = await db
      .select({
        count: sql<number>`count(${termViews.id})`,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId));

    // Get unique categories explored
    const exploreCounts = await db
      .select({
        categoryId: terms.categoryId,
      })
      .from(termViews)
      .innerJoin(terms, eq(termViews.termId, terms.id))
      .where(eq(termViews.userId, userId))
      .groupBy(terms.categoryId);

    const categoriesExplored = exploreCounts.length;

    // Get last activity
    const [lastView] = await db
      .select({
        viewedAt: termViews.viewedAt,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId))
      .orderBy(desc(termViews.viewedAt))
      .limit(1);

    const lastActivity = lastView?.viewedAt
      ? formatDistanceToNow(new Date(lastView.viewedAt), { addSuffix: true })
      : 'Never';

    return {
      labels,
      views: viewsData,
      learned: learnedData,
      totalViews,
      categoriesExplored,
      lastActivity,
    };
  }

  async getUserStreak(userId: string): Promise<any> {
    // Get all days with activity, ordered by date
    const activeViews = await db
      .select({
        day: sql<string>`date_trunc('day', ${termViews.viewedAt})`,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId))
      .groupBy(sql`date_trunc('day', ${termViews.viewedAt})`)
      .orderBy(desc(sql`date_trunc('day', ${termViews.viewedAt})`));

    // Calculate current streak
    let currentStreak = 0;
    let bestStreak = 0;

    if (activeViews.length > 0) {
      const now = new Date();
      const yesterday = startOfDay(subDays(now, 1));
      const lastActive = new Date(activeViews[0].day);

      // Check if user was active today or yesterday
      if (
        startOfDay(lastActive).getTime() === startOfDay(now).getTime() ||
        startOfDay(lastActive).getTime() === yesterday.getTime()
      ) {
        currentStreak = 1;

        // Count consecutive days backwards
        for (let i = 1; i < activeViews.length; i++) {
          const currentDay = new Date(activeViews[i].day);
          const previousDay = new Date(activeViews[i - 1].day);

          // Check if days are consecutive
          const diffInDays = Math.round(
            (startOfDay(previousDay).getTime() - startOfDay(currentDay).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (diffInDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate best streak
      bestStreak = currentStreak;
      let tempStreak = 0;

      for (let i = 0; i < activeViews.length - 1; i++) {
        const currentDay = new Date(activeViews[i].day);
        const nextDay = new Date(activeViews[i + 1].day);

        // Check if days are consecutive
        const diffInDays = Math.round(
          (startOfDay(currentDay).getTime() - startOfDay(nextDay).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffInDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 0;
        }

        bestStreak = Math.max(bestStreak, tempStreak + 1);
      }
    }

    // Get activity for last week
    const lastWeek = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const startOfDayDate = startOfDay(day);
      const endOfDayDate = endOfDay(day);

      // Check if user was active on this day
      const [{ count }] = await db
        .select({
          count: sql<number>`count(${termViews.id})`,
        })
        .from(termViews)
        .where(
          and(
            eq(termViews.userId, userId),
            gte(termViews.viewedAt, startOfDayDate),
            lte(termViews.viewedAt, endOfDayDate)
          )
        );

      lastWeek.push(count > 0);
    }

    return {
      currentStreak,
      bestStreak,
      lastWeek,
    };
  }

  // Recommendations
  async getRecommendedTerms(userId: string): Promise<any[]> {
    // Strategy:
    // 1. Find categories and subcategories from viewed/learned terms
    // 2. Find other terms in those categories that user hasn't viewed yet
    // 3. Add some popular terms as recommendations too

    // Get user's viewed terms
    const viewedTerms = await db
      .select({
        termId: termViews.termId,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId));

    const viewedTermIds = viewedTerms.map(v => v.termId);

    // Get categories from viewed terms
    const viewedCategories = await db
      .select({
        categoryId: terms.categoryId,
      })
      .from(terms)
      .where(
        and(
          not(isNull(terms.categoryId)),
          sql`${terms.id} IN (${viewedTermIds.length > 0 ? viewedTermIds : ['00000000-0000-0000-0000-000000000000']})`
        )
      )
      .groupBy(terms.categoryId);

    const categoryIds = viewedCategories.map(c => c.categoryId);

    // Get related terms from the same categories, excluding already viewed
    const recommendedTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        viewCount: terms.viewCount,
        category: categories.name,
        categoryId: categories.id,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(
        and(
          ...(categoryIds.length > 0 ? [sql`${terms.categoryId} IN (${categoryIds})`] : []),
          viewedTermIds.length > 0 ? not(sql`${terms.id} IN (${viewedTermIds})`) : sql`1=1`
        )
      )
      .orderBy(desc(terms.viewCount))
      .limit(6);

    // If we don't have enough, add popular terms
    if (recommendedTerms.length < 6) {
      const popularTerms = await db
        .select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(viewedTermIds.length > 0 ? not(sql`${terms.id} IN (${viewedTermIds})`) : sql`1=1`)
        .orderBy(desc(terms.viewCount))
        .limit(6 - recommendedTerms.length);

      recommendedTerms.push(...popularTerms);
    }

    // Get subcategories for each term
    const result = [];

    for (const term of recommendedTerms) {
      // Check if this term is a favorite
      const [favorite] = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.termId, term.id)));

      // Get subcategories for this term
      const termSubcats = await db
        .select({
          name: subcategories.name,
        })
        .from(termSubcategories)
        .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(eq(termSubcategories.termId, term.id));

      result.push({
        ...term,
        isFavorite: !!favorite,
        subcategories: termSubcats.map(sc => sc.name),
      });
    }

    return result;
  }

  async getRecommendedTermsForTerm(termId: string, userId: string | null): Promise<any[]> {
    try {
      // Get the term to find its category
      const [term] = await db
        .select({
          id: terms.id,
          categoryId: terms.categoryId,
        })
        .from(terms)
        .where(eq(terms.id, termId));

      if (!term) {
        throw new Error('Term not found');
      }

      // Build WHERE conditions - always exclude the current term
      const whereConditions = [not(eq(terms.id, termId))];

      // If term has a category, add category filter
      if (term.categoryId) {
        whereConditions.push(eq(terms.categoryId, term.categoryId));
      }

      // Only proceed if we have valid WHERE conditions
      if (whereConditions.length === 0) {
        return [];
      }

      // Find terms with same category, excluding the current term
      const relatedTerms = await db
        .select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
        .orderBy(desc(terms.viewCount))
        .limit(3);

      // Get subcategories and favorite status for each term
      const result = [];

      for (const relTerm of relatedTerms) {
        // Check if this term is a favorite (if user is authenticated)
        let isFavorite = false;

        if (userId) {
          try {
            const [favorite] = await db
              .select()
              .from(favorites)
              .where(and(eq(favorites.userId, userId), eq(favorites.termId, relTerm.id)));

            isFavorite = !!favorite;
          } catch (favoriteError) {
            logger.warn(`Could not check favorite status for term ${relTerm.id}:`, favoriteError);
            isFavorite = false;
          }
        }

        // Get subcategories for this term
        let termSubcats: Array<{ name: string }> = [];
        try {
          termSubcats = await db
            .select({
              name: subcategories.name,
            })
            .from(termSubcategories)
            .innerJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
            .where(eq(termSubcategories.termId, relTerm.id));
        } catch (subcatError) {
          logger.warn(`Could not fetch subcategories for term ${relTerm.id}:`, subcatError);
          termSubcats = [];
        }

        result.push({
          ...relTerm,
          isFavorite,
          subcategories: termSubcats.map(sc => sc.name),
        });
      }

      return result;
    } catch (error) {
      logger.error('Error in getRecommendedTermsForTerm:', error);
      throw error;
    }
  }

  // Settings
  async getUserSettings(userId: string): Promise<any> {
    // Get user settings or create default
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));

    if (settings) {
      return settings;
    }

    // Create default settings
    const defaultPreferences = {
      emailNotifications: true,
      progressTracking: true,
      shareActivity: false,
    };

    const [newSettings] = await db
      .insert(userSettings)
      .values({
        userId,
        preferences: defaultPreferences,
      })
      .returning();

    return newSettings;
  }

  async updateUserSettings(userId: string, settings: any): Promise<void> {
    // Update settings
    await db
      .insert(userSettings)
      .values({
        userId,
        ...settings,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      });
  }

  // Analytics
  async getAnalytics(): Promise<any> {
    // Get total users
    const [{ count: totalUsers }] = await db
      .select({
        count: sql<number>`count(${users.id})`,
      })
      .from(users);

    // Get total terms
    const [{ count: totalTerms }] = await db
      .select({
        count: sql<number>`count(${terms.id})`,
      })
      .from(terms);

    // Get total views
    const [{ count: totalViews }] = await db
      .select({
        count: sql<number>`count(${termViews.id})`,
      })
      .from(termViews);

    // Get total favorites
    const [{ count: totalFavorites }] = await db
      .select({
        count: sql<number>`count(${favorites.id})`,
      })
      .from(favorites);

    // Get top terms by views
    const topTerms = await db
      .select({
        name: terms.name,
        views: terms.viewCount,
      })
      .from(terms)
      .orderBy(desc(terms.viewCount))
      .limit(10);

    // Get categories distribution
    const categoryDistribution = await db
      .select({
        name: categories.name,
        count: sql<number>`count(${terms.id})`,
      })
      .from(categories)
      .leftJoin(terms, eq(categories.id, terms.categoryId))
      .groupBy(categories.id)
      .having(sql`count(${terms.id}) > 0`)
      .orderBy(desc(sql`count(${terms.id})`));

    // Get user activity over time (last 30 days)
    const userActivity = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'MMM d');

      const startOfDayDate = startOfDay(day);
      const endOfDayDate = endOfDay(day);

      // Count views on this day
      const [{ count }] = await db
        .select({
          count: sql<number>`count(${termViews.id})`,
        })
        .from(termViews)
        .where(and(gte(termViews.viewedAt, startOfDayDate), lte(termViews.viewedAt, endOfDayDate)));

      userActivity.push({
        date: dateStr,
        count,
      });
    }

    return {
      totalUsers,
      totalTerms,
      totalViews,
      totalFavorites,
      topTerms,
      categoriesDistribution: categoryDistribution,
      userActivity,
    };
  }

  // User data export/delete
  async exportUserData(userId: string): Promise<any> {
    // Get user info
    const user = await this.getUser(userId);

    // Get user's favorites
    const favorites = await this.getFavorites(userId);

    // Get user's progress
    const learned = await db
      .select({
        termId: userProgress.termId,
        learnedAt: userProgress.learnedAt,
        name: terms.name,
      })
      .from(userProgress)
      .innerJoin(terms, eq(userProgress.termId, terms.id))
      .where(eq(userProgress.userId, userId));

    // Get user's views
    const views = await db
      .select({
        termId: termViews.termId,
        viewedAt: termViews.viewedAt,
        name: terms.name,
      })
      .from(termViews)
      .innerJoin(terms, eq(termViews.termId, terms.id))
      .where(eq(termViews.userId, userId));

    // Get user's settings
    const settings = await this.getUserSettings(userId);

    return {
      user: {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        createdAt: user?.createdAt,
      },
      favorites,
      learned: learned.map(item => ({
        termId: item.termId,
        name: item.name,
        learnedAt: item.learnedAt?.toISOString() || new Date().toISOString(),
      })),
      views: views.map(item => ({
        termId: item.termId,
        name: item.name,
        viewedAt: item.viewedAt?.toISOString() || new Date().toISOString(),
      })),
      settings,
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    // Delete user's data (but not the user account itself)
    await db.delete(favorites).where(eq(favorites.userId, userId));

    await db.delete(userProgress).where(eq(userProgress.userId, userId));

    await db.delete(termViews).where(eq(termViews.userId, userId));

    await db.delete(userSettings).where(eq(userSettings.userId, userId));
  }

  // Admin operations
  async getAdminStats(): Promise<any> {
    // Get total terms
    const [{ count: totalTerms }] = await db
      .select({
        count: sql<number>`count(${terms.id})`,
      })
      .from(terms);

    // Get total categories
    const [{ count: totalCategories }] = await db
      .select({
        count: sql<number>`count(${categories.id})`,
      })
      .from(categories);

    // Get total views
    const [{ count: totalViews }] = await db
      .select({
        count: sql<number>`count(${termViews.id})`,
      })
      .from(termViews);

    // Get total users
    const [{ count: totalUsers }] = await db
      .select({
        count: sql<number>`count(${users.id})`,
      })
      .from(users);

    // Get last updated date
    const [lastTerm] = await db
      .select({
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .orderBy(desc(terms.updatedAt))
      .limit(1);

    const lastUpdated = lastTerm?.updatedAt
      ? format(new Date(lastTerm.updatedAt), 'MMMM d, yyyy h:mm a')
      : null;

    return {
      totalTerms,
      totalCategories,
      totalViews,
      totalUsers,
      lastUpdated,
    };
  }

  // Monetization operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  // Revenue tracking methods
  async getTotalRevenue(): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'));

    return result[0]?.total || 0;
  }

  async getTotalPurchases(): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'));

    return result[0]?.count || 0;
  }

  async getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      );

    return result[0]?.total || 0;
  }

  async getPurchasesForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      );

    return result[0]?.count || 0;
  }

  async getTotalUsers(): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(users);

    return result[0]?.count || 0;
  }

  async getRevenueByCurrency(): Promise<
    Array<{ currency: string; amount: number; count: number }>
  > {
    const result = await db
      .select({
        currency: purchases.currency,
        amount: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'))
      .groupBy(purchases.currency)
      .orderBy(sql`SUM(${purchases.amount}) DESC`);

    // Filter out null currencies and ensure string type
    return result
      .filter(r => r.currency != null)
      .map(r => ({
        currency: r.currency as string,
        amount: r.amount,
        count: r.count,
      }));
  }

  async getDailyRevenueForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; revenue: number; purchases: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${purchases.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
        purchases: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${purchases.createdAt})`)
      .orderBy(sql`DATE(${purchases.createdAt})`);

    return result;
  }

  async getRecentPurchases(options: {
    page: number;
    limit: number;
    status?: string;
    currency?: string;
  }): Promise<{
    items: Array<any>;
    total: number;
    hasMore: boolean;
  }> {
    const { page, limit, status, currency } = options;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(purchases.status, status));
    }
    if (currency) {
      conditions.push(eq(purchases.currency, currency));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get purchases with user info
    const items = await db
      .select({
        id: purchases.id,
        gumroadOrderId: purchases.gumroadOrderId,
        userId: purchases.userId,
        userEmail: users.email,
        amount: purchases.amount,
        currency: purchases.currency,
        status: purchases.status,
        createdAt: purchases.createdAt,
        purchaseData: purchases.purchaseData,
      })
      .from(purchases)
      .leftJoin(users, eq(purchases.userId, users.id))
      .where(whereClause)
      .orderBy(desc(purchases.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date, groupBy: string): Promise<Array<any>> {
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = sql`DATE_TRUNC('hour', ${purchases.createdAt})`;
        break;
      case 'day':
        dateFormat = sql`DATE_TRUNC('day', ${purchases.createdAt})`;
        break;
      case 'week':
        dateFormat = sql`DATE_TRUNC('week', ${purchases.createdAt})`;
        break;
      case 'month':
        dateFormat = sql`DATE_TRUNC('month', ${purchases.createdAt})`;
        break;
      default:
        dateFormat = sql`DATE_TRUNC('day', ${purchases.createdAt})`;
    }

    const result = await db
      .select({
        period: dateFormat,
        revenue: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
        purchases: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      )
      .groupBy(dateFormat)
      .orderBy(dateFormat);

    return result;
  }

  async getTopCountriesByRevenue(
    limit: number = 10
  ): Promise<Array<{ country: string; revenue: number; purchases: number }>> {
    const result = await db
      .select({
        country: sql<string>`${purchases.purchaseData}->>'country'`,
        revenue: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
        purchases: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'))
      .groupBy(sql`${purchases.purchaseData}->>'country'`)
      .orderBy(sql`SUM(${purchases.amount}) DESC`)
      .limit(limit);

    return result.filter(r => r.country); // Filter out null countries
  }

  async getConversionFunnel(): Promise<{
    totalVisitors: number;
    signups: number;
    purchases: number;
    conversionRate: number;
  }> {
    const totalUsers = await this.getTotalUsers();
    const totalPurchases = await this.getTotalPurchases();

    // For now, we'll use simple metrics
    // In a real implementation, you'd track actual visitor counts
    const conversionRate = totalUsers > 0 ? (totalPurchases / totalUsers) * 100 : 0;

    return {
      totalVisitors: totalUsers * 10, // Rough estimate
      signups: totalUsers,
      purchases: totalPurchases,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  async getRefundAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRefunds: number;
    refundAmount: number;
    refundRate: number;
  }> {
    const refunds = await db
      .select({
        count: sql<number>`COUNT(*)`,
        amount: sql<number>`COALESCE(SUM(${purchases.amount}), 0)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'refunded'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      );

    const totalPurchases = await this.getPurchasesForPeriod(startDate, endDate);
    const refundRate = totalPurchases > 0 ? ((refunds[0]?.count || 0) / totalPurchases) * 100 : 0;

    return {
      totalRefunds: refunds[0]?.count || 0,
      refundAmount: refunds[0]?.amount || 0,
      refundRate: Math.round(refundRate * 100) / 100,
    };
  }

  async getPurchasesForExport(startDate: Date, endDate: Date): Promise<Array<any>> {
    const result = await db
      .select({
        id: purchases.id,
        gumroadOrderId: purchases.gumroadOrderId,
        userId: purchases.userId,
        userEmail: users.email,
        amount: purchases.amount,
        currency: purchases.currency,
        status: purchases.status,
        createdAt: purchases.createdAt,
        purchaseData: purchases.purchaseData,
        country: sql<string>`${purchases.purchaseData}->>'country'`,
        paymentMethod: sql<string>`${purchases.purchaseData}->>'payment_method'`,
      })
      .from(purchases)
      .leftJoin(users, eq(purchases.userId, users.id))
      .where(and(gte(purchases.createdAt, startDate), lte(purchases.createdAt, endDate)))
      .orderBy(desc(purchases.createdAt));

    return result;
  }

  async getRecentWebhookActivity(limit: number = 10): Promise<Array<any>> {
    // This would require a webhook_logs table to track webhook activity
    // For now, return recent purchases as a proxy
    const result = await db
      .select({
        id: purchases.id,
        gumroadOrderId: purchases.gumroadOrderId,
        status: purchases.status,
        receivedAt: purchases.createdAt,
      })
      .from(purchases)
      .orderBy(desc(purchases.createdAt))
      .limit(limit);

    return result;
  }

  async getPurchaseByOrderId(gumroadOrderId: string): Promise<Purchase | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.gumroadOrderId, gumroadOrderId));

    return purchase;
  }

  async updateUserAccess(
    userId: string,
    updates: {
      lifetimeAccess?: boolean;
      subscriptionTier?: string;
      purchaseDate?: Date;
    }
  ): Promise<void> {
    await db
      .update(users)
      .set({
        lifetimeAccess: updates.lifetimeAccess,
        subscriptionTier: updates.subscriptionTier,
        purchaseDate: updates.purchaseDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async clearAllData(): Promise<void> {
    // Clear all glossary data (terms, categories, etc.)
    await db.delete(termViews);
    await db.delete(favorites);
    await db.delete(userProgress);
    await db.delete(termSubcategories);
    await db.delete(terms);
    await db.delete(subcategories);
    await db.delete(categories);
  }

  // Missing Admin Methods
  async getAllUsers(): Promise<any[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return result;
  }

  async reindexDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      // Perform database reindexing operations
      // This is a placeholder - actual implementation would depend on your database
      await db.execute(sql`REINDEX`);
      return { success: true, message: 'Database reindexed successfully' };
    } catch (error) {
      logger.error('Error reindexing database:', error);
      return { success: false, message: 'Failed to reindex database' };
    }
  }

  async cleanupDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      // Clean up orphaned records and optimize database
      // Remove orphaned favorites
      await db.execute(sql`
        DELETE FROM ${favorites} 
        WHERE term_id NOT IN (SELECT id FROM ${terms})
        OR user_id NOT IN (SELECT id FROM ${users})
      `);

      // Remove orphaned user progress
      await db.execute(sql`
        DELETE FROM ${userProgress} 
        WHERE term_id NOT IN (SELECT id FROM ${terms})
        OR user_id NOT IN (SELECT id FROM ${users})
      `);

      return { success: true, message: 'Database cleaned up successfully' };
    } catch (error) {
      logger.error('Error cleaning up database:', error);
      return { success: false, message: 'Failed to clean up database' };
    }
  }

  async vacuumDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      // Vacuum database to reclaim space and optimize performance
      await db.execute(sql`VACUUM`);
      return { success: true, message: 'Database vacuumed successfully' };
    } catch (error) {
      logger.error('Error vacuuming database:', error);
      return { success: false, message: 'Failed to vacuum database' };
    }
  }

  // Missing Content Moderation Methods
  async getPendingContent(): Promise<any[]> {
    // This is a placeholder implementation
    // You would need to implement content moderation tables first
    return [];
  }

  async approveContent(_contentId: string): Promise<{ success: boolean; message: string }> {
    // This is a placeholder implementation
    // You would need to implement content moderation logic
    return { success: true, message: 'Content approved successfully' };
  }

  async rejectContent(_contentId: string): Promise<{ success: boolean; message: string }> {
    // This is a placeholder implementation
    // You would need to implement content moderation logic
    return { success: true, message: 'Content rejected successfully' };
  }

  // Section-Based Methods Implementation
  async getTermSections(termId: string): Promise<any[]> {
    try {
      const sectionsResult = await db.execute(sql`
        SELECT 
          s.id,
          s.name,
          s.display_order,
          s.is_completed,
          s.created_at,
          s.updated_at,
          COUNT(si.id) as item_count
        FROM sections s
        LEFT JOIN section_items si ON s.id = si.section_id
        WHERE s.term_id = ${termId}
        GROUP BY s.id, s.name, s.display_order, s.is_completed, s.created_at, s.updated_at
        ORDER BY s.display_order ASC
      `);

      return sectionsResult.rows;
    } catch (error) {
      logger.error('Error fetching term sections:', error);
      return [];
    }
  }

  async getUserProgressForTerm(_userId: string, _termId: string): Promise<any[]> {
    try {
      // Return empty array for now - this would be implemented with a user_progress table
      // that tracks which sections of each term the user has completed
      return [];
    } catch (error) {
      logger.error('Error fetching user progress for term:', error);
      return [];
    }
  }

  async getSectionById(sectionId: number): Promise<any> {
    try {
      const sectionResult = await db.execute(sql`
        SELECT 
          s.id,
          s.term_id,
          s.name,
          s.display_order,
          s.is_completed,
          s.created_at,
          s.updated_at,
          et.name as term_name
        FROM sections s
        LEFT JOIN enhanced_terms et ON s.term_id = et.id
        WHERE s.id = ${sectionId}
      `);

      return sectionResult.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching section by ID:', error);
      return null;
    }
  }

  async getSectionItems(sectionId: number): Promise<any[]> {
    try {
      const itemsResult = await db.execute(sql`
        SELECT 
          si.id,
          si.section_id,
          si.label,
          si.content,
          si.content_type,
          si.display_order,
          si.metadata,
          si.is_ai_generated,
          si.verification_status,
          si.created_at,
          si.updated_at
        FROM section_items si
        WHERE si.section_id = ${sectionId}
        ORDER BY si.display_order ASC
      `);

      return itemsResult.rows;
    } catch (error) {
      logger.error('Error fetching section items:', error);
      return [];
    }
  }

  async getUserProgressForSection(_userId: string, _sectionId: number): Promise<any> {
    // This is a placeholder - you would need to implement section progress
    return null;
  }

  async updateUserProgress(userId: string, updates: any): Promise<void> {
    // This is a placeholder - you would need to implement progress updates
    logger.info('Progress update placeholder:', { userId, updates });
  }

  async getUserProgressSummary(userId: string): Promise<any> {
    // This is a placeholder - you would need to implement progress summary logic
    return {
      userId,
      totalTerms: 0,
      completedTerms: 0,
      totalSections: 0,
      completedSections: 0,
      totalTimeMinutes: 0,
      streak: 0,
      recentActivity: [],
    };
  }

  async getContentGallery(
    _sectionName: string,
    options: { page: number; limit: number }
  ): Promise<any> {
    // This is a placeholder - you would need to implement content gallery logic
    return {
      galleries: [],
      totalItems: 0,
      page: options.page,
      limit: options.limit,
    };
  }

  async getQuizzes(_options: { termId?: number; difficulty?: string }): Promise<any[]> {
    // This is a placeholder - you would need to implement quizzes table
    return [];
  }

  async searchSectionContent(options: {
    query: string;
    contentType?: string;
    sectionName?: string;
    page: number;
    limit: number;
  }): Promise<any> {
    try {
      const { query, contentType, sectionName, page, limit } = options;
      const offset = (page - 1) * limit;

      // Build dynamic WHERE clause
      let whereClause = `WHERE (si.content ILIKE '%${query}%' OR si.label ILIKE '%${query}%')`;

      if (contentType) {
        whereClause += ` AND si.content_type = '${contentType}'`;
      }

      if (sectionName) {
        whereClause += ` AND s.name ILIKE '%${sectionName}%'`;
      }

      const searchResult = await db.execute(sql`
        SELECT 
          si.id,
          si.label,
          si.content,
          si.content_type,
          si.metadata,
          s.name as section_name,
          et.name as term_name,
          et.id as term_id
        FROM section_items si
        JOIN sections s ON si.section_id = s.id
        JOIN enhanced_terms et ON s.term_id = et.id
        ${sql.raw(whereClause)}
        ORDER BY si.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      // Get total count for pagination
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as total
        FROM section_items si
        JOIN sections s ON si.section_id = s.id
        JOIN enhanced_terms et ON s.term_id = et.id
        ${sql.raw(whereClause)}
      `);

      return {
        results: searchResult.rows,
        totalResults: countResult.rows[0]?.total || 0,
        page,
        limit,
        totalPages: Math.ceil(Number(countResult.rows[0]?.total || 0) / limit),
      };
    } catch (error) {
      logger.error('Error searching section content:', error);
      return {
        results: [],
        totalResults: 0,
        page: options.page,
        limit: options.limit,
        totalPages: 0,
      };
    }
  }

  async getSectionAnalytics(): Promise<any> {
    try {
      // Get basic section analytics
      const sectionStatsResult = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT s.id) as total_sections,
          COUNT(DISTINCT s.term_id) as terms_with_sections,
          COUNT(DISTINCT si.id) as total_section_items,
          AVG(item_counts.item_count) as avg_items_per_section
        FROM sections s
        LEFT JOIN section_items si ON s.id = si.section_id
        LEFT JOIN (
          SELECT section_id, COUNT(*) as item_count 
          FROM section_items 
          GROUP BY section_id
        ) item_counts ON s.id = item_counts.section_id
      `);

      // Get section distribution by name
      const sectionDistributionResult = await db.execute(sql`
        SELECT 
          s.name,
          COUNT(*) as section_count,
          COUNT(si.id) as total_items
        FROM sections s
        LEFT JOIN section_items si ON s.id = si.section_id
        GROUP BY s.name
        ORDER BY section_count DESC
        LIMIT 20
      `);

      // Get content type distribution
      const contentTypeResult = await db.execute(sql`
        SELECT 
          content_type,
          COUNT(*) as count
        FROM section_items
        GROUP BY content_type
        ORDER BY count DESC
      `);

      const stats = sectionStatsResult.rows[0];

      return {
        overview: {
          totalSections: stats?.total_sections || 0,
          termsWithSections: stats?.terms_with_sections || 0,
          totalSectionItems: stats?.total_section_items || 0,
          avgItemsPerSection: Number(stats?.avg_items_per_section) || 0,
        },
        sectionDistribution: sectionDistributionResult.rows,
        contentTypeDistribution: contentTypeResult.rows,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching section analytics:', error);
      return {
        overview: {
          totalSections: 0,
          termsWithSections: 0,
          totalSectionItems: 0,
          avgItemsPerSection: 0,
        },
        sectionDistribution: [],
        contentTypeDistribution: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Missing User Progress Methods
  async getTermProgress(userId: string, termId: string): Promise<any> {
    const progress = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)))
      .limit(1);

    return progress[0] || null;
  }

  async updateTermProgress(userId: string, termId: string, progressData: any): Promise<void> {
    await db
      .insert(userProgress)
      .values({
        userId,
        termId: termId, // Keep as string UUID, not parseInt
        learnedAt: progressData.completed ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.termId],
        set: {
          learnedAt: progressData.completed ? new Date() : null,
        },
      });
  }

  async removeTermProgress(userId: string, termId: string): Promise<void> {
    await db
      .delete(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)));
  }

  async getUserStats(userId: string): Promise<any> {
    const totalProgress = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    const completedProgress = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), sql`${userProgress.learnedAt} IS NOT NULL`));

    return {
      totalTermsStarted: Number(totalProgress[0]?.count) || 0,
      completedTerms: Number(completedProgress[0]?.count) || 0,
      totalTimeSpent: 0, // Time tracking not implemented yet
      completionRate:
        totalProgress[0]?.count > 0
          ? (Number(completedProgress[0]?.count) / Number(totalProgress[0]?.count)) * 100
          : 0,
    };
  }

  // Missing methods for tests
  async getTerms(options: { limit?: number; offset?: number } = {}): Promise<any[]> {
    const { limit = 10, offset = 0 } = options;

    const result = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        characteristics: terms.characteristics,
        visualUrl: terms.visualUrl,
        mathFormulation: terms.mathFormulation,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .orderBy(terms.name)
      .limit(limit)
      .offset(offset);

    return result;
  }

  async getTerm(id: string): Promise<any> {
    const [term] = await db.select().from(terms).where(eq(terms.id, id));

    return term || null;
  }

  async getTermsByCategory(
    categoryId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<any[]> {
    const { limit = 20, offset = 0 } = options;

    const result = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        shortDefinition: terms.shortDefinition,
        categoryId: terms.categoryId,
        viewCount: terms.viewCount,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .where(eq(terms.categoryId, categoryId))
      .orderBy(terms.name)
      .limit(limit)
      .offset(offset);

    return result;
  }

  async createTerm(termData: any): Promise<any> {
    // Validate required fields
    if (!termData.name || !termData.definition) {
      throw new Error('Term name and definition are required');
    }

    const [newTerm] = await db
      .insert(terms)
      .values({
        name: termData.name,
        definition: termData.definition,
        shortDefinition: termData.shortDefinition,
        categoryId: termData.categoryId,
        characteristics: termData.characteristics,
        visualUrl: termData.visualUrl,
        mathFormulation: termData.mathFormulation,
      })
      .returning();

    return newTerm;
  }

  // AI/Search operations

  async updateTerm(termId: string, updates: any): Promise<any> {
    const [updatedTerm] = await db
      .update(terms)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(terms.id, termId))
      .returning();

    return updatedTerm;
  }
}

// Create and export storage instance
export const storage = new DatabaseStorage();
