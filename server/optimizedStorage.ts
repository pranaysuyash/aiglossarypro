/**
 * Optimized Storage Implementation
 * 
 * Fixes N+1 query problems and implements performance optimizations
 * identified in the database analysis. This replaces the original storage.ts
 * with better query patterns and caching.
 */

import {
  users,
  terms,
  categories,
  subcategories,
  termSubcategories,
  favorites,
  userProgress,
  termViews,
  userSettings
} from "@shared/enhancedSchema";
import type { User, UpsertUser } from "@shared/schema";
import { purchases } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, like, ilike, asc, gte, lte, not, isNull, inArray, or } from "drizzle-orm";
import { 
  createInsertSchema, 
  createSelectSchema
} from "drizzle-zod";
import { z } from "zod";
import { formatDistanceToNow, subDays, format, startOfDay, endOfDay } from "date-fns";
import { cached, CacheKeys, CacheInvalidation, queryCache, clearCache, getCacheStats } from './middleware/queryCache';

// Interface for storage operations (same as original)
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
  
  // Revenue tracking operations
  getTotalRevenue(): Promise<number>;
  getTotalPurchases(): Promise<number>;
  getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getPurchasesForPeriod(startDate: Date, endDate: Date): Promise<number>;
  getTotalUsers(): Promise<number>;
  getRevenueByCurrency(): Promise<Array<{ currency: string; total: number }>>;
  getDailyRevenueForPeriod(startDate: Date, endDate: Date): Promise<Array<{ date: string; revenue: number }>>;
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
    const result = await db.insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          updatedAt: new Date()
        }
      })
      .returning();

    // Invalidate user cache
    CacheInvalidation.user(user.id);
    
    return result[0];
  }

  // Categories (heavily cached since they change rarely)
  async getCategories(): Promise<any[]> {
    return cached(
      CacheKeys.categoryTree(),
      async () => {
        return await db.select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          termCount: sql<number>`(
            SELECT COUNT(*) 
            FROM ${terms} 
            WHERE ${terms.categoryId} = ${categories.id}
          )`
        })
        .from(categories)
        .orderBy(categories.name);
      },
      60 * 60 * 1000 // 1 hour cache
    );
  }

  async getCategoryById(id: string): Promise<any> {
    return cached(
      CacheKeys.term(`category:${id}`),
      async () => {
        const result = await db.select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          termCount: sql<number>`(
            SELECT COUNT(*) 
            FROM ${terms} 
            WHERE ${terms.categoryId} = ${categories.id}
          )`
        })
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);
        
        return result[0];
      },
      30 * 60 * 1000 // 30 minutes
    );
  }

  // OPTIMIZED: Fixed N+1 query problem in featured terms
  async getFeaturedTerms(): Promise<any[]> {
    return cached(
      CacheKeys.popularTerms(),
      async () => {
        // Single query with aggregated subcategories
        const results = await db.select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
          subcategories: sql<string[]>`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
        .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .groupBy(terms.id, categories.id, categories.name)
        .orderBy(desc(terms.viewCount))
        .limit(20);

        return results.map(result => ({
          ...result,
          subcategories: result.subcategories?.filter(Boolean) || []
        }));
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async getTermById(id: string): Promise<any> {
    return cached(
      CacheKeys.term(id),
      async () => {
        // Single query with all related data
        const result = await db.select({
          id: terms.id,
          name: terms.name,
          definition: terms.definition,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          categoryId: terms.categoryId,
          category: categories.name,
          categoryDescription: categories.description,
          subcategories: sql<string[]>`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`,
          createdAt: terms.createdAt,
          updatedAt: terms.updatedAt
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
        .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(eq(terms.id, id))
        .groupBy(terms.id, categories.id)
        .limit(1);

        if (result.length === 0) return undefined;

        return {
          ...result[0],
          subcategories: result[0].subcategories?.filter(Boolean) || []
        };
      },
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  async getRecentlyViewedTerms(userId: string): Promise<any[]> {
    return cached(
      `user:${userId}:recent_views`,
      async () => {
        // Optimized query with single JOIN
        const results = await db.select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
          viewedAt: termViews.viewedAt,
          subcategories: sql<string[]>`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`
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

        return results.map(result => ({
          ...result,
          subcategories: result.subcategories?.filter(Boolean) || []
        }));
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async recordTermView(termId: string, userId: string | null): Promise<void> {
    // Always execute this (no caching for writes)
    if (userId) {
      await db.insert(termViews).values({
        termId,
        userId,
        viewedAt: new Date()
      }).onConflictDoNothing();
      
      // Invalidate related caches
      CacheInvalidation.user(userId);
    }

    // Update view count
    await db.update(terms)
      .set({ 
        viewCount: sql`${terms.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(terms.id, termId));
    
    // Invalidate term and popular terms cache
    CacheInvalidation.term(termId);
  }

  // OPTIMIZED: Single query for search with aggregated subcategories
  async searchTerms(query: string): Promise<any[]> {
    return cached(
      CacheKeys.termSearch(query),
      async () => {
        // Use full-text search if available, fallback to ILIKE
        const searchCondition = sql`
          to_tsvector('english', ${terms.name} || ' ' || COALESCE(${terms.definition}, '')) 
          @@ plainto_tsquery('english', ${query})
          OR ${terms.name} ILIKE ${`%${query}%`}
        `;

        const relevanceScore = sql<number>`
          CASE 
            WHEN ${terms.name} ILIKE ${`${query}%`} THEN 1.0
            WHEN ${terms.name} ILIKE ${`%${query}%`} THEN 0.8
            ELSE 0.5
          END
        `;

        const results = await db.select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
          subcategories: sql<string[]>`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`,
          // Add relevance scoring
          relevance: relevanceScore
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
        .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(searchCondition)
        .groupBy(terms.id, categories.id, categories.name)
        .orderBy(desc(relevanceScore), desc(terms.viewCount))
        .limit(20);

        return results.map(result => ({
          ...result,
          subcategories: result.subcategories?.filter(Boolean) || []
        }));
      },
      2 * 60 * 1000 // 2 minutes cache (shorter for search)
    );
  }

  // OPTIMIZED: Fixed N+1 query problem in favorites
  async getUserFavorites(userId: string): Promise<any[]> {
    return cached(
      CacheKeys.userFavorites(userId),
      async () => {
        // Single query with aggregated subcategories
        const results = await db.select({
          termId: favorites.termId,
          createdAt: favorites.createdAt,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
          subcategories: sql<string[]>`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`
        })
        .from(favorites)
        .innerJoin(terms, eq(favorites.termId, terms.id))
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
        .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(eq(favorites.userId, userId))
        .groupBy(
          favorites.termId, 
          favorites.createdAt,
          terms.name,
          terms.shortDefinition,
          terms.viewCount,
          categories.name,
          categories.id
        )
        .orderBy(desc(favorites.createdAt));

        return results.map(result => ({
          ...result,
          subcategories: result.subcategories?.filter(Boolean) || []
        }));
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async isTermFavorite(userId: string, termId: string): Promise<boolean> {
    return cached(
      `user:${userId}:favorite:${termId}`,
      async () => {
        const result = await db.select({ id: favorites.id })
          .from(favorites)
          .where(and(eq(favorites.userId, userId), eq(favorites.termId, termId)))
          .limit(1);
        
        return result.length > 0;
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async addFavorite(userId: string, termId: string): Promise<void> {
    await db.insert(favorites).values({
      userId,
      termId,
      createdAt: new Date()
    }).onConflictDoNothing();
    
    // Invalidate caches
    CacheInvalidation.user(userId);
    queryCache.invalidate(`user:${userId}:favorite:${termId}`);
  }

  async removeFavorite(userId: string, termId: string): Promise<void> {
    await db.delete(favorites)
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
        const learned = await db.select({
          termId: userProgress.termId,
          learnedAt: userProgress.learnedAt
        })
        .from(userProgress)
        .where(eq(userProgress.userId, userId));

        const totalTerms = await db.select({ count: sql<number>`count(*)` })
          .from(terms);

        return {
          learnedCount: learned.length,
          totalTerms: totalTerms[0].count,
          percentage: totalTerms[0].count > 0 ? (learned.length / totalTerms[0].count) * 100 : 0,
          learnedTerms: learned
        };
      },
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  async isTermLearned(userId: string, termId: string): Promise<boolean> {
    return cached(
      `user:${userId}:learned:${termId}`,
      async () => {
        const result = await db.select({ id: userProgress.id })
          .from(userProgress)
          .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)))
          .limit(1);
        
        return result.length > 0;
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async markTermAsLearned(userId: string, termId: string): Promise<void> {
    await db.insert(userProgress).values({
      userId,
      termId,
      learnedAt: new Date()
    }).onConflictDoNothing();
    
    // Invalidate caches
    CacheInvalidation.user(userId);
    queryCache.invalidate(`user:${userId}:learned:${termId}`);
  }

  async unmarkTermAsLearned(userId: string, termId: string): Promise<void> {
    await db.delete(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)));
    
    // Invalidate caches
    CacheInvalidation.user(userId);
    queryCache.invalidate(`user:${userId}:learned:${termId}`);
  }

  // Bulk operations for better performance
  async getTermsByCategory(categoryId: string, page: number = 1, limit: number = 20): Promise<any[]> {
    return cached(
      CacheKeys.termsByCategory(categoryId, page),
      async () => {
        const offset = (page - 1) * limit;
        
        const results = await db.select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
          subcategories: sql<string[]>`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
        .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(eq(terms.categoryId, categoryId))
        .groupBy(terms.id, categories.id, categories.name)
        .orderBy(desc(terms.viewCount))
        .limit(limit)
        .offset(offset);

        return results.map(result => ({
          ...result,
          subcategories: result.subcategories?.filter(Boolean) || []
        }));
      },
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  // Statistics and analytics (cached heavily)
  async getPopularTerms(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any[]> {
    return cached(
      CacheKeys.popularTerms(timeframe),
      async () => {
        const dateFilter = timeframe === 'day' ? subDays(new Date(), 1) :
                          timeframe === 'week' ? subDays(new Date(), 7) :
                          subDays(new Date(), 30);

        const results = await db.select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          recentViews: sql<number>`COUNT(${termViews.id})`
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .leftJoin(termViews, and(
          eq(termViews.termId, terms.id),
          gte(termViews.viewedAt, dateFilter)
        ))
        .groupBy(terms.id, categories.name)
        .orderBy(desc(sql`recent_views`), desc(terms.viewCount))
        .limit(20);

        return results;
      },
      30 * 60 * 1000 // 30 minutes cache
    );
  }

  async getTrendingTerms(limit: number = 10): Promise<any[]> {
    return cached(
      `trending_terms_${limit}`,
      async () => {
        const results = await db.select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          recentViews: sql<number>`COUNT(${termViews.id})`
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .leftJoin(termViews, and(
          eq(termViews.termId, terms.id),
          gte(termViews.viewedAt, subDays(new Date(), 7)) // Last 7 days
        ))
        .groupBy(terms.id, categories.name)
        .orderBy(desc(sql`recent_views`), desc(terms.viewCount))
        .limit(limit);

        return results;
      },
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  async updateTerm(termId: string, updates: any): Promise<any> {
    const [updatedTerm] = await db.update(terms)
      .set({
        ...updates,
        updatedAt: new Date()
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
        const result = await db.select({
          id: terms.id,
          name: terms.name,
          definition: terms.definition,
          shortDefinition: terms.shortDefinition,
          categoryId: terms.categoryId,
          viewCount: terms.viewCount,
          createdAt: terms.createdAt,
          updatedAt: terms.updatedAt
        })
        .from(terms)
        .orderBy(terms.viewCount)
        .limit(limit);
        
        return result;
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async getCategoriesOptimized(): Promise<any[]> {
    return cached(
      CacheKeys.categoryTree(),
      async () => {
        const categoriesWithCount = await db.select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          termCount: sql<number>`count(${terms.id})::int`
        })
        .from(categories)
        .leftJoin(terms, eq(terms.categoryId, categories.id))
        .groupBy(categories.id, categories.name, categories.description)
        .orderBy(categories.name);
        
        return categoriesWithCount;
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async bulkCreateTerms(termsData: any[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    // Process in batches of 10
    for (let i = 0; i < termsData.length; i += 10) {
      const batch = termsData.slice(i, i + 10);
      
      try {
        await db.insert(terms).values(batch);
        success += batch.length;
      } catch (error) {
        console.error('Batch insert failed:', error);
        // Try individual inserts for failed batch
        for (const termData of batch) {
          try {
            await db.insert(terms).values(termData);
            success++;
          } catch (individualError) {
            console.error('Individual insert failed:', individualError);
            failed++;
          }
        }
      }
    }
    
    // Clear cache after bulk insert
    await clearCache();
    
    return { success, failed };
  }

  async getPerformanceMetrics(): Promise<any> {
    return {
      cacheHitRate: getCacheStats().hitRate,
      averageResponseTime: getCacheStats().averageResponseTime || 0,
      totalCachedQueries: getCacheStats().hits + getCacheStats().misses,
      cacheSize: process.memoryUsage().heapUsed,
      lastCacheReset: new Date()
    };
  }

  // Additional methods needed by content.ts
  async getTerms(options: { limit?: number; offset?: number } = {}): Promise<any[]> {
    return this.getTermsOptimized(options);
  }

  async getAllTerms(options: { limit?: number; page?: number } = {}): Promise<{ data: any[]; terms: any[]; total: number }> {
    const { limit = 100, page = 1 } = options;
    const offset = (page - 1) * limit;
    
    const termsList = await cached(
      CacheKeys.term(`all-terms:${limit}:${page}`),
      async () => {
        return await db.select({
          id: terms.id,
          name: terms.name,
          definition: terms.definition,
          shortDefinition: terms.shortDefinition,
          categoryId: terms.categoryId,
          viewCount: terms.viewCount,
          createdAt: terms.createdAt,
          updatedAt: terms.updatedAt
        })
        .from(terms)
        .orderBy(terms.name)
        .limit(limit)
        .offset(offset);
      },
      5 * 60 * 1000 // 5 minutes cache
    );

    const total = await cached(
      CacheKeys.term('total-terms-count'),
      async () => {
        const result = await db.select({ count: sql<number>`count(*)` }).from(terms);
        return result[0].count;
      },
      30 * 60 * 1000 // 30 minutes cache
    );

    return {
      data: termsList,
      terms: termsList,
      total: total
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

  async getAllTermsForSearch(limit: number = 1000): Promise<any[]> {
    return await cached(
      CacheKeys.term(`terms-for-search:${limit}`),
      async () => {
        const result = await db.select({
          id: terms.id,
          name: terms.name,
          definition: terms.definition,
          shortDefinition: terms.shortDefinition,
          categoryId: terms.categoryId
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
        const totalProgress = await db.select({ count: sql<number>`count(*)` })
          .from(userProgress)
          .where(eq(userProgress.userId, userId));

        const completedProgress = await db.select({ count: sql<number>`count(*)` })
          .from(userProgress)
          .where(and(
            eq(userProgress.userId, userId),
            sql`${userProgress.learnedAt} IS NOT NULL`
          ));

        return {
          totalTermsStarted: Number(totalProgress[0]?.count) || 0,
          completedTerms: Number(completedProgress[0]?.count) || 0,
          totalTimeSpent: 0, // Time tracking not implemented yet
          completionRate: totalProgress[0]?.count > 0 
            ? (Number(completedProgress[0]?.count) / Number(totalProgress[0]?.count)) * 100 
            : 0
        };
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  // Revenue tracking methods for admin dashboard
  async getTotalRevenue(): Promise<number> {
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(amount), 0)`
    })
    .from(purchases)
    .where(eq(purchases.status, 'completed'));
    
    return Number(result[0]?.total) || 0;
  }

  async getTotalPurchases(): Promise<number> {
    const result = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(purchases)
    .where(eq(purchases.status, 'completed'));
    
    return Number(result[0]?.count) || 0;
  }

  async getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(amount), 0)`
    })
    .from(purchases)
    .where(and(
      eq(purchases.status, 'completed'),
      gte(purchases.createdAt, startDate),
      lte(purchases.createdAt, endDate)
    ));
    
    return Number(result[0]?.total) || 0;
  }

  async getPurchasesForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(purchases)
    .where(and(
      eq(purchases.status, 'completed'),
      gte(purchases.createdAt, startDate),
      lte(purchases.createdAt, endDate)
    ));
    
    return Number(result[0]?.count) || 0;
  }

  async getTotalUsers(): Promise<number> {
    const result = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(users);
    
    return Number(result[0]?.count) || 0;
  }

  async getRevenueByCurrency(): Promise<Array<{ currency: string; total: number }>> {
    const result = await db.select({
      currency: purchases.currency,
      total: sql<number>`COALESCE(SUM(amount), 0)`
    })
    .from(purchases)
    .where(eq(purchases.status, 'completed'))
    .groupBy(purchases.currency);
    
    return result.map(row => ({
      currency: row.currency || 'USD',
      total: Number(row.total)
    }));
  }

  async getDailyRevenueForPeriod(startDate: Date, endDate: Date): Promise<Array<{ date: string; revenue: number }>> {
    const result = await db.select({
      date: sql<string>`DATE(created_at)`,
      revenue: sql<number>`COALESCE(SUM(amount), 0)`
    })
    .from(purchases)
    .where(and(
      eq(purchases.status, 'completed'),
      gte(purchases.createdAt, startDate),
      lte(purchases.createdAt, endDate)
    ))
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);
    
    return result.map(row => ({
      date: row.date,
      revenue: Number(row.revenue)
    }));
  }

  async getRecentPurchases(limit: number = 10): Promise<any[]> {
    return await db.select({
      id: purchases.id,
      userId: purchases.userId,
      orderId: purchases.gumroadOrderId,
      amount: purchases.amount,
      currency: purchases.currency,
      status: purchases.status,
      createdAt: purchases.createdAt,
      userEmail: users.email
    })
    .from(purchases)
    .leftJoin(users, eq(purchases.userId, users.id))
    .orderBy(desc(purchases.createdAt))
    .limit(limit);
  }

  async getRevenueByPeriod(period: string): Promise<any> {
    // Simplified implementation - can be enhanced
    const now = new Date();
    const periods = {
      day: [],
      week: [],
      month: [],
      year: []
    };
    
    return periods[period as keyof typeof periods] || [];
  }

  async getTopCountriesByRevenue(limit: number = 10): Promise<any[]> {
    // Extract country from purchase data JSON
    const result = await db.select({
      country: sql<string>`(purchase_data->>'country')::text`,
      revenue: sql<number>`COALESCE(SUM(amount), 0)`
    })
    .from(purchases)
    .where(eq(purchases.status, 'completed'))
    .groupBy(sql`(purchase_data->>'country')::text`)
    .orderBy(desc(sql`COALESCE(SUM(amount), 0)`))
    .limit(limit);
    
    return result.map(row => ({
      country: row.country || 'Unknown',
      revenue: Number(row.revenue)
    }));
  }

  async getConversionFunnel(): Promise<any> {
    const totalUsers = await this.getTotalUsers();
    const purchasedUsers = await db.select({
      count: sql<number>`COUNT(DISTINCT user_id)`
    })
    .from(purchases)
    .where(eq(purchases.status, 'completed'));
    
    const purchasedCount = Number(purchasedUsers[0]?.count) || 0;
    
    return {
      visitors: totalUsers * 10, // Estimate
      signups: totalUsers,
      purchased: purchasedCount,
      conversionRate: totalUsers > 0 ? (purchasedCount / totalUsers) * 100 : 0
    };
  }

  async getRefundAnalytics(): Promise<any> {
    const refunds = await db.select({
      count: sql<number>`COUNT(*)`,
      total: sql<number>`COALESCE(SUM(amount), 0)`
    })
    .from(purchases)
    .where(eq(purchases.status, 'refunded'));
    
    return {
      count: Number(refunds[0]?.count) || 0,
      totalAmount: Number(refunds[0]?.total) || 0
    };
  }

  async getPurchasesForExport(startDate?: Date, endDate?: Date): Promise<any[]> {
    const baseQuery = db.select({
      orderId: purchases.gumroadOrderId,
      userEmail: users.email,
      amount: purchases.amount,
      currency: purchases.currency,
      status: purchases.status,
      createdAt: purchases.createdAt,
      purchaseData: purchases.purchaseData
    })
    .from(purchases)
    .leftJoin(users, eq(purchases.userId, users.id));
    
    if (startDate && endDate) {
      return await baseQuery
        .where(and(
          gte(purchases.createdAt, startDate),
          lte(purchases.createdAt, endDate)
        ))
        .orderBy(desc(purchases.createdAt));
    }
    
    return await baseQuery.orderBy(desc(purchases.createdAt));
  }

  async getRecentWebhookActivity(limit: number = 20): Promise<any[]> {
    // For now, return recent purchases as webhook activity
    return await this.getRecentPurchases(limit);
  }

  async getPurchaseByOrderId(orderId: string): Promise<any> {
    const result = await db.select()
      .from(purchases)
      .where(eq(purchases.gumroadOrderId, orderId))
      .limit(1);
    
    return result[0];
  }

  async updateUserAccess(orderId: string, updates: any): Promise<void> {
    const purchase = await this.getPurchaseByOrderId(orderId);
    if (purchase && purchase.userId) {
      await db.update(users)
        .set({
          lifetimeAccess: updates.grantAccess,
          updatedAt: new Date()
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
    const [updatedUser] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async createPurchase(purchaseData: any): Promise<any> {
    const [purchase] = await db.insert(purchases)
      .values(purchaseData)
      .returning();
    return purchase;
  }

  async getUserSettings(userId: string): Promise<any> {
    const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    return result[0]?.preferences || {};
  }

  async updateUserSettings(userId: string, settings: any): Promise<void> {
    await db.insert(userSettings)
      .values({
        userId,
        preferences: settings,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          preferences: settings,
          updatedAt: new Date()
        }
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
      settings
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
    // Simple implementation - can be enhanced
    const recentViews = await db.select({
      viewedAt: termViews.viewedAt
    })
    .from(termViews)
    .where(eq(termViews.userId, userId))
    .orderBy(desc(termViews.viewedAt))
    .limit(30);

    return {
      currentStreak: 0,
      longestStreak: 0,
      recentActivity: recentViews
    };
  }
}

// Export singleton instance
export const optimizedStorage = new OptimizedStorage();

// For backward compatibility, export all methods
export const storage = optimizedStorage;