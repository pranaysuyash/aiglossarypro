import { and, desc, eq, gt, inArray, like, lt, or, sql } from 'drizzle-orm';
import { Redis } from 'ioredis';
import { categories, codeExamples, terms, userProgress } from '../shared/schema.js';
import { db } from './db';

import NodeCache = require('node-cache');

// Initialize caches
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});

const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // For better performance
});

// Cache keys
const CACHE_KEYS = {
  TERMS_LIST: 'terms:list',
  TERM_DETAIL: 'term:detail',
  CATEGORIES: 'categories:all',
  TRENDING: 'terms:trending',
  USER_PROGRESS: 'user:progress',
  SEARCH_RESULTS: 'search:results',
};

// Cache TTLs (in seconds)
const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// Optimized query helpers
export class OptimizedQueries {
  // Get paginated terms with caching
  static async getTermsPaginated(page = 1, limit = 20, categoryId?: string) {
    const cacheKey = `${CACHE_KEYS.TERMS_LIST}:${page}:${limit}:${categoryId || 'all'}`;

    // Try cache first
    const cached = await OptimizedQueries.getCached(cacheKey);
    if (cached) {return cached;}

    // Build query
    const offset = (page - 1) * limit;
    const conditions = categoryId ? [eq(terms.categoryId, categoryId)] : [];

    const [items, totalCount] = await Promise.all([
      db
        .select({
          id: terms.id,
          term: terms.name,
          definition: terms.definition,
          categoryId: terms.categoryId,
          categoryName: categories.name,
          views: terms.viewCount,
          createdAt: terms.createdAt,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(desc(terms.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ count: sql<number>`count(*)` })
        .from(terms)
        .where(and(...conditions))
        .then(result => result[0]?.count || 0),
    ]);

    const result = {
      items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache result
    await OptimizedQueries.setCached(cacheKey, result, CACHE_TTL.MEDIUM);

    return result;
  }

  // Get term details with related data
  static async getTermDetail(termId: string, userId?: string) {
    const cacheKey = `${CACHE_KEYS.TERM_DETAIL}:${termId}:${userId || 'guest'}`;

    // Try cache first
    const cached = await OptimizedQueries.getCached(cacheKey);
    if (cached) {return cached;}

    // Fetch term with all related data in parallel
    const [termData, sections, examples, relatedTerms, userProgressData] = await Promise.all([
      // Main term data
      db
        .select({
          id: terms.id,
          term: terms.name,
          definition: terms.definition,
          categoryId: terms.categoryId,
          categoryName: categories.name,
          views: terms.viewCount,
          createdAt: terms.createdAt,
          updatedAt: terms.updatedAt,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(eq(terms.id, termId))
        .limit(1)
        .then(results => results[0]),

      // Term sections - placeholder for future implementation
      Promise.resolve([]),

      // Code examples
      db
        .select()
        .from(codeExamples)
        .where(eq(codeExamples.term_id, termId))
        .orderBy(desc(codeExamples.upvotes)),

      // Related terms (same category)
      db
        .select({
          id: terms.id,
          term: terms.name,
          definition: terms.definition,
        })
        .from(terms)
        .where(
          and(
            eq(terms.categoryId, sql`(SELECT category_id FROM terms WHERE id = ${termId})`),
            sql`${terms.id} != ${termId}`
          )
        )
        .limit(5),

      // User progress (if authenticated)
      userId
        ? db
            .select()
            .from(userProgress)
            .where(and(eq(userProgress.userId, userId), eq(userProgress.termId, termId)))
            .limit(1)
            .then(results => results[0])
        : null,
    ]);

    if (!termData) {
      return null;
    }

    // Increment views asynchronously
    OptimizedQueries.incrementTermViews(termId);

    const result = {
      ...termData,
      sections,
      codeExamples: examples,
      relatedTerms,
      userProgress: userProgressData,
    };

    // Cache result
    await OptimizedQueries.setCached(cacheKey, result, CACHE_TTL.SHORT);

    return result;
  }

  // Optimized search with caching
  static async searchTerms(
    query: string,
    options: {
      limit?: number;
      categoryId?: string;
      includeDefinitions?: boolean;
    } = {}
  ) {
    const { limit = 20, categoryId, includeDefinitions = true } = options;
    const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}:${query}:${categoryId || 'all'}:${limit}`;

    // Try cache first
    const cached = await OptimizedQueries.getCached(cacheKey);
    if (cached) {return cached;}

    // Build search conditions
    const searchPattern = `%${query}%`;
    const conditions = [
      or(
        like(terms.name, searchPattern),
        includeDefinitions ? like(terms.definition, searchPattern) : undefined
      )!,
    ];

    if (categoryId) {
      conditions.push(eq(terms.categoryId, categoryId));
    }

    // Execute search
    const results = await db
      .select({
        id: terms.id,
        term: terms.name,
        definition: terms.definition,
        categoryId: terms.categoryId,
        categoryName: categories.name,
        relevance: sql<number>`
          CASE 
            WHEN LOWER(${terms.name}) = LOWER(${query}) THEN 100
            WHEN LOWER(${terms.name}) LIKE LOWER(${`${query  }%`}) THEN 80
            WHEN LOWER(${terms.name}) LIKE LOWER(${`%${  query  }%`}) THEN 60
            WHEN LOWER(${terms.definition}) LIKE LOWER(${`%${  query  }%`}) THEN 40
            ELSE 20
          END
        `,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(sql`relevance`), desc(terms.viewCount))
      .limit(limit);

    // Cache result
    await OptimizedQueries.setCached(cacheKey, results, CACHE_TTL.SHORT);

    return results;
  }

  // Get trending terms with caching
  static async getTrendingTerms(limit = 10) {
    const cacheKey = `${CACHE_KEYS.TRENDING}:${limit}`;

    // Try cache first
    const cached = await OptimizedQueries.getCached(cacheKey);
    if (cached) {return cached;}

    // Calculate trending score based on views and recency
    const results = await db
      .select({
        id: terms.id,
        term: terms.name,
        definition: terms.definition,
        categoryId: terms.categoryId,
        categoryName: categories.name,
        views: terms.viewCount,
        trendingScore: sql<number>`
          ${terms.viewCount} * 
          POWER(0.5, EXTRACT(EPOCH FROM (NOW() - ${terms.updatedAt})) / 86400)
        `,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .orderBy(desc(sql`trending_score`))
      .limit(limit);

    // Cache result
    await OptimizedQueries.setCached(cacheKey, results, CACHE_TTL.MEDIUM);

    return results;
  }

  // Batch fetch terms by IDs
  static async getTermsByIds(termIds: string[]) {
    if (termIds.length === 0) {return [];}

    // Check cache for each term
    const cached: any[] = [];
    const uncachedIds: string[] = [];

    for (const id of termIds) {
      const cacheKey = `${CACHE_KEYS.TERM_DETAIL}:${id}:basic`;
      const cachedTerm = await OptimizedQueries.getCached(cacheKey);

      if (cachedTerm) {
        cached.push(cachedTerm);
      } else {
        uncachedIds.push(id);
      }
    }

    // Fetch uncached terms
    if (uncachedIds.length > 0) {
      const results = await db
        .select({
          id: terms.id,
          term: terms.name,
          definition: terms.definition,
          categoryId: terms.categoryId,
          categoryName: categories.name,
        })
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .where(inArray(terms.id, uncachedIds));

      // Cache individual terms
      for (const term of results) {
        const cacheKey = `${CACHE_KEYS.TERM_DETAIL}:${term.id}:basic`;
        await OptimizedQueries.setCached(cacheKey, term, CACHE_TTL.LONG);
      }

      cached.push(...results);
    }

    // Return in original order
    return termIds.map(id => cached.find(term => term.id === id)).filter(Boolean);
  }

  // Helper methods for caching
  private static async getCached(key: string): Promise<any> {
    // Try memory cache first
    const memCached = memoryCache.get(key);
    if (memCached) {return memCached;}

    // Try Redis
    try {
      const redisCached = await redis.get(key);
      if (redisCached) {
        const parsed = JSON.parse(redisCached);
        // Store in memory cache for faster access
        memoryCache.set(key, parsed, 60); // 1 minute in memory
        return parsed;
      }
    } catch (error) {
      console.error('Redis get error:', error);
    }

    return null;
  }

  private static async setCached(key: string, value: any, ttl: number): Promise<void> {
    // Store in memory cache
    memoryCache.set(key, value, Math.min(ttl, 300)); // Max 5 minutes in memory

    // Store in Redis
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  // Increment term views (fire and forget)
  private static async incrementTermViews(termId: string): Promise<void> {
    try {
      await db
        .update(terms)
        .set({
          viewCount: sql`${terms.viewCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(terms.id, termId));

      // Invalidate related caches
      const pattern = `${CACHE_KEYS.TERM_DETAIL}:${termId}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Error incrementing term views:', error);
    }
  }

  // Clear cache by pattern
  static async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      // Clear from memory cache
      const memKeys = memoryCache.keys();
      memKeys.forEach(key => {
        if (key.includes(pattern)) {
          memoryCache.del(key);
        }
      });

      // Clear from Redis
      try {
        const redisKeys = await redis.keys(`*${pattern}*`);
        if (redisKeys.length > 0) {
          await redis.del(...redisKeys);
        }
      } catch (error) {
        console.error('Error clearing Redis cache:', error);
      }
    } else {
      // Clear all caches
      memoryCache.flushAll();
      try {
        await redis.flushdb();
      } catch (error) {
        console.error('Error flushing Redis:', error);
      }
    }
  }
}

// Export cache warming function
export async function warmCache() {
  console.log('Warming cache...');

  try {
    // Warm trending terms
    await OptimizedQueries.getTrendingTerms();

    // Warm first page of terms
    await OptimizedQueries.getTermsPaginated(1, 20);

    // Warm categories
    const categoriesData = await db.select().from(categories).limit(50);
    const allCategories = await db.select().from(categories).limit(50);
    memoryCache.set(CACHE_KEYS.CATEGORIES, allCategories, CACHE_TTL.VERY_LONG);
    try {
      await redis.setex(CACHE_KEYS.CATEGORIES, CACHE_TTL.VERY_LONG, JSON.stringify(allCategories));
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    console.log('Cache warming complete');
  } catch (error) {
    console.error('Error warming cache:', error);
  }
}
