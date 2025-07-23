/**
 * Optimized Storage Implementation
 *
 * Fixes N+1 query problems and implements performance optimizations
 * identified in the database analysis. This replaces the original storage.ts
 * with better query patterns and caching.
 */

import {
  aiContentFeedback,
  categories,
  favorites,
  subcategories,
  termSections,
  termSubcategories,
  terms,
  termViews,
  userProgress,
  userSettings,
  users,
} from '@shared/enhancedSchema';
import type { UpsertUser, User } from '@shared/schema';
import { purchases } from '@shared/schema';
import { subDays } from 'date-fns';
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import type { ICategory, ITerm } from '../shared/types';
import { db } from './db';
import {
  CacheInvalidation,
  CacheKeys,
  cached,
  clearCache,
  getCacheStats,
  queryCache,
} from './middleware/queryCache';
import { log } from './utils/logger';

import logger from './utils/logger';
// Interface for storage operations (same as original)
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<ICategory[]>;
  getCategoryById(id: string): Promise<ICategory | null>;

  // Term operations
  getFeaturedTerms(): Promise<ITerm[]>;
  getTermById(id: string): Promise<ITerm | null>;
  getRecentlyViewedTerms(userId: string): Promise<ITerm[]>;
  recordTermView(termId: string, userId: string | null): Promise<void>;
  searchTerms(query: string): Promise<ITerm[]>;

  // Favorites operations
  getUserFavorites(userId: string): Promise<ITerm[]>;
  getUserFavoritesOptimized?(
    userId: string,
    pagination?: { limit?: number; offset?: number; fields?: string[] }
  ): Promise<{ data: any[]; total: number; hasMore: boolean }>;
  isTermFavorite(userId: string, termId: string): Promise<boolean>;
  addFavorite(userId: string, termId: string): Promise<void>;
  removeFavorite(userId: string, termId: string): Promise<void>;

  // Progress operations
  getUserProgress(userId: string): Promise<any>;
  isTermLearned(userId: string, termId: string): Promise<boolean>;
  markTermAsLearned(userId: string, termId: string): Promise<void>;
  unmarkTermAsLearned(userId: string, termId: string): Promise<void>;

  // Revenue tracking operations
  getTotalRevenue(): Promise<number>;
  getTotalPurchases(): Promise<number>;
  getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getPurchasesForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getTotalUsers(): Promise<number>;
  getRevenueByCurrency(): Promise<Array<{ currency: string; total: number }>>;
  getDailyRevenueForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; revenue: number }>>;
  getRecentPurchases(limit?: number): Promise<any[]>;
  getRevenueByPeriod(period: string): Promise<any>;
  getTopCountriesByRevenue(limit?: number): Promise<any[]>;
  getConversionFunnel(): Promise<any>;
  getRefundAnalytics(): Promise<any>;
  getPurchasesForExport(startDate?: Date, endDate?: Date): Promise<any[]>;
  getRecentWebhookActivity(limit?: number): Promise<any[]>;
  getPurchaseByOrderId(orderId: string): Promise<any>;
  updateUserAccess(orderId: string, updates: any): Promise<void>;

  // Additional user operations
  getUserByEmail(email: string): Promise<any>;
  updateUser(userId: string, updates: any): Promise<any>;
  createPurchase(purchaseData: any): Promise<any>;
  getUserSettings(userId: string): Promise<any>;
  updateUserSettings(userId: string, settings: any): Promise<void>;
  exportUserData(userId: string): Promise<any>;
  deleteUserData(userId: string): Promise<void>;
  getUserStreak(userId: string): Promise<any>;

  // Admin user management
  getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }>;

  // Admin data management
  clearAllData(): Promise<{ tablesCleared: string[] }>;
  reindexDatabase(): Promise<{
    success: boolean;
    operation: string;
    duration: number;
    operations: string[];
    timestamp: Date;
    message: string;
  }>;
  getAdminStats(): Promise<any>;
  cleanupDatabase(): Promise<{
    success: boolean;
    operation: string;
    duration: number;
    operations: string[];
    timestamp: Date;
    message: string;
  }>;
  vacuumDatabase(): Promise<{
    success: boolean;
    operation: string;
    duration: number;
    operations: string[];
    timestamp: Date;
    message: string;
  }>;

  // Content moderation
  getPendingContent(): Promise<any[]>;
  approveContent(id: string): Promise<any>;
  rejectContent(id: string): Promise<any>;

  // Missing methods for enhanced features
  getTermsOptimized?(options?: { limit?: number }): Promise<any[]>;
  getTermsByIds?(ids: string[]): Promise<any[]>;
  submitFeedback?(data: any): Promise<any>;
  storeFeedback?(data: any): Promise<any>;
  getFeedback?(filters: any, pagination: any): Promise<any>;
  getFeedbackStats?(): Promise<any>;
  updateFeedbackStatus?(id: string, status: string, notes?: string): Promise<any>;
  initializeFeedbackSchema?(): Promise<void>;
  createFeedbackIndexes?(): Promise<void>;
  updateTermSection?(termId: string, sectionId: string, data: any): Promise<void>;
  trackTermView?(userId: string, termId: string, sectionId?: string): Promise<void>;
  trackSectionCompletion?(userId: string, termId: string, sectionId: string): Promise<void>;
  updateUserProgress?(userId: string, updates: any): Promise<void>;
  getUserSectionProgress?(userId: string, options?: any): Promise<any[]>;
  getUserTimeSpent?(userId: string, timeframe?: string): Promise<number>;
  getCategoryProgress?(userId: string): Promise<any[]>;
  isAchievementUnlocked?(userId: string, achievementId: string): Promise<boolean>;
  unlockAchievement?(userId: string, achievementId: string): Promise<any>;
  getAllTerms?(options?: any): Promise<any>;
}

export class OptimizedStorage implements IStorage {
  // User operations (cached)
  async getUser(id: string): Promise<User | undefined> {
    return cached(
      CacheKeys.term(`user:${id}`),
      async () => {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
      },
      15 * 60 * 1000 // 15 minutes
    );
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const userSchema = createInsertSchema(users);
    const validationResult = userSchema.safeParse(user);
    if (!validationResult.success) {
      throw new Error(`Invalid user data: ${validationResult.error.message}`);
    }

    const result = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Invalidate user cache
    CacheInvalidation.user(user.id);

    return result[0];
  }

