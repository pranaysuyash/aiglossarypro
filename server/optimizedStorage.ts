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
import { db } from "./db";
import { eq, desc, sql, and, like, ilike, asc, gte, lte, not, isNull, inArray, or } from "drizzle-orm";
import { 
  createInsertSchema, 
  createSelectSchema
} from "drizzle-zod";
import { z } from "zod";
import { formatDistanceToNow, subDays, format, startOfDay, endOfDay } from "date-fns";
import { cached, CacheKeys, CacheInvalidation, queryCache } from './middleware/queryCache';

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
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
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
          parentId: categories.parentId,
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
          parentId: categories.parentId,
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

        const results = await db.select({
          id: terms.id,
          name: terms.name,
          shortDefinition: terms.shortDefinition,
          viewCount: terms.viewCount,
          category: categories.name,
          categoryId: categories.id,
          subcategories: sql<string[]>`ARRAY_AGG(DISTINCT ${subcategories.name}) FILTER (WHERE ${subcategories.name} IS NOT NULL)`,
          // Add relevance scoring
          relevance: sql<number>`
            CASE 
              WHEN ${terms.name} ILIKE ${`${query}%`} THEN 1.0
              WHEN ${terms.name} ILIKE ${`%${query}%`} THEN 0.8
              ELSE 0.5
            END
          `
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .leftJoin(termSubcategories, eq(terms.id, termSubcategories.termId))
        .leftJoin(subcategories, eq(termSubcategories.subcategoryId, subcategories.id))
        .where(searchCondition)
        .groupBy(terms.id, categories.id, categories.name)
        .orderBy(desc(sql`relevance`), desc(terms.viewCount))
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
}

// Export singleton instance
export const optimizedStorage = new OptimizedStorage();

// For backward compatibility, export all methods
export const storage = optimizedStorage;