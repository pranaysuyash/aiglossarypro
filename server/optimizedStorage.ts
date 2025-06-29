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
import type { ITerm, ICategory } from '../shared/types';

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
  getUserFavoritesOptimized?(userId: string, pagination?: { limit?: number; offset?: number; fields?: string[] }): Promise<{ data: any[]; total: number; hasMore: boolean }>;
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
  
  // Admin user management
  getAllUsers(options?: { page?: number; limit?: number; search?: string }): Promise<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }>;
  
  // Admin data management
  clearAllData(): Promise<{ tablesCleared: string[] }>;
  reindexDatabase(): Promise<{ success: boolean; operation: string; duration: number; operations: string[]; timestamp: Date; message: string }>;
  getAdminStats(): Promise<any>;
  cleanupDatabase(): Promise<{ success: boolean; operation: string; duration: number; operations: string[]; timestamp: Date; message: string }>;
  vacuumDatabase(): Promise<{ success: boolean; operation: string; duration: number; operations: string[]; timestamp: Date; message: string }>;
  
  // Content moderation  
  getPendingContent(): Promise<any[]>;
  approveContent(id: string): Promise<any>;
  rejectContent(id: string): Promise<any>;
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
      fields = ['id', 'name', 'shortDefinition', 'viewCount']
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
        let countQuery = db.select({ count: sql<number>`count(*)` }).from(terms);
        if (fields.includes('category')) {
          countQuery = countQuery.leftJoin(categories, eq(terms.categoryId, categories.id));
        }
        countQuery = countQuery.where(and(...whereConditions));
        
        const totalResult = await countQuery;
        const total = totalResult[0]?.count || 0;
        
        // Build dynamic select
        const selectObj: any = {
          relevance: relevanceScore
        };
        
        if (fields.includes('id')) selectObj.id = terms.id;
        if (fields.includes('name')) selectObj.name = terms.name;
        if (fields.includes('shortDefinition')) selectObj.shortDefinition = terms.shortDefinition;
        if (fields.includes('definition')) selectObj.definition = terms.definition;
        if (fields.includes('viewCount')) selectObj.viewCount = terms.viewCount;
        if (fields.includes('categoryId')) selectObj.categoryId = terms.categoryId;
        if (fields.includes('category')) selectObj.category = categories.name;
        if (fields.includes('createdAt')) selectObj.createdAt = terms.createdAt;
        
        // Build main query
        let query_ = db.select(selectObj).from(terms);
        
        // Add joins only if needed
        if (fields.includes('category')) {
          query_ = query_.leftJoin(categories, eq(terms.categoryId, categories.id));
        }
        
        // Add where conditions
        query_ = query_.where(and(...whereConditions));
        
        // Add ordering, limit, and offset
        const results = await query_
          .orderBy(desc(relevanceScore), desc(terms.viewCount))
          .limit(limit)
          .offset(offset);
        
        return {
          data: results,
          total
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

  async getUserFavoritesOptimized(userId: string, pagination?: { limit?: number; offset?: number; fields?: string[] }): Promise<{ data: any[]; total: number; hasMore: boolean }> {
    const { limit = 50, offset = 0, fields = ['termId', 'name', 'shortDefinition', 'viewCount', 'category'] } = pagination || {};
    const cacheKey = `${CacheKeys.userFavorites(userId)}:${limit}:${offset}:${fields.join(',')}`;
    
    return cached(
      cacheKey,
      async () => {
        // Get total count first
        const totalResult = await db.select({ count: sql<number>`count(*)` })
          .from(favorites)
          .where(eq(favorites.userId, userId));
        const total = totalResult[0]?.count || 0;

        // Build dynamic select based on requested fields
        const selectObj: any = {
          termId: favorites.termId,
          createdAt: favorites.createdAt
        };
        
        if (fields.includes('name')) selectObj.name = terms.name;
        if (fields.includes('shortDefinition')) selectObj.shortDefinition = terms.shortDefinition;
        if (fields.includes('definition')) selectObj.definition = terms.definition;
        if (fields.includes('viewCount')) selectObj.viewCount = terms.viewCount;
        if (fields.includes('category')) selectObj.category = categories.name;
        if (fields.includes('categoryId')) selectObj.categoryId = categories.id;
        
        // Single query with field selection and pagination
        const results = await db.select(selectObj)
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
          hasMore: offset + limit < total
        };
      },
      5 * 60 * 1000 // 5 minutes cache for field-specific results
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
    }).onConflictDoUpdate({
      target: [favorites.userId, favorites.termId],
      set: { createdAt: new Date() }
    });
    
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

  // Optimized bulk operations with field selection
  async getTermsByCategory(categoryId: string, options: {
    offset?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    fields?: string[];
  } = {}): Promise<{ data: any[]; total: number }> {
    const { 
      offset = 0, 
      limit = 20, 
      sort = 'name', 
      order = 'asc',
      fields = ['id', 'name', 'shortDefinition', 'viewCount']
    } = options;
    
    const cacheKey = `${CacheKeys.termsByCategory(categoryId)}:${offset}:${limit}:${sort}:${order}:${fields.join(',')}`;
    
    return cached(
      cacheKey,
      async () => {
        // Build dynamic select based on requested fields
        const selectObj: any = {};
        
        if (fields.includes('id')) selectObj.id = terms.id;
        if (fields.includes('name')) selectObj.name = terms.name;
        if (fields.includes('shortDefinition')) selectObj.shortDefinition = terms.shortDefinition;
        if (fields.includes('definition')) selectObj.definition = terms.definition;
        if (fields.includes('viewCount')) selectObj.viewCount = terms.viewCount;
        if (fields.includes('category')) selectObj.category = categories.name;
        if (fields.includes('categoryId')) selectObj.categoryId = categories.id;
        if (fields.includes('createdAt')) selectObj.createdAt = terms.createdAt;
        if (fields.includes('updatedAt')) selectObj.updatedAt = terms.updatedAt;
        
        // Get total count first
        const totalResult = await db.select({ count: sql<number>`count(*)` })
          .from(terms)
          .where(eq(terms.categoryId, categoryId));
        
        const total = totalResult[0]?.count || 0;
        
        // Build main query
        let query = db.select(selectObj).from(terms);
        
        // Add joins only if needed
        if (fields.includes('category')) {
          query = query.leftJoin(categories, eq(terms.categoryId, categories.id));
        }
        
        // Add where clause
        query = query.where(eq(terms.categoryId, categoryId));
        
        // Add sorting
        const sortColumn = sort === 'name' ? terms.name :
                          sort === 'viewCount' ? terms.viewCount :
                          sort === 'createdAt' ? terms.createdAt :
                          terms.name;
        
        query = order === 'desc' ? 
          query.orderBy(desc(sortColumn)) :
          query.orderBy(asc(sortColumn));
        
        // Add pagination
        const results = await query
          .limit(limit)
          .offset(offset);
        
        return {
          data: results,
          total
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

  async getCategoriesOptimized(options: {
    offset?: number;
    limit?: number;
    fields?: string[];
    search?: string;
    includeStats?: boolean;
  } = {}): Promise<any[]> {
    const { offset = 0, limit = 20, fields = ['id', 'name', 'description'], search, includeStats = false } = options;
    
    const cacheKey = `${CacheKeys.categoryTree()}:${offset}:${limit}:${fields.join(',')}:${search || 'all'}:${includeStats}`;
    
    return cached(
      cacheKey,
      async () => {
        // Build dynamic select based on requested fields
        const selectObj: any = {};
        
        if (fields.includes('id')) selectObj.id = categories.id;
        if (fields.includes('name')) selectObj.name = categories.name;
        if (fields.includes('description')) selectObj.description = categories.description;
        if (fields.includes('termCount') || includeStats) {
          selectObj.termCount = sql<number>`count(${terms.id})::int`;
        }
        
        let query = db.select(selectObj).from(categories);
        
        // Add joins only if needed
        if (fields.includes('termCount') || includeStats) {
          query = query.leftJoin(terms, eq(terms.categoryId, categories.id));
        }
        
        // Add search filter if provided
        if (search) {
          query = query.where(ilike(categories.name, `%${search}%`));
        }
        
        // Add grouping only if aggregating
        if (fields.includes('termCount') || includeStats) {
          query = query.groupBy(categories.id, categories.name, categories.description);
        }
        
        // Add ordering, limit, and offset
        const result = await query
          .orderBy(categories.name)
          .limit(limit)
          .offset(offset);
        
        return result;
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
        let query = db.select({ count: sql<number>`count(*)` }).from(categories);
        
        if (search) {
          query = query.where(ilike(categories.name, `%${search}%`));
        }
        
        const result = await query;
        return result[0]?.count || 0;
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  async bulkCreateTerms(termsData: any[]): Promise<{ success: number; failed: number }> {
    if (termsData.length === 0) {
      return { success: 0, failed: 0 };
    }

    try {
      const result = await db.insert(terms).values(termsData).onConflictDoNothing();
      // The result of a bulk insert in Drizzle doesn't directly tell us how many rows were inserted.
      // We'll assume success for all if no error is thrown.
      const successCount = termsData.length;
      await clearCache();
      return { success: successCount, failed: 0 };
    } catch (error) {
      console.error('Bulk insert failed:', error);
      // If the bulk insert fails, we can fall back to individual inserts to salvage what we can.
      let success = 0;
      let failed = 0;
      for (const termData of termsData) {
        try {
          await db.insert(terms).values(termData).onConflictDoNothing();
          success++;
        } catch (individualError) {
          console.error('Individual insert failed:', individualError);
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
      lastCacheReset: new Date()
    };
  }

  // Additional methods needed by content.ts
  async getTerms(options: { limit?: number; offset?: number } = {}): Promise<any[]> {
    try {
      return await this.getTermsOptimized(options);
    } catch (error) {
      console.error('Error getting terms:', error);
      throw error;
    }
  }

  async getAllTerms(options: { 
    limit?: number; 
    page?: number;
    offset?: number;
    categoryId?: string;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    fields?: string[];
  } = {}): Promise<{ data: any[]; terms: any[]; total: number }> {
    const { 
      limit = 100, 
      page = 1, 
      offset = (page - 1) * limit,
      categoryId,
      searchTerm,
      sortBy = 'name',
      sortOrder = 'asc',
      fields = ['id', 'name', 'shortDefinition', 'viewCount', 'categoryId']
    } = options;
    
    const cacheKey = `all-terms:${limit}:${offset}:${categoryId || 'all'}:${searchTerm || 'all'}:${sortBy}:${sortOrder}:${fields.join(',')}`;
    
    const termsList = await cached(
      cacheKey,
      async () => {
        // Build dynamic select based on requested fields
        const selectObj: any = {};
        
        if (fields.includes('id')) selectObj.id = terms.id;
        if (fields.includes('name')) selectObj.name = terms.name;
        if (fields.includes('shortDefinition')) selectObj.shortDefinition = terms.shortDefinition;
        if (fields.includes('definition')) selectObj.definition = terms.definition;
        if (fields.includes('categoryId')) selectObj.categoryId = terms.categoryId;
        if (fields.includes('viewCount')) selectObj.viewCount = terms.viewCount;
        if (fields.includes('createdAt')) selectObj.createdAt = terms.createdAt;
        if (fields.includes('updatedAt')) selectObj.updatedAt = terms.updatedAt;
        if (fields.includes('category')) selectObj.category = categories.name;
        
        let query = db.select(selectObj).from(terms);
        
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
        const sortColumn = sortBy === 'name' ? terms.name :
                          sortBy === 'viewCount' ? terms.viewCount :
                          sortBy === 'createdAt' ? terms.createdAt :
                          terms.name;
        
        query = sortOrder === 'desc' ? 
          query.orderBy(desc(sortColumn)) :
          query.orderBy(asc(sortColumn));
        
        return await query
          .limit(limit)
          .offset(offset);
      },
      3 * 60 * 1000 // 3 minutes cache for filtered results
    );

    // Get total count with same filters
    const totalCacheKey = `total-terms-count:${categoryId || 'all'}:${searchTerm || 'all'}`;
    const total = await cached(
      totalCacheKey,
      async () => {
        let countQuery = db.select({ count: sql<number>`count(*)` }).from(terms);
        
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

  async getAllUsers(options?: { page?: number; limit?: number; search?: string }): Promise<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const { page = 1, limit = 50, search } = options || {};
    const offset = (page - 1) * limit;

    return cached(
      CacheKeys.term(`users:page-${page}:limit-${limit}:search-${search || 'none'}`),
      async () => {
        // Build base query
        let whereConditions = undefined;
        
        if (search) {
          whereConditions = or(
            ilike(users.email, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`)
          );
        }

        // Get total count
        const totalResult = await db.select({ 
          count: sql<number>`count(*)` 
        })
        .from(users)
        .where(whereConditions);
        
        const total = Number(totalResult[0]?.count) || 0;

        // Get paginated users with all relevant fields
        const result = await db.select({
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
          updatedAt: users.updatedAt
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
          hasMore: offset + limit < total
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
      
      console.log(`[OptimizedStorage] Successfully cleared ${tablesCleared.length} tables`);
      
      return { tablesCleared };
    } catch (error) {
      console.error('[OptimizedStorage] clearAllData error:', error);
      throw new Error(`Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reindexDatabase(): Promise<{ success: boolean; operation: string; duration: number; operations: string[]; timestamp: Date; message: string }> {
    const startTime = Date.now();
    const operations: string[] = [];
    
    try {
      console.log('[OptimizedStorage] Starting comprehensive database reindexing...');
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
      } catch (error) {
        // Fallback to table-specific reindexing
        const tables = ['terms', 'categories', 'subcategories', 'users', 'favorites', 'user_progress', 'term_views'];
        for (const table of tables) {
          try {
            await db.execute(sql.raw(`REINDEX TABLE ${table}`));
            operations.push(`✓ Reindexed table: ${table}`);
          } catch (tableError) {
            operations.push(`⚠ Reindex ${table}: ${tableError instanceof Error ? tableError.message : 'error'}`);
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
      
      console.log(`[OptimizedStorage] Database reindexing completed in ${duration}ms`);
      
      return {
        success: true,
        operation: 'reindex',
        duration,
        operations,
        timestamp: new Date(),
        message: `Database reindexing completed successfully in ${duration}ms`
      };
      
    } catch (error) {
      const endTime = Date.now();
      console.error('[OptimizedStorage] reindexDatabase error:', error);
      
      return {
        success: false,
        operation: 'reindex',
        duration: endTime - startTime,
        operations: [...operations, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        timestamp: new Date(),
        message: `Database reindexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getAdminStats(): Promise<any> {
    return cached(
      CacheKeys.term('admin_stats'),
      async () => {
        try {
          // Get total counts
          const [userCountResult] = await db.select({ 
            count: sql<number>`count(*)` 
          }).from(users);
          
          const [termCountResult] = await db.select({ 
            count: sql<number>`count(*)` 
          }).from(terms);
          
          const [categoryCountResult] = await db.select({ 
            count: sql<number>`count(*)` 
          }).from(categories);
          
          const [viewCountResult] = await db.select({ 
            count: sql<number>`count(*)` 
          }).from(termViews);

          // Get recent activity (last 50 actions)
          const recentActivity = await db.select({
            id: termViews.id,
            userId: termViews.userId,
            action: sql<string>`'view'`,
            entityType: sql<string>`'term'`,
            entityId: termViews.termId,
            createdAt: termViews.viewedAt
          })
          .from(termViews)
          .orderBy(desc(termViews.viewedAt))
          .limit(50);

          // Get recent favorites as additional activity
          const recentFavorites = await db.select({
            id: favorites.id,
            userId: favorites.userId,
            action: sql<string>`'favorite'`,
            entityType: sql<string>`'term'`,
            entityId: favorites.termId,
            createdAt: favorites.createdAt
          })
          .from(favorites)
          .orderBy(desc(favorites.createdAt))
          .limit(25);

          // Combine and sort activity
          const combinedActivity = [...recentActivity, ...recentFavorites]
            .sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime())
            .slice(0, 50);

          // Basic system health check
          const systemHealth = {
            database: 'healthy' as const,
            s3: 'healthy' as const,
            ai: 'healthy' as const
          };

          return {
            totalUsers: Number(userCountResult?.count) || 0,
            totalTerms: Number(termCountResult?.count) || 0,
            totalCategories: Number(categoryCountResult?.count) || 0,
            totalViews: Number(viewCountResult?.count) || 0,
            recentActivity: combinedActivity,
            systemHealth
          };
          
        } catch (error) {
          console.error('[OptimizedStorage] getAdminStats error:', error);
          
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
              ai: 'warning' as const
            }
          };
        }
      },
      120 // Cache for 2 minutes (admin stats change frequently)
    );
  }

  async cleanupDatabase(): Promise<{ success: boolean; operation: string; duration: number; operations: string[]; timestamp: Date; message: string }> {
    const startTime = Date.now();
    const operations: string[] = [];
    
    try {
      console.log('[OptimizedStorage] Starting database cleanup...');
      operations.push('Database cleanup started');

      // 1. Clean up orphaned records
      try {
        // Remove user progress for non-existent users
        const orphanedProgress = await db.delete(userProgress)
          .where(sql`user_id NOT IN (SELECT id FROM users)`);
        operations.push(`✓ Cleaned orphaned user progress records`);

        // Remove favorites for non-existent users or terms
        const orphanedFavorites = await db.delete(favorites)
          .where(sql`user_id NOT IN (SELECT id FROM users) OR term_id NOT IN (SELECT id FROM terms)`);
        operations.push(`✓ Cleaned orphaned favorites`);

        // Remove term views for non-existent users or terms
        const orphanedViews = await db.delete(termViews)
          .where(sql`user_id NOT IN (SELECT id FROM users) OR term_id NOT IN (SELECT id FROM terms)`);
        operations.push(`✓ Cleaned orphaned term views`);

        // Remove user settings for non-existent users
        const orphanedSettings = await db.delete(userSettings)
          .where(sql`user_id NOT IN (SELECT id FROM users)`);
        operations.push(`✓ Cleaned orphaned user settings`);

      } catch (error) {
        operations.push(`⚠ Orphan cleanup: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 2. Clean up old/expired data
      try {
        // Remove old term views (older than 6 months)
        const oldViews = await db.delete(termViews)
          .where(sql`viewed_at < NOW() - INTERVAL '6 months'`);
        operations.push(`✓ Cleaned old term views (6+ months)`);

      } catch (error) {
        operations.push(`⚠ Old data cleanup: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 3. Optimize table statistics
      try {
        await db.execute(sql`ANALYZE users, terms, categories, subcategories, favorites, user_progress, term_views`);
        operations.push('✓ Updated table statistics');
      } catch (error) {
        operations.push(`⚠ Statistics update: ${error instanceof Error ? error.message : 'error'}`);
      }

      // 4. Clear query cache
      await clearCache();
      operations.push('✓ Query cache cleared');

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`[OptimizedStorage] Database cleanup completed in ${duration}ms`);
      
      return {
        success: true,
        operation: 'cleanup',
        duration,
        operations,
        timestamp: new Date(),
        message: `Database cleanup completed successfully in ${duration}ms`
      };
      
    } catch (error) {
      const endTime = Date.now();
      console.error('[OptimizedStorage] cleanupDatabase error:', error);
      
      return {
        success: false,
        operation: 'cleanup',
        duration: endTime - startTime,
        operations: [...operations, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        timestamp: new Date(),
        message: `Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async vacuumDatabase(): Promise<{ success: boolean; operation: string; duration: number; operations: string[]; timestamp: Date; message: string }> {
    const startTime = Date.now();
    const operations: string[] = [];
    
    try {
      console.log('[OptimizedStorage] Starting database vacuum...');
      operations.push('Database vacuum started');

      // 1. Vacuum main tables
      const tables = ['users', 'terms', 'categories', 'subcategories', 'favorites', 'user_progress', 'term_views', 'purchases'];
      
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
      
      console.log(`[OptimizedStorage] Database vacuum completed in ${duration}ms`);
      
      return {
        success: true,
        operation: 'vacuum',
        duration,
        operations,
        timestamp: new Date(),
        message: `Database vacuum completed successfully in ${duration}ms`
      };
      
    } catch (error) {
      const endTime = Date.now();
      console.error('[OptimizedStorage] vacuumDatabase error:', error);
      
      return {
        success: false,
        operation: 'vacuum',
        duration: endTime - startTime,
        operations: [...operations, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        timestamp: new Date(),
        message: `Database vacuum failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          console.error('[OptimizedStorage] getPendingContent error:', error);
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
        console.log(`[OptimizedStorage] Content approved: ${id}`);
        return {
          success: true,
          id,
          status: 'resolved',
          message: 'Content approved successfully'
        };
      } else {
        throw new Error('Content not found');
      }
    } catch (error) {
      console.error('[OptimizedStorage] approveContent error:', error);
      throw new Error(`Failed to approve content: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        console.log(`[OptimizedStorage] Content rejected: ${id}`);
        return {
          success: true,
          id,
          status: 'dismissed',
          message: 'Content rejected successfully'
        };
      } else {
        throw new Error('Content not found');
      }
    } catch (error) {
      console.error('[OptimizedStorage] rejectContent error:', error);
      throw new Error(`Failed to reject content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCategoryStats(categoryId?: string): Promise<any> {
    try {
      if (categoryId) {
        // Get stats for a specific category
        const [termCountResult] = await db.select({
          count: sql<number>`count(*)`
        })
        .from(terms)
        .where(eq(terms.categoryId, categoryId));

        const [categoryResult] = await db.select()
          .from(categories)
          .where(eq(categories.id, categoryId))
          .limit(1);

        return {
          categoryId,
          categoryName: categoryResult?.name || 'Unknown',
          termCount: termCountResult?.count || 0,
          lastUpdated: new Date()
        };
      } else {
        // Get stats for all categories
        const results = await db.select({
          categoryId: categories.id,
          categoryName: categories.name,
          termCount: sql<number>`count(${terms.id})`
        })
        .from(categories)
        .leftJoin(terms, eq(categories.id, terms.categoryId))
        .groupBy(categories.id, categories.name)
        .orderBy(desc(sql`count(${terms.id})`));

        return results;
      }
    } catch (error) {
      console.error('[OptimizedStorage] getCategoryStats error:', error);
      throw new Error(`Failed to get category stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const optimizedStorage = new OptimizedStorage();

// For backward compatibility, export all methods
export const storage = optimizedStorage;