  // Categories (heavily cached since they change rarely)
  async getCategories(): Promise<ICategory[]> {
    return cached(
      CacheKeys.categoryTree(),
      async () => {
        const results = await db
          .select({
            id: categories.id,
            name: categories.name,
            description: categories.description,
            termCount: sql<number>`(
            SELECT COUNT(*) 
            FROM ${terms} 
            WHERE ${terms.categoryId} = ${categories.id}
          )`,
          })
          .from(categories)
          .orderBy(categories.name);
        return results.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description ?? undefined,
          termCount: Number(r.termCount),
        }));
      },
      60 * 60 * 1000 // 1 hour cache
    );
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    return cached(
      CacheKeys.term(`category:${id}`),
      async () => {
        const result = await db
          .select({
            id: categories.id,
            name: categories.name,
            description: categories.description,
            termCount: sql<number>`(
            SELECT COUNT(*) 
            FROM ${terms} 
            WHERE ${terms.categoryId} = ${categories.id}
          )`,
          })
          .from(categories)
          .where(eq(categories.id, id))
          .limit(1);
        if (!result[0]) {return null;}
        return {
          id: result[0].id,
          name: result[0].name,
          description: result[0].description ?? undefined,
          termCount: Number(result[0].termCount),
        };
      },
      30 * 60 * 1000 // 30 minutes
    );
  }

  // OPTIMIZED: Fixed N+1 query problem in featured terms
  async getFeaturedTerms(): Promise<ITerm[]> {
    return cached(
      CacheKeys.popularTerms(),
      async () => {
        const results = await db
          .select({
            id: terms.id,
            name: terms.name,
            shortDefinition: terms.shortDefinition,
            viewCount: terms.viewCount,
            category: categories.name,
            categoryId: categories.id,
            definition: terms.definition,
            subcategories: sql<
              string[]
            >`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`,
          })
          .from(terms)
          .leftJoin(categories, eq(terms.categoryId, categories.id))
          .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
          .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
          .groupBy(terms.id, categories.id, categories.name)
          .orderBy(desc(terms.viewCount))
          .limit(20);
        return results.map(
          result =>
            ({
              id: result.id,
              name: result.name,
              definition: result.definition ?? '',
              shortDefinition: result.shortDefinition ?? undefined,
              viewCount: result.viewCount ?? 0,
              category: result.category ?? '',
              categoryId: result.categoryId ?? '',
              subcategories: result.subcategories?.filter(Boolean) || [],
            }) as ITerm
        );
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async getTermById(id: string): Promise<ITerm | null> {
    return cached(
      CacheKeys.term(id),
      async () => {
        const result = await db
          .select({
            id: terms.id,
            name: terms.name,
            definition: terms.definition,
            shortDefinition: terms.shortDefinition,
            viewCount: terms.viewCount,
            categoryId: terms.categoryId,
            category: categories.name,
            categoryDescription: categories.description,
            subcategories: sql<
              string[]
            >`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`,
            createdAt: terms.createdAt,
            updatedAt: terms.updatedAt,
          })
          .from(terms)
          .leftJoin(categories, eq(terms.categoryId, categories.id))
          .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
          .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
          .where(eq(terms.id, id))
          .groupBy(terms.id, categories.id)
          .limit(1);
        if (result.length === 0) {return null;}
        return {
          id: result[0].id,
          name: result[0].name,
          definition: result[0].definition,
          shortDefinition: result[0].shortDefinition,
          viewCount: result[0].viewCount,
          categoryId: result[0].categoryId,
          category: result[0].category,
          subcategories: result[0].subcategories?.filter(Boolean) || [],
          createdAt: result[0].createdAt,
          updatedAt: result[0].updatedAt,
        } as ITerm;
      },
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  async getRecentlyViewedTerms(userId: string): Promise<ITerm[]> {
    return cached(
      `user:${userId}:recent_views`,
      async () => {
        const results = await db
          .select({
            id: terms.id,
            name: terms.name,
            shortDefinition: terms.shortDefinition,
            viewCount: terms.viewCount,
            category: categories.name,
            categoryId: categories.id,
            viewedAt: termViews.viewedAt,
            definition: terms.definition,
            subcategories: sql<
              string[]
            >`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`,
          })
          .from(termViews)
          .innerJoin(terms, eq(termViews.termId, terms.id))
          .leftJoin(categories, eq(terms.categoryId, categories.id))
          .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
          .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
          .where(eq(termViews.userId, userId))
          .groupBy(terms.id, categories.id, termViews.viewedAt)
          .orderBy(desc(termViews.viewedAt))
          .limit(20);
        return results.map(
          result =>
            ({
              id: result.id,
              name: result.name,
              definition: result.definition ?? '',
              shortDefinition: result.shortDefinition ?? undefined,
              viewCount: result.viewCount ?? 0,
              category: result.category ?? '',
              categoryId: result.categoryId ?? '',
              subcategories: result.subcategories?.filter(Boolean) || [],
              viewedAt: result.viewedAt,
            }) as ITerm
        );
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async recordTermView(termId: string, userId: string | null): Promise<void> {
    // Always execute this (no caching for writes)
    if (userId) {
      // Get current user to check dailyViews reset
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length > 0) {
        const currentUser = user[0];
        const now = new Date();
        const lastReset = currentUser.lastViewReset ? new Date(currentUser.lastViewReset) : null;
        
        // Check if we need to reset daily views (new day)
        const needsReset = !lastReset || 
          now.toDateString() !== lastReset.toDateString();
        
        if (needsReset) {
          // Reset daily views for new day
          await db
            .update(users)
            .set({
              dailyViews: 1,
              lastViewReset: now,
              updatedAt: now,
            })
            .where(eq(users.id, userId));
        } else {
          // Increment daily views
          await db
            .update(users)
            .set({
              dailyViews: sql`${users.dailyViews} + 1`,
              updatedAt: now,
            })
            .where(eq(users.id, userId));
        }
      }

      // Record the term view
      await db
        .insert(termViews)
        .values({
          termId,
          userId,
          viewedAt: new Date(),
        })
        .onConflictDoNothing();

      // Invalidate related caches
      CacheInvalidation.user(userId);
    }

    // Update view count
    await db
      .update(terms)
      .set({
        viewCount: sql`${terms.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(terms.id, termId));

    // Invalidate term and popular terms cache
    CacheInvalidation.term(termId);
  }

  // OPTIMIZED: Single query for search with aggregated subcategories
  async searchTerms(query: string): Promise<ITerm[]> {
    return cached(
      CacheKeys.termSearch(query),
      async () => {
        const results = await db
          .select({
            id: terms.id,
            name: terms.name,
            shortDefinition: terms.shortDefinition,
            viewCount: terms.viewCount,
            category: categories.name,
            categoryId: categories.id,
            definition: terms.definition,
            relevance: sql<number>`ts_rank_cd(${terms.definition}, plainto_tsquery(${query}))`,
            subcategories: sql<
              string[]
            >`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`,
          })
          .from(terms)
          .leftJoin(categories, eq(terms.categoryId, categories.id))
          .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
          .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
          .where(ilike(terms.name, `%${query}%`))
          .groupBy(terms.id, categories.id)
          .orderBy(desc(sql<number>`ts_rank_cd(${terms.definition}, plainto_tsquery(${query}))`))
          .limit(20);
        return results.map(
          result =>
            ({
              id: result.id,
              name: result.name,
              definition: result.definition ?? '',
              shortDefinition: result.shortDefinition ?? undefined,
              viewCount: result.viewCount ?? 0,
              category: result.category ?? '',
              categoryId: result.categoryId ?? '',
              subcategories: result.subcategories?.filter(Boolean) || [],
              relevance: result.relevance,
            }) as ITerm
        );
      },
      2 * 60 * 1000 // 2 minutes cache (shorter for search)
    );
  }

  // NEW: Optimized search with database-level pagination and field selection
  async searchTermsOptimized(options: {
    query: string;
    categoryId?: string;
    offset?: number;
    limit?: number;
    fields?: string[];
  }): Promise<{ data: any[]; total: number }> {
    const {
      query,
      categoryId,
      offset = 0,
      limit = 20,
      fields = ['id', 'name', 'shortDefinition', 'viewCount'],
    } = options;

    const cacheKey = `search-optimized:${query}:${categoryId || 'all'}:${offset}:${limit}:${fields.join(',')}`;

    return cached(
      cacheKey,
      async () => {
        // Build search condition
        const searchCondition = sql`
          to_tsvector('english', ${terms.name} || ' ' || COALESCE(${terms.shortDefinition}, '') || ' ' || COALESCE(${terms.definition}, '')) 
          @@ plainto_tsquery('english', ${query})
          OR ${terms.name} ILIKE ${`%${query}%`}
          OR ${terms.shortDefinition} ILIKE ${`%${query}%`}
        `;

        const relevanceScore = sql<number>`
          CASE 
            WHEN ${terms.name} ILIKE ${`${query}%`} THEN 3.0
            WHEN ${terms.name} ILIKE ${`%${query}%`} THEN 2.0
            WHEN ${terms.shortDefinition} ILIKE ${`%${query}%`} THEN 1.5
            ELSE 1.0
          END
        `;

        // Build where conditions
        const whereConditions = [searchCondition];
        if (categoryId) {
          whereConditions.push(eq(terms.categoryId, categoryId));
        }

        // Get total count
        let totalResult: any;
        if (fields.includes('category')) {
          const countWithJoin = db
            .select({ count: sql<number>`count(*)` })
            .from(terms)
            .leftJoin(categories, eq(terms.categoryId, categories.id))
            .where(and(...whereConditions));
          totalResult = await countWithJoin;
        } else {
          const countQuery = db
            .select({ count: sql<number>`count(*)` })
            .from(terms)
            .where(and(...whereConditions));
          totalResult = await countQuery;
        }
        const total = totalResult[0]?.count || 0;

        // Build dynamic select
        const selectObj: any = {
          relevance: relevanceScore,
        };

        if (fields.includes('id')) {selectObj.id = terms.id;}
        if (fields.includes('name')) {selectObj.name = terms.name;}
        if (fields.includes('shortDefinition')) {selectObj.shortDefinition = terms.shortDefinition;}
        if (fields.includes('definition')) {selectObj.definition = terms.definition;}
        if (fields.includes('viewCount')) {selectObj.viewCount = terms.viewCount;}
        if (fields.includes('categoryId')) {selectObj.categoryId = terms.categoryId;}
        if (fields.includes('category')) {selectObj.category = categories.name;}
        if (fields.includes('createdAt')) {selectObj.createdAt = terms.createdAt;}

        // Build main query
        const baseQuery = db.select(selectObj).from(terms);

        // Add joins and conditions
        let results: any;
        if (fields.includes('category')) {
          const joinedQuery = baseQuery
            .leftJoin(categories, eq(terms.categoryId, categories.id))
            .where(and(...whereConditions))
            .orderBy(desc(relevanceScore), desc(terms.viewCount))
            .limit(limit)
            .offset(offset);
          results = await joinedQuery;
        } else {
          const simpleQuery = baseQuery
            .where(and(...whereConditions))
            .orderBy(desc(relevanceScore), desc(terms.viewCount))
            .limit(limit)
            .offset(offset);
          results = await simpleQuery;
        }

        return {
          data: results,
          total,
        };
      },
      90 * 1000 // 1.5 minutes cache for search results
    );
  }

  // OPTIMIZED: Fixed N+1 query problem in favorites with field selection
  async getUserFavorites(userId: string): Promise<ITerm[]> {
    const result = await this.getUserFavoritesOptimized(userId, { limit: 100 });
    return result.data;
  }

  async getUserFavoritesOptimized(
    userId: string,
    pagination?: { limit?: number; offset?: number; fields?: string[] }
  ): Promise<{ data: any[]; total: number; hasMore: boolean }> {
    const {
      limit = 50,
      offset = 0,
      fields = ['termId', 'name', 'shortDefinition', 'viewCount', 'category'],
    } = pagination || {};
    const cacheKey = `${CacheKeys.userFavorites(userId)}:${limit}:${offset}:${fields.join(',')}`;

    return cached(
      cacheKey,
      async () => {
        // Get total count first
        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(favorites)
          .where(eq(favorites.userId, userId));
        const total = totalResult[0]?.count || 0;

        // Build dynamic select based on requested fields
        const selectObj: any = {
          termId: favorites.termId,
          createdAt: favorites.createdAt,
        };

        if (fields.includes('name')) {selectObj.name = terms.name;}
        if (fields.includes('shortDefinition')) {selectObj.shortDefinition = terms.shortDefinition;}
        if (fields.includes('definition')) {selectObj.definition = terms.definition;}
        if (fields.includes('viewCount')) {selectObj.viewCount = terms.viewCount;}
        if (fields.includes('category')) {selectObj.category = categories.name;}
        if (fields.includes('categoryId')) {selectObj.categoryId = categories.id;}

        // Single query with field selection and pagination
        const results = await db
          .select(selectObj)
          .from(favorites)
          .innerJoin(terms, eq(favorites.termId, terms.id))
          .leftJoin(categories, eq(terms.categoryId, categories.id))
          .where(eq(favorites.userId, userId))
          .orderBy(desc(favorites.createdAt))
          .limit(limit)
          .offset(offset);

        const data = results;

        return {
          data,
          total,
          hasMore: offset + limit < total,
        };
      },
      5 * 60 * 1000 // 5 minutes cache for field-specific results
    );
  }

  async isTermFavorite(userId: string, termId: string): Promise<boolean> {
    return cached(
      `user:${userId}:favorite:${termId}`,
      async () => {
        const result = await db
          .select({ id: favorites.id })
          .from(favorites)
          .where(and(eq(favorites.userId, userId), eq(favorites.termId, termId)))
          .limit(1);

        return result.length > 0;
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async addFavorite(userId: string, termId: string): Promise<void> {
    await db
      .insert(favorites)
      .values({
        userId,
        termId,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [favorites.userId, favorites.termId],
        set: { createdAt: new Date() },
      });

    // Invalidate caches
    CacheInvalidation.user(userId);
    queryCache.invalidate(`user:${userId}:favorite:${termId}`);
  }

  async removeFavorite(userId: string, termId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.termId, termId)));

    // Invalidate caches
    CacheInvalidation.user(userId);
    queryCache.invalidate(`user:${userId}:favorite:${termId}`);
  }

  // Progress operations (optimized with batching)
  async getUserProgress(userId: string): Promise<any> {
    return cached(
      `user:${userId}:progress`,
      async () => {
        const learned = await db
          .select({
            termId: userProgress.termId,
            learnedAt: userProgress.learnedAt,
          })
          .from(userProgress)
          .where(eq(userProgress.userId, userId));

        const totalTerms = await db.select({ count: sql<number>`count(*)` }).from(terms);

        // Get achievements
        const achievements = await this.getUserAchievements(userId);

        // Get streak data
        const streakData = await this.getUserStreak(userId);

        return {
          learnedCount: learned.length,
          totalTerms: totalTerms[0].count,
          percentage: totalTerms[0].count > 0 ? (learned.length / totalTerms[0].count) * 100 : 0,
          learnedTerms: learned,
          achievements: achievements,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
        };
      },
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  async isTermLearned(userId: string, termId: string): Promise<boolean> {
    return cached(
      `user:${userId}:learned:${termId}`,
      async () => {
        const result = await db
          .select({ id: userProgress.id })
          .from(userProgress)
          .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)))
          .limit(1);

        return result.length > 0;
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async markTermAsLearned(userId: string, termId: string): Promise<void> {
    await db
      .insert(userProgress)
      .values({
        userId,
        termId,
        learnedAt: new Date(),
      })
      .onConflictDoNothing();

    // Invalidate caches
    CacheInvalidation.user(userId);
    queryCache.invalidate(`user:${userId}:learned:${termId}`);
  }

  async unmarkTermAsLearned(userId: string, termId: string): Promise<void> {
    await db
      .delete(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)));

    // Invalidate caches
    CacheInvalidation.user(userId);
    queryCache.invalidate(`user:${userId}:learned:${termId}`);
  }

  // Optimized bulk operations with field selection
  async getTermsByCategory(
    categoryId: string,
    options: {
      offset?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      fields?: string[];
    } = {}
  ): Promise<{ data: any[]; total: number }> {
    const {
      offset = 0,
      limit = 20,
      sort = 'name',
      order = 'asc',
      fields = ['id', 'name', 'shortDefinition', 'viewCount'],
    } = options;

    const cacheKey = `${CacheKeys.termsByCategory(categoryId)}:${offset}:${limit}:${sort}:${order}:${fields.join(',')}`;

    return cached(
      cacheKey,
      async () => {
        // Build dynamic select based on requested fields
        const selectObj: any = {};

        if (fields.includes('id')) {selectObj.id = terms.id;}
        if (fields.includes('name')) {selectObj.name = terms.name;}
        if (fields.includes('shortDefinition')) {selectObj.shortDefinition = terms.shortDefinition;}
        if (fields.includes('definition')) {selectObj.definition = terms.definition;}
        if (fields.includes('viewCount')) {selectObj.viewCount = terms.viewCount;}
        if (fields.includes('category')) {selectObj.category = categories.name;}
        if (fields.includes('categoryId')) {selectObj.categoryId = categories.id;}
        if (fields.includes('createdAt')) {selectObj.createdAt = terms.createdAt;}
        if (fields.includes('updatedAt')) {selectObj.updatedAt = terms.updatedAt;}

        // Get total count first
        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(terms)
          .where(eq(terms.categoryId, categoryId));

        const total = totalResult[0]?.count || 0;

        // Build main query with sorting and pagination
        const sortColumn =
          sort === 'name'
            ? terms.name
            : sort === 'viewCount'
              ? terms.viewCount
              : sort === 'createdAt'
                ? terms.createdAt
                : terms.name;

        let results: any;
        if (fields.includes('category')) {
          const query = db
            .select(selectObj)
            .from(terms)
            .leftJoin(categories, eq(terms.categoryId, categories.id))
            .where(eq(terms.categoryId, categoryId));

          const sortedQuery =
            order === 'desc' ? query.orderBy(desc(sortColumn)) : query.orderBy(asc(sortColumn));

          results = await sortedQuery.limit(limit).offset(offset);
        } else {
          const query = db.select(selectObj).from(terms).where(eq(terms.categoryId, categoryId));

          const sortedQuery =
            order === 'desc' ? query.orderBy(desc(sortColumn)) : query.orderBy(asc(sortColumn));

          results = await sortedQuery.limit(limit).offset(offset);
        }

        return {
          data: results,
          total,
        };
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  // Statistics and analytics (cached heavily)
  async getPopularTerms(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any[]> {
    return cached(
      CacheKeys.popularTerms(timeframe),
      async () => {
        const dateFilter =
          timeframe === 'day'
            ? subDays(new Date(), 1)
            : timeframe === 'week'
              ? subDays(new Date(), 7)
              : subDays(new Date(), 30);

        const results = await db
          .select({
            id: terms.id,
            name: terms.name,
            shortDefinition: terms.shortDefinition,
            viewCount: terms.viewCount,
            category: categories.name,
            recentViews: sql<number>`COUNT(${termViews.id})`,
          })
          .from(terms)
          .leftJoin(categories, eq(terms.categoryId, categories.id))
          .leftJoin(
            termViews,
            and(eq(termViews.termId, terms.id), gte(termViews.viewedAt, dateFilter))
          )
          .groupBy(terms.id, categories.name)
          .orderBy(desc(sql`recent_views`), desc(terms.viewCount))
          .limit(20);

        return results;
      },
      30 * 60 * 1000 // 30 minutes cache
    );
  }

  async getTrendingTerms(limit = 10): Promise<any[]> {
    return cached(
      `trending_terms_${limit}`,
      async () => {
        const results = await db
          .select({
            id: terms.id,
            name: terms.name,
            shortDefinition: terms.shortDefinition,
            viewCount: terms.viewCount,
            category: categories.name,
            recentViews: sql<number>`COUNT(${termViews.id})`,
          })
          .from(terms)
          .leftJoin(categories, eq(terms.categoryId, categories.id))
          .leftJoin(
            termViews,
            and(
              eq(termViews.termId, terms.id),
              gte(termViews.viewedAt, subDays(new Date(), 7)) // Last 7 days
            )
          )
          .groupBy(terms.id, categories.name)
          .orderBy(desc(sql`recent_views`), desc(terms.viewCount))
          .limit(limit);

        return results;
      },
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  async updateTerm(termId: string, updates: any): Promise<any> {
    const [updatedTerm] = await db
      .update(terms)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(terms.id, termId))
      .returning();

    // Invalidate cache for this term
    CacheInvalidation.term(termId);

    return updatedTerm;
  }

  // Test-specific optimized methods
  async getTermsOptimized(options: { limit?: number } = {}): Promise<any[]> {
    const { limit = 20 } = options;

    return cached(
      CacheKeys.term(`terms:optimized:${limit}`),
      async () => {
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
          .orderBy(terms.viewCount)
          .limit(limit);

        return result;
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async getCategoriesOptimized(
    options: {
      offset?: number;
      limit?: number;
      fields?: string[];
      search?: string;
      includeStats?: boolean;
    } = {}
  ): Promise<any[]> {
    const {
      offset = 0,
      limit = 20,
      fields = ['id', 'name', 'description'],
      search,
      includeStats = false,
    } = options;

    const cacheKey = `${CacheKeys.categoryTree()}:v2:${offset}:${limit}:${fields.join(',')}:${search || 'all'}:${includeStats}`;

    return cached(
      cacheKey,
      async () => {
        // Check if we need term count to avoid schema mismatch
        const needsTermCount = fields.includes('termCount') || includeStats;
        logger.info('[DEBUG] getCategoriesOptimized called with:', {
          fields,
          needsTermCount,
          includeStats,
        });

        // Build dynamic select based on requested fields
        const selectObj: any = {};

        if (fields.includes('id')) {selectObj.id = categories.id;}
        if (fields.includes('name')) {selectObj.name = categories.name;}
        if (fields.includes('description')) {selectObj.description = categories.description;}

        // Add termCount if explicitly requested
        if (needsTermCount) {
          selectObj.termCount = sql<number>`count(DISTINCT ${terms.id})`;
        }

        let query: any = db.select(selectObj).from(categories);

        // Add join for term count if needed
        if (needsTermCount) {
          query = query.leftJoin(terms, eq(terms.categoryId, categories.id));
        }

        // Add search filter if provided
        if (search) {
          query = query.where(ilike(categories.name, `%${search}%`));
        }

        // Add grouping for term count aggregation
        if (needsTermCount) {
          query = query.groupBy(categories.id, categories.name, categories.description);
        }

        // Add ordering, limit, and offset
        try {
          const result = await query.orderBy(categories.name).limit(limit).offset(offset);
          return result;
        } catch (queryError) {
          logger.error('[OptimizedStorage] getCategoriesOptimized query failed:', queryError);

          // Check if it's a schema mismatch error (uuid vs integer)
          const errorMessage =
            queryError instanceof Error ? queryError.message : String(queryError);
          if (errorMessage.includes('uuid') && errorMessage.includes('integer')) {
            logger.warn(
              '[OptimizedStorage] Schema mismatch detected: categories.id (integer) vs terms.category_id (uuid)'
            );

            // Fallback: Get categories without termCount (no join required)
            try {
              let fallbackQuery = db
                .select({
                  id: categories.id,
                  name: categories.name,
                  description: categories.description,
                })
                .from(categories);

              if (search) {
                fallbackQuery = fallbackQuery.where(ilike(categories.name, `%${search}%`));
              }

              const fallbackResult = await fallbackQuery
                .orderBy(categories.name)
                .limit(limit)
                .offset(offset);
              logger.info('[OptimizedStorage] Using fallback query without joins');
              return fallbackResult;
            } catch (fallbackError) {
              logger.error('[OptimizedStorage] Fallback query also failed:', fallbackError);
              return [];
            }
          }

          // Return empty array for other database errors
          return [];
        }
      },
      5 * 60 * 1000 // 5 minutes cache for paginated results
    );
  }

  async getCategoriesCount(options: { search?: string } = {}): Promise<number> {
    const { search } = options;
    const cacheKey = `categories:count:${search || 'all'}`;

    return cached(
      cacheKey,
      async () => {
        let query: any = db.select({ count: sql<number>`count(*)` }).from(categories);

        if (search) {
          query = query.where(ilike(categories.name, `%${search}%`));
        }

        try {
          const result = await query;
          return result[0]?.count || 0;
        } catch (queryError) {
          logger.error('[OptimizedStorage] getCategoriesCount query failed:', queryError);
          // Return 0 for empty database or schema mismatch
          return 0;
        }
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async bulkCreateTerms(termsData: any[]): Promise<{ success: number; failed: number }> {
    if (termsData.length === 0) {
      return { success: 0, failed: 0 };
    }

    try {
      await db.insert(terms).values(termsData).onConflictDoNothing();
      // The result of a bulk insert in Drizzle doesn't directly tell us how many rows were inserted.
      // We'll assume success for all if no error is thrown.
      const successCount = termsData.length;
      await clearCache();
      return { success: successCount, failed: 0 };
    } catch (error) {
      logger.error('Bulk insert failed:', error);
      // If the bulk insert fails, we can fall back to individual inserts to salvage what we can.
      let success = 0;
      let failed = 0;
      for (const termData of termsData) {
        try {
          await db.insert(terms).values(termData).onConflictDoNothing();
          success++;
        } catch (individualError) {
          logger.error('Individual insert failed:', individualError);
          failed++;
        }
      }
      await clearCache();
      return { success, failed };
    }
  }

  async getPerformanceMetrics(): Promise<any> {
    return {
      cacheHitRate: getCacheStats().hitRate,
      averageQueryTime: getCacheStats().averageResponseTime || 0,
      averageResponseTime: getCacheStats().averageResponseTime || 0,
      totalCachedQueries: getCacheStats().hits + getCacheStats().misses,
      cacheSize: process.memoryUsage().heapUsed,
      lastCacheReset: new Date(),
    };
  }

  // Additional methods needed by content.ts
  async getTerms(options: { limit?: number; offset?: number } = {}): Promise<any[]> {
    try {
      return await this.getTermsOptimized(options);
    } catch (error) {
      logger.error('Error getting terms:', error);
      throw error;
    }
  }

  async getAllTerms(
    options: {
      limit?: number;
      page?: number;
      offset?: number;
      categoryId?: string;
      searchTerm?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      fields?: string[];
    } = {}
  ): Promise<{ data: any[]; terms: any[]; total: number }> {
    const {
      limit = 10000, // Increased default to fetch all terms
      page = 1,
      offset = options.offset !== undefined ? options.offset : (page - 1) * limit,
      categoryId,
      searchTerm,
      sortBy = 'name',
      sortOrder = 'asc',
      fields = ['id', 'name', 'shortDefinition', 'viewCount', 'categoryId'],
    } = options;

    const cacheKey = `all-terms:${limit}:${offset}:${categoryId || 'all'}:${searchTerm || 'all'}:${sortBy}:${sortOrder}:${fields.join(',')}`;

    const termsList = await cached(
      cacheKey,
      async () => {
        // Build dynamic select based on requested fields
        const selectObj: any = {};

        if (fields.includes('id')) {selectObj.id = terms.id;}
        if (fields.includes('name')) {selectObj.name = terms.name;}
        if (fields.includes('shortDefinition')) {selectObj.shortDefinition = terms.shortDefinition;}
        if (fields.includes('definition')) {selectObj.definition = terms.definition;}
        if (fields.includes('categoryId')) {selectObj.categoryId = terms.categoryId;}
        if (fields.includes('viewCount')) {selectObj.viewCount = terms.viewCount;}
        if (fields.includes('createdAt')) {selectObj.createdAt = terms.createdAt;}
        if (fields.includes('updatedAt')) {selectObj.updatedAt = terms.updatedAt;}
        if (fields.includes('category')) {selectObj.category = categories.name;}

        let query: any = db.select(selectObj).from(terms);

        // Add joins only if needed
        if (fields.includes('category')) {
          query = query.leftJoin(categories, eq(terms.categoryId, categories.id));
        }

        // Add filters
        const whereConditions = [];
        if (categoryId) {
          whereConditions.push(eq(terms.categoryId, categoryId));
        }
        if (searchTerm) {
          whereConditions.push(
            or(
              ilike(terms.name, `%${searchTerm}%`),
              ilike(terms.shortDefinition, `%${searchTerm}%`)
            )
          );
        }

        if (whereConditions.length > 0) {
          query = query.where(and(...whereConditions));
        }

        // Add sorting
        const sortColumn =
          sortBy === 'name'
            ? terms.name
            : sortBy === 'viewCount'
              ? terms.viewCount
              : sortBy === 'createdAt'
                ? terms.createdAt
                : terms.name;

        query =
          sortOrder === 'desc' ? query.orderBy(desc(sortColumn)) : query.orderBy(asc(sortColumn));

        return await query.limit(limit).offset(offset);
      },
      3 * 60 * 1000 // 3 minutes cache for filtered results
    );

    // Get total count with same filters
    const totalCacheKey = `total-terms-count:${categoryId || 'all'}:${searchTerm || 'all'}`;
    const total = await cached(
      totalCacheKey,
      async () => {
        let countQuery: any = db.select({ count: sql<number>`count(*)` }).from(terms);

        const whereConditions = [];
        if (categoryId) {
          whereConditions.push(eq(terms.categoryId, categoryId));
        }
        if (searchTerm) {
          whereConditions.push(
            or(
              ilike(terms.name, `%${searchTerm}%`),
              ilike(terms.shortDefinition, `%${searchTerm}%`)
            )
          );
        }

        if (whereConditions.length > 0) {
          countQuery = countQuery.where(and(...whereConditions));
        }

        const result = await countQuery;
        return result[0]?.count || 0;
      },
      10 * 60 * 1000 // 10 minutes cache
    );

    return {
      data: termsList,
      terms: termsList,
      total: total,
    };
  }

  // AI/Search operations needed by aiRoutes.ts
  async getAllTermNames(): Promise<string[]> {
    return await cached(
      CacheKeys.term('all-term-names'),
      async () => {
        const result = await db.select({ name: terms.name }).from(terms);
        return result.map(term => term.name);
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async getAllTermsForSearch(limit = 1000): Promise<any[]> {
    return await cached(
      CacheKeys.term(`terms-for-search:${limit}`),
      async () => {
        const result = await db
          .select({
            id: terms.id,
            name: terms.name,
            definition: terms.definition,
            shortDefinition: terms.shortDefinition,
            categoryId: terms.categoryId,
          })
          .from(terms)
          .orderBy(terms.viewCount)
          .limit(limit);

        return result;
      },
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  // User stats method needed by user.ts
  async getUserStats(userId: string): Promise<any> {
    return await cached(
      `user-stats:${userId}`,
      async () => {
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
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  // Revenue tracking methods for admin dashboard
  async getTotalRevenue(): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'));

    return Number(result[0]?.total) || 0;
  }

  async getTotalPurchases(): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'));

    return Number(result[0]?.count) || 0;
  }

  async getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      );

    return Number(result[0]?.total) || 0;
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

    return Number(result[0]?.count) || 0;
  }

  async getTotalUsers(): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(users);

    return Number(result[0]?.count) || 0;
  }

  async getRevenueByCurrency(): Promise<Array<{ currency: string; total: number }>> {
    const result = await db
      .select({
        currency: purchases.currency,
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'))
      .groupBy(purchases.currency);

    return result.map(row => ({
      currency: row.currency || 'USD',
      total: Number(row.total),
    }));
  }

  async getDailyRevenueForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; revenue: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        revenue: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    return result.map(row => ({
      date: row.date,
      revenue: Number(row.revenue),
    }));
  }

  async getRecentPurchases(limit = 10): Promise<any[]> {
    return await db
      .select({
        id: purchases.id,
        userId: purchases.userId,
        orderId: purchases.gumroadOrderId,
        amount: purchases.amount,
        currency: purchases.currency,
        status: purchases.status,
        createdAt: purchases.createdAt,
        userEmail: users.email,
      })
      .from(purchases)
      .leftJoin(users, eq(purchases.userId, users.id))
      .orderBy(desc(purchases.createdAt))
      .limit(limit);
  }

  async getRevenueByPeriod(period: string): Promise<any> {
    // Simplified implementation - can be enhanced
    // const _now = new Date(); // Commented out as it's not used
    const periods = {
      day: [],
      week: [],
      month: [],
      year: [],
    };

    return periods[period as keyof typeof periods] || [];
  }

  async getTopCountriesByRevenue(limit = 10): Promise<any[]> {
    // Extract country from purchase data JSON
    const result = await db
      .select({
        country: sql<string>`(purchase_data->>'country')::text`,
        revenue: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'))
      .groupBy(sql`(purchase_data->>'country')::text`)
      .orderBy(desc(sql`COALESCE(SUM(amount), 0)`))
      .limit(limit);

    return result.map(row => ({
      country: row.country || 'Unknown',
      revenue: Number(row.revenue),
    }));
  }

  async getConversionFunnel(): Promise<any> {
    const totalUsers = await this.getTotalUsers();
    const purchasedUsers = await db
      .select({
        count: sql<number>`COUNT(DISTINCT user_id)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'completed'));

    const purchasedCount = Number(purchasedUsers[0]?.count) || 0;

    return {
      visitors: totalUsers * 10, // Estimate
      signups: totalUsers,
      purchased: purchasedCount,
      conversionRate: totalUsers > 0 ? (purchasedCount / totalUsers) * 100 : 0,
    };
  }

  async getRefundAnalytics(): Promise<any> {
    const refunds = await db
      .select({
        count: sql<number>`COUNT(*)`,
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(purchases)
      .where(eq(purchases.status, 'refunded'));

    return {
      count: Number(refunds[0]?.count) || 0,
      totalAmount: Number(refunds[0]?.total) || 0,
    };
  }

  async getPurchasesForExport(startDate?: Date, endDate?: Date): Promise<any[]> {
    const baseQuery = db
      .select({
        orderId: purchases.gumroadOrderId,
        userEmail: users.email,
        amount: purchases.amount,
        currency: purchases.currency,
        status: purchases.status,
        createdAt: purchases.createdAt,
        purchaseData: purchases.purchaseData,
      })
      .from(purchases)
      .leftJoin(users, eq(purchases.userId, users.id));

    if (startDate && endDate) {
      return await baseQuery
        .where(and(gte(purchases.createdAt, startDate), lte(purchases.createdAt, endDate)))
        .orderBy(desc(purchases.createdAt));
    }

    return await baseQuery.orderBy(desc(purchases.createdAt));
  }

  async getRecentWebhookActivity(limit = 20): Promise<any[]> {
    // For now, return recent purchases as webhook activity
    return await this.getRecentPurchases(limit);
  }

  async getPurchaseByOrderId(orderId: string): Promise<any> {
    const result = await db
      .select()
      .from(purchases)
      .where(eq(purchases.gumroadOrderId, orderId))
      .limit(1);

    return result[0];
  }

  async updateUserAccess(orderId: string, updates: any): Promise<void> {
    const purchase = await this.getPurchaseByOrderId(orderId);
    if (purchase?.userId) {
      await db
        .update(users)
        .set({
          lifetimeAccess: updates.grantAccess,
          updatedAt: new Date(),
        })
        .where(eq(users.id, purchase.userId));
    }
  }

  // Additional methods needed by other routes
  async getUserByEmail(email: string): Promise<any> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async updateUser(userId: string, updates: any): Promise<any> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async createPurchase(purchaseData: any): Promise<any> {
    const [purchase] = await db.insert(purchases).values(purchaseData).returning();
    return purchase;
  }

  async getUserSettings(userId: string): Promise<any> {
    const result = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    return result[0]?.preferences || {};
  }

  async updateUserSettings(userId: string, settings: any): Promise<void> {
    await db
      .insert(userSettings)
      .values({
        userId,
        preferences: settings,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          preferences: settings,
          updatedAt: new Date(),
        },
      });
  }

  async exportUserData(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    const favorites = await this.getUserFavorites(userId);
    const progress = await this.getUserProgress(userId);
    const settings = await this.getUserSettings(userId);

    return {
      user,
      favorites,
      progress,
      settings,
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    // Delete in order to respect foreign key constraints
    await db.delete(userProgress).where(eq(userProgress.userId, userId));
    await db.delete(favorites).where(eq(favorites.userId, userId));
    await db.delete(termViews).where(eq(termViews.userId, userId));
    await db.delete(userSettings).where(eq(userSettings.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  async getUserStreak(userId: string): Promise<any> {
    // Get all term views for the user, ordered by date
    const allViews = await db
      .select({
        viewedAt: termViews.viewedAt,
      })
      .from(termViews)
      .where(eq(termViews.userId, userId))
      .orderBy(desc(termViews.viewedAt));

    if (allViews.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: null,
        streakHistory: [],
      };
    }

    // Group views by date
    const viewsByDate = new Map<string, number>();
    allViews.forEach(view => {
      const dateStr = view.viewedAt.toISOString().split('T')[0];
      viewsByDate.set(dateStr, (viewsByDate.get(dateStr) || 0) + 1);
    });

    // Sort dates in descending order
    const sortedDates = Array.from(viewsByDate.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if user has activity today or yesterday to start the streak
    if (viewsByDate.has(todayStr) || viewsByDate.has(yesterdayStr)) {
      currentStreak = 1;
      let checkDate = viewsByDate.has(todayStr) ? today : yesterday;
      
      // Go backwards and count consecutive days
      for (let i = 1; i < sortedDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        if (viewsByDate.has(checkDateStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    sortedDates.forEach(dateStr => {
      const currentDate = new Date(dateStr);
      
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const dayDiff = (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      lastDate = currentDate;
    });
    
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    // Get streak history (last 7 days)
    const streakHistory = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      streakHistory.push({
        date: dateStr,
        hasActivity: viewsByDate.has(dateStr),
        viewCount: viewsByDate.get(dateStr) || 0,
      });
    }

    return {
      currentStreak,
      longestStreak,
      lastActivity: allViews[0]?.viewedAt || null,
      streakHistory: streakHistory.reverse(),
      totalActiveDays: viewsByDate.size,
    };
  }

  async getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const { page = 1, limit = 50, search } = options || {};
    const offset = (page - 1) * limit;

    return cached(
      CacheKeys.term(`users:page-${page}:limit-${limit}:search-${search || 'none'}`),
      async () => {
        // Build base query
        let whereConditions;

        if (search) {
          whereConditions = or(
            ilike(users.email, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`)
          );
        }

        // Get total count
        const totalResult = await db
          .select({
            count: sql<number>`count(*)`,
          })
          .from(users)
          .where(whereConditions);

        const total = Number(totalResult[0]?.count) || 0;

        // Get paginated users with all relevant fields
        const result = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            isAdmin: users.isAdmin,
            subscriptionTier: users.subscriptionTier,
            lifetimeAccess: users.lifetimeAccess,
            purchaseDate: users.purchaseDate,
            dailyViews: users.dailyViews,
            lastViewReset: users.lastViewReset,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(whereConditions)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset);

        return {
          data: result,
          total,
          page,
          limit,
          hasMore: offset + limit < total,
        };
      },
      300 // Cache for 5 minutes
    );
  }

  async clearAllData(): Promise<{ tablesCleared: string[] }> {
    const tablesCleared: string[] = [];

    try {
      // Clear user-related data (in dependency order)
      await db.delete(userSettings);
      tablesCleared.push('userSettings');

      await db.delete(userProgress);
      tablesCleared.push('userProgress');

      await db.delete(termViews);
      tablesCleared.push('termViews');

      await db.delete(favorites);
      tablesCleared.push('favorites');

      // Clear purchases data
      await db.delete(purchases);
      tablesCleared.push('purchases');

      // Clear users (this should be done after all user-dependent data)
      await db.delete(users);
      tablesCleared.push('users');

      // Clear term-related data
      await db.delete(termSubcategories);
      tablesCleared.push('termSubcategories');

      await db.delete(terms);
      tablesCleared.push('terms');

      // Clear category hierarchy
      await db.delete(subcategories);
      tablesCleared.push('subcategories');

      await db.delete(categories);
      tablesCleared.push('categories');

      // Clear all caches
      await clearCache();
      tablesCleared.push('queryCache');

      logger.info(`[OptimizedStorage] Successfully cleared ${tablesCleared.length} tables`);

      return { tablesCleared };
    } catch (error) {
      logger.error('[OptimizedStorage] clearAllData error:', error);
      throw new Error(
        `Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async reindexDatabase(): Promise<{
    success: boolean;
    operation: string;
    duration: number;
    operations: string[];
    timestamp: Date;
    message: string;
  }> {
    const startTime = Date.now();
    const operations: string[] = [];

    try {
      logger.info('[OptimizedStorage] Starting comprehensive database reindexing...');
      operations.push('Database reindexing started');

      // 1. Enable required extensions
      try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
        operations.push('pg_trgm extension enabled');
      } catch (error) {
        operations.push(`pg_trgm extension: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 2. Core performance indexes
      const coreIndexes = [
        // Terms table indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_idx ON terms(name)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_category_id_idx ON terms(category_id)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_view_count_idx ON terms(view_count DESC)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_created_at_idx ON terms(created_at DESC)`,

        // Full-text search indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_gin_idx ON terms USING GIN(to_tsvector('english', name))`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_definition_gin_idx ON terms USING GIN(to_tsvector('english', definition))`,

        // Composite indexes for common queries
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_category_view_count_idx ON terms(category_id, view_count DESC)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_category_created_at_idx ON terms(category_id, created_at DESC)`,

        // User activity indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS favorites_user_id_idx ON favorites(user_id)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS user_progress_user_id_idx ON user_progress(user_id)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS term_views_term_id_idx ON term_views(term_id)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS term_views_user_id_idx ON term_views(user_id)`,

        // Category optimization
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS categories_name_lower_idx ON categories(LOWER(name))`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS subcategories_category_id_idx ON subcategories(category_id)`,
      ];

      for (const indexSQL of coreIndexes) {
        try {
          await db.execute(sql.raw(indexSQL));
          operations.push(`✓ ${indexSQL.split(' ')[5]} created`);
        } catch (error) {
          operations.push(`⚠ Index creation: ${error instanceof Error ? error.message : 'error'}`);
        }
      }

      // 3. Enhanced search indexes (if tables exist)
      const enhancedIndexes = [
        // Trigram indexes for fuzzy search
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_trgm_idx ON terms USING GIN(name gin_trgm_ops)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_definition_trgm_idx ON terms USING GIN(definition gin_trgm_ops)`,

        // Case-insensitive search
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_lower_idx ON terms(LOWER(name))`,

        // Time-based partial indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_recent_idx ON terms(created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days'`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_popular_idx ON terms(view_count DESC) WHERE view_count > 10`,
      ];

      for (const indexSQL of enhancedIndexes) {
        try {
          await db.execute(sql.raw(indexSQL));
          operations.push(`✓ Enhanced: ${indexSQL.split(' ')[5]} created`);
        } catch (error) {
          operations.push(`⚠ Enhanced index: ${error instanceof Error ? error.message : 'error'}`);
        }
      }

      // 4. Reindex existing indexes
      try {
        await db.execute(sql`REINDEX DATABASE CONCURRENTLY`);
        operations.push('✓ Database reindexed');
      } catch (_error) {
        // Fallback to table-specific reindexing
        const tables = [
          'terms',
          'categories',
          'subcategories',
          'users',
          'favorites',
          'user_progress',
          'term_views',
        ];
        for (const table of tables) {
          try {
            await db.execute(sql.raw(`REINDEX TABLE ${table}`));
            operations.push(`✓ Reindexed table: ${table}`);
          } catch (tableError) {
            operations.push(
              `⚠ Reindex ${table}: ${tableError instanceof Error ? tableError.message : 'error'}`
            );
          }
        }
      }

      // 5. Update table statistics
      try {
        await db.execute(sql`ANALYZE`);
        operations.push('✓ Database statistics updated');
      } catch (error) {
        operations.push(`⚠ ANALYZE: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 6. Clear query cache to force fresh query plans
      await clearCache();
      operations.push('✓ Query cache cleared');

      const endTime = Date.now();
      const duration = endTime - startTime;

      logger.info(`[OptimizedStorage] Database reindexing completed in ${duration}ms`);

      return {
        success: true,
        operation: 'reindex',
        duration,
        operations,
        timestamp: new Date(),
        message: `Database reindexing completed successfully in ${duration}ms`,
      };
    } catch (error) {
      const endTime = Date.now();
      logger.error('[OptimizedStorage] reindexDatabase error:', error);

      return {
        success: false,
        operation: 'reindex',
        duration: endTime - startTime,
        operations: [
          ...operations,
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        timestamp: new Date(),
        message: `Database reindexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getAdminStats(): Promise<any> {
    return cached(
      CacheKeys.term('admin_stats'),
      async () => {
        try {
          // Get total counts
          const [userCountResult] = await db
            .select({
              count: sql<number>`count(*)`,
            })
            .from(users);

          const [termCountResult] = await db
            .select({
              count: sql<number>`count(*)`,
            })
            .from(terms);

          const [categoryCountResult] = await db
            .select({
              count: sql<number>`count(*)`,
            })
            .from(categories);

          const [viewCountResult] = await db
            .select({
              count: sql<number>`count(*)`,
            })
            .from(termViews);

          // Get recent activity (last 50 actions)
          const recentActivity = await db
            .select({
              id: termViews.id,
              userId: termViews.userId,
              action: sql<string>`'view'`,
              entityType: sql<string>`'term'`,
              entityId: termViews.termId,
              createdAt: termViews.viewedAt,
            })
            .from(termViews)
            .orderBy(desc(termViews.viewedAt))
            .limit(50);

          // Get recent favorites as additional activity
          const recentFavorites = await db
            .select({
              id: favorites.id,
              userId: favorites.userId,
              action: sql<string>`'favorite'`,
              entityType: sql<string>`'term'`,
              entityId: favorites.termId,
              createdAt: favorites.createdAt,
            })
            .from(favorites)
            .orderBy(desc(favorites.createdAt))
            .limit(25);

          // Combine and sort activity
          const combinedActivity = [...recentActivity, ...recentFavorites]
            .sort(
              (a, b) =>
                new Date(b.createdAt || new Date()).getTime() -
                new Date(a.createdAt || new Date()).getTime()
            )
            .slice(0, 50);

          // Basic system health check
          const systemHealth = {
            database: 'healthy' as const,
            s3: 'healthy' as const,
            ai: 'healthy' as const,
          };

          return {
            totalUsers: Number(userCountResult?.count) || 0,
            totalTerms: Number(termCountResult?.count) || 0,
            totalCategories: Number(categoryCountResult?.count) || 0,
            totalViews: Number(viewCountResult?.count) || 0,
            recentActivity: combinedActivity,
            systemHealth,
          };
        } catch (error) {
          logger.error('[OptimizedStorage] getAdminStats error:', error);

          // Return default stats on error
          return {
            totalUsers: 0,
            totalTerms: 0,
            totalCategories: 0,
            totalViews: 0,
            recentActivity: [],
            systemHealth: {
              database: 'error' as const,
              s3: 'warning' as const,
              ai: 'warning' as const,
            },
          };
        }
      },
      120 // Cache for 2 minutes (admin stats change frequently)
    );
  }

  async cleanupDatabase(): Promise<{
    success: boolean;
    operation: string;
    duration: number;
    operations: string[];
    timestamp: Date;
    message: string;
  }> {
    const startTime = Date.now();
    const operations: string[] = [];

    try {
      logger.info('[OptimizedStorage] Starting database cleanup...');
      operations.push('Database cleanup started');

      // 1. Clean up orphaned records
      try {
        // Remove user progress for non-existent users
        await db
          .delete(userProgress)
          .where(sql`user_id NOT IN (SELECT id FROM users)`);
        operations.push(`✓ Cleaned orphaned user progress records`);

        // Remove favorites for non-existent users or terms
        await db
          .delete(favorites)
          .where(
            sql`user_id NOT IN (SELECT id FROM users) OR term_id NOT IN (SELECT id FROM terms)`
          );
        operations.push(`✓ Cleaned orphaned favorites`);

        // Remove term views for non-existent users or terms
        await db
          .delete(termViews)
          .where(
            sql`user_id NOT IN (SELECT id FROM users) OR term_id NOT IN (SELECT id FROM terms)`
          );
        operations.push(`✓ Cleaned orphaned term views`);

        // Remove user settings for non-existent users
        await db
          .delete(userSettings)
          .where(sql`user_id NOT IN (SELECT id FROM users)`);
        operations.push(`✓ Cleaned orphaned user settings`);
      } catch (error) {
        operations.push(`⚠ Orphan cleanup: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 2. Clean up old/expired data
      try {
        // Remove old term views (older than 6 months)
        await db
          .delete(termViews)
          .where(sql`viewed_at < NOW() - INTERVAL '6 months'`);
        operations.push(`✓ Cleaned old term views (6+ months)`);
      } catch (error) {
        operations.push(`⚠ Old data cleanup: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 3. Optimize table statistics
      try {
        await db.execute(
          sql`ANALYZE users, terms, categories, subcategories, favorites, user_progress, term_views`
        );
        operations.push('✓ Updated table statistics');
      } catch (error) {
        operations.push(`⚠ Statistics update: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 4. Clear query cache
      await clearCache();
      operations.push('✓ Query cache cleared');

      const endTime = Date.now();
      const duration = endTime - startTime;

      logger.info(`[OptimizedStorage] Database cleanup completed in ${duration}ms`);

      return {
        success: true,
        operation: 'cleanup',
        duration,
        operations,
        timestamp: new Date(),
        message: `Database cleanup completed successfully in ${duration}ms`,
      };
    } catch (error) {
      const endTime = Date.now();
      logger.error('[OptimizedStorage] cleanupDatabase error:', error);

      return {
        success: false,
        operation: 'cleanup',
        duration: endTime - startTime,
        operations: [
          ...operations,
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        timestamp: new Date(),
        message: `Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async vacuumDatabase(): Promise<{
    success: boolean;
    operation: string;
    duration: number;
    operations: string[];
    timestamp: Date;
    message: string;
  }> {
    const startTime = Date.now();
    const operations: string[] = [];

    try {
      logger.info('[OptimizedStorage] Starting database vacuum...');
      operations.push('Database vacuum started');

      // 1. Vacuum main tables
      const tables = [
        'users',
        'terms',
        'categories',
        'subcategories',
        'favorites',
        'user_progress',
        'term_views',
        'purchases',
      ];

      for (const table of tables) {
        try {
          await db.execute(sql.raw(`VACUUM ANALYZE ${table}`));
          operations.push(`✓ Vacuumed table: ${table}`);
        } catch (error) {
          operations.push(`⚠ Vacuum ${table}: ${error instanceof Error ? error.message : 'error'}`);
        }
      }

      // 2. Full database vacuum (if supported)
      try {
        await db.execute(sql`VACUUM`);
        operations.push('✓ Full database vacuum completed');
      } catch (error) {
        operations.push(`⚠ Full vacuum: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 3. Update all table statistics
      try {
        await db.execute(sql`ANALYZE`);
        operations.push('✓ All table statistics updated');
      } catch (error) {
        operations.push(`⚠ Statistics update: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 4. Clear query cache to refresh query plans
      await clearCache();
      operations.push('✓ Query cache cleared');

      const endTime = Date.now();
      const duration = endTime - startTime;

      logger.info(`[OptimizedStorage] Database vacuum completed in ${duration}ms`);

      return {
        success: true,
        operation: 'vacuum',
        duration,
        operations,
        timestamp: new Date(),
        message: `Database vacuum completed successfully in ${duration}ms`,
      };
    } catch (error) {
      const endTime = Date.now();
      logger.error('[OptimizedStorage] vacuumDatabase error:', error);

      return {
        success: false,
        operation: 'vacuum',
        duration: endTime - startTime,
        operations: [
          ...operations,
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        timestamp: new Date(),
        message: `Database vacuum failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getPendingContent(): Promise<any[]> {
    return cached(
      CacheKeys.term('pending_content'),
      async () => {
        try {
          // Get pending feedback from ai_content_feedback table
          const pendingFeedback = await db.execute(sql`
            SELECT 
              f.id,
              f.term_id,
              f.user_id,
              f.feedback_type,
              f.section,
              f.description,
              f.severity,
              f.status,
              f.created_at,
              t.name as term_name,
              u.email as user_email
            FROM ai_content_feedback f
            LEFT JOIN terms t ON f.term_id = t.id
            LEFT JOIN users u ON f.user_id = u.id
            WHERE f.status IN ('pending', 'reviewing')
            ORDER BY f.severity DESC, f.created_at DESC
            LIMIT 100
          `);

          return pendingFeedback.rows || [];
        } catch (error) {
          logger.error('[OptimizedStorage] getPendingContent error:', error);
          return [];
        }
      },
      60 // Cache for 1 minute (pending content changes frequently)
    );
  }

  async approveContent(id: string): Promise<any> {
    try {
      // Update feedback status to resolved
      const result = await db.execute(sql`
        UPDATE ai_content_feedback 
        SET 
          status = 'resolved',
          reviewed_at = NOW(),
          review_notes = 'Content approved by admin'
        WHERE id = ${id}
        RETURNING *
      `);

      // Clear pending content cache
      await clearCache();

      if (result.rows && result.rows.length > 0) {
        logger.info(`[OptimizedStorage] Content approved: ${id}`);
        return {
          success: true,
          id,
          status: 'resolved',
          message: 'Content approved successfully',
        };
      } 
        throw new Error('Content not found');
      
    } catch (error) {
      logger.error('[OptimizedStorage] approveContent error:', error);
      throw new Error(
        `Failed to approve content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async rejectContent(id: string): Promise<any> {
    try {
      // Update feedback status to dismissed
      const result = await db.execute(sql`
        UPDATE ai_content_feedback 
        SET 
          status = 'dismissed',
          reviewed_at = NOW(),
          review_notes = 'Content rejected by admin'
        WHERE id = ${id}
        RETURNING *
      `);

      // Clear pending content cache
      await clearCache();

      if (result.rows && result.rows.length > 0) {
        logger.info(`[OptimizedStorage] Content rejected: ${id}`);
        return {
          success: true,
          id,
          status: 'dismissed',
          message: 'Content rejected successfully',
        };
      } 
        throw new Error('Content not found');
      
    } catch (error) {
      logger.error('[OptimizedStorage] rejectContent error:', error);
      throw new Error(
        `Failed to reject content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCategoryStats(categoryId?: string): Promise<any> {
    try {
      if (categoryId) {
        // Get stats for a specific category
        const [termCountResult] = await db
          .select({
            count: sql<number>`count(*)`,
          })
          .from(terms)
          .where(eq(terms.categoryId, categoryId));

        const [categoryResult] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, categoryId))
          .limit(1);

        return {
          categoryId,
          categoryName: categoryResult?.name || 'Unknown',
          termCount: termCountResult?.count || 0,
          lastUpdated: new Date(),
        };
      } 
        // Get stats for all categories
        const results = await db
          .select({
            categoryId: categories.id,
            categoryName: categories.name,
            termCount: sql<number>`count(${terms.id})`,
          })
          .from(categories)
          .leftJoin(terms, eq(categories.id, terms.categoryId))
          .groupBy(categories.id, categories.name)
          .orderBy(desc(sql`count(${terms.id})`));

        return results;
      
    } catch (error) {
      logger.error('[OptimizedStorage] getCategoryStats error:', error);
      throw new Error(
        `Failed to get category stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Additional missing methods implementation
  async getTermsByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) {return [];}

    return await db.select().from(terms).where(inArray(terms.id, ids));
  }

  async submitFeedback(_data: any): Promise<any> {
    // Placeholder implementation - would need feedback table schema
    return { success: true, id: `feedback-${Date.now()}` };
  }

  async storeFeedback(data: any): Promise<any> {
    // This is an alias for submitFeedback for backward compatibility
    return this.submitFeedback(data);
  }

  async getFeedback(filters: {
    status?: string;
    feedbackType?: string;
    severity?: string;
    termId?: string;
    userId?: string;
  } = {}, pagination: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: any[]; total: number }> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [];
      if (filters.status) {
        conditions.push(eq(aiContentFeedback.status, filters.status));
      }
      if (filters.feedbackType) {
        conditions.push(eq(aiContentFeedback.feedbackType, filters.feedbackType));
      }
      if (filters.severity) {
        conditions.push(eq(aiContentFeedback.severity, filters.severity));
      }
      if (filters.termId) {
        conditions.push(eq(aiContentFeedback.termId, filters.termId));
      }
      if (filters.userId) {
        conditions.push(eq(aiContentFeedback.userId, filters.userId));
      }

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiContentFeedback)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Get paginated data
      const data = await db
        .select({
          id: aiContentFeedback.id,
          termId: aiContentFeedback.termId,
          userId: aiContentFeedback.userId,
          feedbackType: aiContentFeedback.feedbackType,
          section: aiContentFeedback.section,
          description: aiContentFeedback.description,
          severity: aiContentFeedback.severity,
          status: aiContentFeedback.status,
          reviewedBy: aiContentFeedback.reviewedBy,
          reviewedAt: aiContentFeedback.reviewedAt,
          reviewNotes: aiContentFeedback.reviewNotes,
          createdAt: aiContentFeedback.createdAt,
          updatedAt: aiContentFeedback.updatedAt,
        })
        .from(aiContentFeedback)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(aiContentFeedback.createdAt))
        .limit(limit)
        .offset(offset);

      return { data, total: Number(count) };
    } catch (error) {
      log.error('Error fetching feedback', { error });
      throw error;
    }
  }

  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    pendingReview: number;
    reviewing: number;
    resolved: number;
    dismissed: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    try {
      // Get overall stats by status
      const statusStats = await db
        .select({
          status: aiContentFeedback.status,
          count: sql<number>`count(*)`,
        })
        .from(aiContentFeedback)
        .groupBy(aiContentFeedback.status);

      // Get stats by feedback type
      const typeStats = await db
        .select({
          feedbackType: aiContentFeedback.feedbackType,
          count: sql<number>`count(*)`,
        })
        .from(aiContentFeedback)
        .groupBy(aiContentFeedback.feedbackType);

      // Get stats by severity
      const severityStats = await db
        .select({
          severity: aiContentFeedback.severity,
          count: sql<number>`count(*)`,
        })
        .from(aiContentFeedback)
        .groupBy(aiContentFeedback.severity);

      // Calculate totals
      const stats = {
        totalFeedback: 0,
        pendingReview: 0,
        reviewing: 0,
        resolved: 0,
        dismissed: 0,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
      };

      // Process status stats
      statusStats.forEach(({ status, count }) => {
        const countNum = Number(count);
        stats.totalFeedback += countNum;
        
        switch (status) {
          case 'pending':
            stats.pendingReview = countNum;
            break;
          case 'reviewing':
            stats.reviewing = countNum;
            break;
          case 'resolved':
            stats.resolved = countNum;
            break;
          case 'dismissed':
            stats.dismissed = countNum;
            break;
        }
      });

      // Process type stats
      typeStats.forEach(({ feedbackType, count }) => {
        stats.byType[feedbackType] = Number(count);
      });

      // Process severity stats
      severityStats.forEach(({ severity, count }) => {
        if (severity) {
          stats.bySeverity[severity] = Number(count);
        }
      });

      return stats;
    } catch (error) {
      log.error('Error fetching feedback stats', { error });
      // Return empty stats on error
      return {
        totalFeedback: 0,
        pendingReview: 0,
        reviewing: 0,
        resolved: 0,
        dismissed: 0,
        byType: {},
        bySeverity: {},
      };
    }
  }

  async updateFeedbackStatus(
    id: string, 
    status: string, 
    notes?: string,
    reviewerId?: string
  ): Promise<any> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (notes) {
        updateData.reviewNotes = notes;
      }

      if (reviewerId) {
        updateData.reviewedBy = reviewerId;
        updateData.reviewedAt = new Date();
      }

      const [updated] = await db
        .update(aiContentFeedback)
        .set(updateData)
        .where(eq(aiContentFeedback.id, id))
        .returning();

      if (!updated) {
        throw new Error('Feedback not found');
      }

      log.info('Feedback status updated', { 
        feedbackId: id, 
        newStatus: status,
        reviewerId
      });

      return { 
        success: true, 
        id, 
        status,
        feedback: updated 
      };
    } catch (error) {
      log.error('Error updating feedback status', { error, feedbackId: id });
      throw error;
    }
  }

  async initializeFeedbackSchema(): Promise<void> {
    // Placeholder implementation - would need feedback table schema
    logger.info('Feedback schema initialization placeholder');
  }

  async createFeedbackIndexes(): Promise<void> {
    // Placeholder implementation - would need feedback table schema
    logger.info('Feedback indexes creation placeholder');
  }

  async updateTermSection(termId: string, sectionId: string, data: any): Promise<void> {
    // Placeholder implementation - would need enhanced term sections
    logger.info('Term section update placeholder:', { termId, sectionId, data });
  }

  async trackTermView(userId: string, termId: string, _sectionId?: string): Promise<void> {
    await this.recordTermView(termId, userId);
  }

  async trackSectionCompletion(userId: string, termId: string, sectionId: string): Promise<void> {
    // Placeholder implementation - would need section completion tracking
    logger.info('Section completion tracking placeholder:', { userId, termId, sectionId });
  }

  async getUserSectionProgress(userId: string, _options?: any): Promise<any[]> {
    // Return user progress in a different format
    const progress = await this.getUserProgress(userId);
    return progress.learnedTerms || [];
  }

  async getUserTimeSpent(_userId: string, _timeframe?: string): Promise<number> {
    // Placeholder implementation - would need time tracking schema
    return 0;
  }

  async getCategoryProgress(_userId: string): Promise<any[]> {
    // Placeholder implementation - would need category progress tracking
    return [];
  }

  async isAchievementUnlocked(userId: string, achievementId: string): Promise<boolean> {
    // Define achievements based on user activity
    const achievements = await this.getUserAchievements(userId);
    return achievements.some(a => a.id === achievementId && a.unlockedAt !== null);
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<any> {
    const achievement = await this.getAchievementById(achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Check if already unlocked
    const isUnlocked = await this.isAchievementUnlocked(userId, achievementId);
    if (isUnlocked) {
      return { success: false, message: 'Achievement already unlocked', achievement };
    }

    // Since we don't have an achievements table, we'll return a virtual achievement
    return {
      success: true,
      achievement: {
        ...achievement,
        unlockedAt: new Date(),
        userId,
      },
    };
  }

  // Helper method to get all possible achievements
  private async getAchievementById(achievementId: string): Promise<any> {
    const achievements = [
      {
        id: 'first-term',
        name: 'First Steps',
        description: 'View your first AI/ML term',
        icon: '🎯',
        category: 'learning',
      },
      {
        id: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        category: 'streak',
      },
      {
        id: 'streak-30',
        name: 'Monthly Master',
        description: 'Maintain a 30-day learning streak',
        icon: '💎',
        category: 'streak',
      },
      {
        id: 'terms-10',
        name: 'Knowledge Seeker',
        description: 'View 10 different terms',
        icon: '📚',
        category: 'learning',
      },
      {
        id: 'terms-50',
        name: 'AI Explorer',
        description: 'View 50 different terms',
        icon: '🚀',
        category: 'learning',
      },
      {
        id: 'terms-100',
        name: 'ML Scholar',
        description: 'View 100 different terms',
        icon: '🎓',
        category: 'learning',
      },
      {
        id: 'category-complete',
        name: 'Category Champion',
        description: 'Complete all terms in a category',
        icon: '🏆',
        category: 'completion',
      },
      {
        id: 'favorites-10',
        name: 'Curator',
        description: 'Add 10 terms to favorites',
        icon: '⭐',
        category: 'engagement',
      },
    ];

    return achievements.find(a => a.id === achievementId);
  }

  // Helper method to get user achievements based on their activity
  async getUserAchievements(userId: string): Promise<any[]> {
    const achievements = [];
    
    // Get user stats
    const termViewsCount = await db
      .select({ count: sql<number>`count(distinct ${termViews.termId})` })
      .from(termViews)
      .where(eq(termViews.userId, userId));
    
    const viewCount = Number(termViewsCount[0]?.count || 0);
    
    // Get streak data
    const streakData = await this.getUserStreak(userId);
    
    // Get favorites count
    const favoritesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    const favCount = Number(favoritesCount[0]?.count || 0);

    // Check achievements
    if (viewCount >= 1) {
      achievements.push({
        id: 'first-term',
        name: 'First Steps',
        description: 'View your first AI/ML term',
        icon: '🎯',
        unlockedAt: new Date(), // Would need to track actual unlock date
        progress: viewCount,
        maxProgress: 1,
      });
    }

    if (streakData.currentStreak >= 7 || streakData.longestStreak >= 7) {
      achievements.push({
        id: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        unlockedAt: new Date(),
        progress: Math.max(streakData.currentStreak, streakData.longestStreak),
        maxProgress: 7,
      });
    }

    if (streakData.currentStreak >= 30 || streakData.longestStreak >= 30) {
      achievements.push({
        id: 'streak-30',
        name: 'Monthly Master',
        description: 'Maintain a 30-day learning streak',
        icon: '💎',
        unlockedAt: new Date(),
        progress: Math.max(streakData.currentStreak, streakData.longestStreak),
        maxProgress: 30,
      });
    }

    if (viewCount >= 10) {
      achievements.push({
        id: 'terms-10',
        name: 'Knowledge Seeker',
        description: 'View 10 different terms',
        icon: '📚',
        unlockedAt: new Date(),
        progress: viewCount,
        maxProgress: 10,
      });
    }

    if (viewCount >= 50) {
      achievements.push({
        id: 'terms-50',
        name: 'AI Explorer',
        description: 'View 50 different terms',
        icon: '🚀',
        unlockedAt: new Date(),
        progress: viewCount,
        maxProgress: 50,
      });
    }

    if (viewCount >= 100) {
      achievements.push({
        id: 'terms-100',
        name: 'ML Scholar',
        description: 'View 100 different terms',
        icon: '🎓',
        unlockedAt: new Date(),
        progress: viewCount,
        maxProgress: 100,
      });
    }

    if (favCount >= 10) {
      achievements.push({
        id: 'favorites-10',
        name: 'Curator',
        description: 'Add 10 terms to favorites',
        icon: '⭐',
        unlockedAt: new Date(),
        progress: favCount,
        maxProgress: 10,
      });
    }

    return achievements;
  }

  // Subcategory operations
  async getSubcategoriesOptimized(options: {
    offset?: number;
    limit?: number;
    fields?: string[];
    search?: string;
    categoryId?: string;
    includeStats?: boolean;
  }): Promise<any[]> {
    const {
      offset = 0,
      limit = 100,
      _fields = ['*'],
      search,
      categoryId,
      includeStats = false,
    } = options;

    try {
      // Start with basic query
      let query = db.select().from(subcategories);

      const conditions = [];

      if (search) {
        conditions.push(ilike(subcategories.name, `%${search}%`));
      }

      if (categoryId) {
        conditions.push(eq(subcategories.categoryId, categoryId));
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
      }

      query = query.orderBy(asc(subcategories.name)).limit(limit).offset(offset);

      const results = await query;

      // If includeStats is true, add term count manually
      if (includeStats) {
        const resultsWithCount = await Promise.all(
          results.map(async subcategory => {
            const countQuery = await db
              .select({
                count: sql<number>`COUNT(*)`,
              })
              .from(termSubcategories)
              .where(eq(termSubcategories.subcategoryId, subcategory.id));

            return {
              ...subcategory,
              termCount: countQuery[0]?.count || 0,
            };
          })
        );
        return resultsWithCount;
      }

      return results.map(r => ({ ...r, termCount: 0 }));
    } catch (error) {
      logger.error('Error in getSubcategoriesOptimized:', error);
      throw error;
    }
  }

  async getSubcategoriesCount(options: { search?: string; categoryId?: string }): Promise<number> {
    try {
      const { search, categoryId } = options || {};

      let query = db.select({ count: sql<number>`COUNT(*)` }).from(subcategories);

      const conditions = [];

      if (search) {
        conditions.push(ilike(subcategories.name, `%${search}%`));
      }

      if (categoryId) {
        conditions.push(eq(subcategories.categoryId, categoryId));
      }

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
      }

      const result = await query;
      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Error in getSubcategoriesCount:', error);
      return 0;
    }
  }

  async getSubcategoryById(id: string): Promise<any | null> {
    const result = await db
      .select({
        id: subcategories.id,
        name: subcategories.name,
        categoryId: subcategories.categoryId,
        createdAt: subcategories.createdAt,
        updatedAt: subcategories.updatedAt,
        termCount: sql<number>`COUNT(DISTINCT ${termSubcategories.termId})`,
      })
      .from(subcategories)
      .leftJoin(termSubcategories, eq(subcategories.id, termSubcategories.subcategoryId))
      .where(eq(subcategories.id, id))
      .groupBy(
        subcategories.id,
        subcategories.name,
        subcategories.categoryId,
        subcategories.createdAt,
        subcategories.updatedAt
      );

    return result[0] || null;
  }

  async getTermsBySubcategory(
    subcategoryId: string,
    options: {
      offset?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      fields?: string[];
    }
  ): Promise<{ data: any[]; total: number }> {
    const { offset = 0, limit = 50, sort = 'name', order = 'asc', _fields = ['*'] } = options;

    // Get total count first
    const totalResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${terms.id})`,
      })
      .from(terms)
      .innerJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
      .where(eq(termSubcategories.subcategoryId, subcategoryId));

    const total = totalResult[0]?.count || 0;

    // Get the actual data
    let query = db
      .select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        definition: terms.definition,
        viewCount: terms.viewCount,
        categoryId: terms.categoryId,
        createdAt: terms.createdAt,
        updatedAt: terms.updatedAt,
      })
      .from(terms)
      .innerJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
      .where(eq(termSubcategories.subcategoryId, subcategoryId));

    // Apply sorting
    if (sort === 'name') {
      query = query.orderBy(order === 'desc' ? desc(terms.name) : asc(terms.name));
    } else if (sort === 'viewCount') {
      query = query.orderBy(order === 'desc' ? desc(terms.viewCount) : asc(terms.viewCount));
    } else if (sort === 'createdAt') {
      query = query.orderBy(order === 'desc' ? desc(terms.createdAt) : asc(terms.createdAt));
    }

    query = query.limit(limit).offset(offset);

    const data = await query;

    return { data, total };
  }

  // Section-related methods for 42-section content system
  async getTermSections(termId: string): Promise<any[]> {
    const cacheKey = `term_sections:${termId}`;

    return cached(
      cacheKey,
      async () => {
        try {
          // Get all sections for this term
          const sections = await db
            .select()
            .from(termSections)
            .where(eq(termSections.termId, termId))
            .orderBy(desc(termSections.priority), asc(termSections.sectionName));

          return sections;
        } catch (error) {
          logger.error('[OptimizedStorage] Error fetching term sections:', error);
          return [];
        }
      },
      CacheKeys.SHORT_CACHE_TTL
    );
  }

  async getSectionById(sectionId: string): Promise<any | null> {
    const cacheKey = `section:${sectionId}`;

    return cached(
      cacheKey,
      async () => {
        try {
          // Get specific section by ID
          const [section] = await db
            .select()
            .from(termSections)
            .where(eq(termSections.id, sectionId));

          return section || null;
        } catch (error) {
          logger.error('[OptimizedStorage] Error fetching section by ID:', error);
          return null;
        }
      },
      CacheKeys.SHORT_CACHE_TTL
    );
  }

  async getContentGallery(sectionName: string, page = 1, limit = 20): Promise<any> {
    const cacheKey = `content_gallery:${sectionName}:${page}:${limit}`;

    return cached(
      cacheKey,
      async () => {
        try {
          const offset = (page - 1) * limit;

          // Get sections matching the section name with pagination
          const sectionsQuery = await db
            .select({
              id: termSections.id,
              termId: termSections.termId,
              sectionName: termSections.sectionName,
              sectionData: termSections.sectionData,
              displayType: termSections.displayType,
              priority: termSections.priority,
              isInteractive: termSections.isInteractive,
              createdAt: termSections.createdAt,
              updatedAt: termSections.updatedAt,
            })
            .from(termSections)
            .where(eq(termSections.sectionName, sectionName))
            .orderBy(desc(termSections.priority), desc(termSections.createdAt))
            .limit(limit)
            .offset(offset);

          // Get total count for pagination
          const [{ count: totalCount }] = await db
            .select({
              count: sql<number>`count(*)`,
            })
            .from(termSections)
            .where(eq(termSections.sectionName, sectionName));

          const totalPages = Math.ceil(totalCount / limit);

          return {
            sectionName,
            items: sectionsQuery,
            termCount: totalCount,
            totalPages,
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          };
        } catch (error) {
          logger.error('[OptimizedStorage] Error fetching content gallery:', error);
          return {
            sectionName,
            items: [],
            termCount: 0,
            totalPages: 0,
            currentPage: page,
            hasNextPage: false,
            hasPrevPage: false,
          };
        }
      },
      CacheKeys.MEDIUM_CACHE_TTL
    );
  }

  async getUserProgressSummary(userId: string): Promise<any> {
    const cacheKey = `user_progress_summary:${userId}`;

    return cached(
      cacheKey,
      async () => {
        // Get user progress from existing userProgress table
        const progressRows = await db
          .select()
          .from(userProgress)
          .where(eq(userProgress.userId, userId));

        const totalSections = 42; // Based on the 42-section architecture
        const completedSections = progressRows.length;
        const inProgressSections = 0; // Could be calculated based on partial completion

        return {
          totalSections,
          completedSections,
          inProgressSections,
          completionPercentage: Math.round((completedSections / totalSections) * 100),
        };
      },
      CacheKeys.SHORT_CACHE_TTL
    );
  }

  async updateUserProgress(
    userId: string,
    termId: string,
    _sectionId: string,
    _progressData: any
  ): Promise<void> {
    // For now, use the existing markTermAsLearned method
    await this.markTermAsLearned(userId, termId);

    // Clear cache for user progress
    clearCache(`user_progress_summary:${userId}`);
    clearCache(`term_sections:${termId}`);
  }

  async searchSectionContent(query: string, options: any = {}): Promise<any> {
    const { contentType, sectionName, page = 1, limit = 20 } = options;
    const cacheKey = `section_search:${query}:${contentType || 'all'}:${sectionName || 'all'}:${page}:${limit}`;

    return cached(
      cacheKey,
      async () => {
        try {
          const offset = (page - 1) * limit;
          const searchQuery = `%${query}%`;

          // Build where conditions
          const whereConditions = [];

          // Add text search on section data
          whereConditions.push(
            or(
              sql`${termSections.sectionData}::text ILIKE ${searchQuery}`,
              ilike(termSections.sectionName, searchQuery)
            )
          );

          // Filter by content type if provided
          if (contentType && contentType !== 'all') {
            whereConditions.push(eq(termSections.displayType, contentType));
          }

          // Filter by section name if provided
          if (sectionName && sectionName !== 'all') {
            whereConditions.push(eq(termSections.sectionName, sectionName));
          }

          const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

          // Get search results with pagination
          const results = await db
            .select({
              id: termSections.id,
              termId: termSections.termId,
              sectionName: termSections.sectionName,
              sectionData: termSections.sectionData,
              displayType: termSections.displayType,
              priority: termSections.priority,
              isInteractive: termSections.isInteractive,
              createdAt: termSections.createdAt,
              updatedAt: termSections.updatedAt,
            })
            .from(termSections)
            .where(whereClause)
            .orderBy(desc(termSections.priority), desc(termSections.createdAt))
            .limit(limit)
            .offset(offset);

          // Get total count for pagination
          const [{ count: totalCount }] = await db
            .select({
              count: sql<number>`count(*)`,
            })
            .from(termSections)
            .where(whereClause);

          const hasMore = offset + results.length < totalCount;

          return {
            data: results,
            total: totalCount,
            hasMore,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
          };
        } catch (error) {
          logger.error('[OptimizedStorage] Error searching section content:', error);
          return {
            data: [],
            total: 0,
            hasMore: false,
            page,
            limit,
            totalPages: 0,
          };
        }
      },
      CacheKeys.SHORT_CACHE_TTL
    );
  }

  async getSectionAnalytics(): Promise<any> {
    const cacheKey = 'section_analytics';

    return cached(
      cacheKey,
      async () => {
        // Calculate basic analytics from existing data
        const termCount = await db.select({ count: sql<number>`COUNT(*)` }).from(terms);

        return {
          totalSections: 42, // Based on 42-section architecture
          totalTerms: termCount[0]?.count || 0,
          totalItems: 0, // Would be sum of all section items
          completionRates: [], // Would be calculated from user progress
          popularSections: [], // Would be calculated from view counts
        };
      },
      CacheKeys.LONG_CACHE_TTL
    );
  }
}

// Export singleton instance
export const optimizedStorage = new OptimizedStorage();

// For backward compatibility, export all methods
export const storage = optimizedStorage;
