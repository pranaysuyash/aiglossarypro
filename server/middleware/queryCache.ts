/**
 * Query Cache Middleware
 *
 * Implements intelligent caching for database queries to reduce load
 * and improve response times. Uses LRU cache with TTL support.
 */

import { metricsCollector } from '../cache/CacheMetrics';
import { TIME_CONSTANTS } from '../utils/constants';

interface QueryCacheOptions {
  maxItems?: number;
  defaultTtlMs?: number;
  enabled?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxItems: number;
  private readonly defaultTtlMs: number;
  private readonly enabled: boolean;
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;
  private readonly cacheType: string;

  constructor(options: QueryCacheOptions & { cacheType?: string } = {}) {
    this.maxItems = options.maxItems || 1000;
    this.defaultTtlMs = options.defaultTtlMs || (5 * TIME_CONSTANTS.MILLISECONDS_IN_HOUR) / 12; // 5 minutes
    this.enabled = options.enabled !== false;
    this.cacheType = options.cacheType || 'query';
  }

  get<T>(key: string): T | undefined {
    if (!this.enabled) return undefined;

    const startTime = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      const duration = Date.now() - startTime;
      metricsCollector.recordOperation({
        type: 'miss',
        key,
        duration,
        timestamp: new Date(),
      });
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      const duration = Date.now() - startTime;
      metricsCollector.recordOperation({
        type: 'miss',
        key,
        duration,
        timestamp: new Date(),
      });
      return undefined;
    }

    // Update hit count
    entry.hits++;
    this.hitCount++;

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    const duration = Date.now() - startTime;
    metricsCollector.recordOperation({
      type: 'hit',
      key,
      duration,
      timestamp: new Date(),
    });

    return entry.data;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    if (!this.enabled) return;

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        this.evictionCount++;
        metricsCollector.recordOperation({
          type: 'eviction',
          key: firstKey,
          timestamp: new Date(),
        });
      }
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlMs || this.defaultTtlMs,
      hits: 0,
    };

    this.cache.set(key, entry);

    // Calculate approximate size
    const size = JSON.stringify(value).length;
    metricsCollector.recordOperation({
      type: 'set',
      key,
      size,
      timestamp: new Date(),
    });
  }

  invalidate(pattern: string): number {
    if (!this.enabled) return 0;

    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (this.matchesPattern(key, pattern)) {
        this.cache.delete(key);
        deletedCount++;
        metricsCollector.recordOperation({
          type: 'invalidation',
          key,
          timestamp: new Date(),
        });
      }
    }
    return deletedCount;
  }

  invalidateAll(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const stats = {
      size: this.cache.size,
      maxItems: this.maxItems,
      hitCount: this.hitCount,
      missCount: this.missCount,
      evictionCount: this.evictionCount,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      enabled: this.enabled,
      cacheType: this.cacheType,
    };

    // Update metrics collector with current cache size
    const snapshot = metricsCollector.generateSnapshot();
    snapshot.cacheSize = this.cache.size;
    snapshot.maxCacheSize = this.maxItems;

    return stats;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching - supports wildcards
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(key);
    }
    return key.includes(pattern);
  }

  // Cleanup expired entries
  cleanup(): number {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// Global cache instances for different types of data
export const queryCache = new QueryCache({
  maxItems: 2000,
  defaultTtlMs: (10 * TIME_CONSTANTS.MILLISECONDS_IN_HOUR) / 6, // 10 minutes
  enabled: process.env.NODE_ENV !== 'test',
  cacheType: 'query',
});

export const searchCache = new QueryCache({
  maxItems: 500,
  defaultTtlMs: (5 * TIME_CONSTANTS.MILLISECONDS_IN_HOUR) / 12, // 5 minutes
  enabled: process.env.NODE_ENV !== 'test',
  cacheType: 'search',
});

export const userCache = new QueryCache({
  maxItems: 1000,
  defaultTtlMs: (15 * TIME_CONSTANTS.MILLISECONDS_IN_HOUR) / 4, // 15 minutes
  enabled: process.env.NODE_ENV !== 'test',
  cacheType: 'user',
});

// Cache wrapper function
export async function cached<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs?: number,
  cacheInstance: QueryCache = queryCache
): Promise<T> {
  // Try to get from cache first
  const cached = cacheInstance.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  // Execute query and cache result
  try {
    const result = await queryFn();
    cacheInstance.set(key, result, ttlMs);
    return result;
  } catch (error) {
    // Log the error and re-throw it for the caller to handle
    console.error(`[QueryCache] Query failed for key: ${key}`, error);
    throw error;
  }
}

// Cache key generators with better granularity
export const CacheKeys = {
  term: (id: string) => `term:${id}`,
  termsByCategory: (categoryId: string, page: number = 1) => `terms:cat:${categoryId}:page:${page}`,
  termSearch: (query: string, limit: number = 20) => `search:${query}:${limit}`,
  categoryTree: () => 'categories:tree',
  userFavorites: (userId: string) => `user:${userId}:favorites`,
  termSections: (termId: string) => `term:${termId}:sections`,
  analytics: (type: string, date: string) => `analytics:${type}:${date}`,
  popularTerms: (timeframe: string = 'week') => `popular:${timeframe}`,
  recentTerms: (limit: number = 10) => `recent:${limit}`,
  searchOptimized: (query: string, categoryId?: string, page: number = 1) =>
    `search-opt:${query}:${categoryId || 'all'}:${page}`,
  categoriesPaginated: (page: number, limit: number, fields: string) =>
    `categories:page:${page}:limit:${limit}:fields:${fields}`,

  // TTL constants (in milliseconds)
  SHORT_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MEDIUM_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  LONG_CACHE_TTL: 60 * 60 * 1000, // 1 hour
};

// Cache invalidation helpers
export const CacheInvalidation = {
  term: (termId: string) => {
    queryCache.invalidate(`term:${termId}`);
    queryCache.invalidate('terms:*');
    queryCache.invalidate('search:*');
    queryCache.invalidate('popular:*');
    queryCache.invalidate('recent:*');
  },

  category: (categoryId: string) => {
    queryCache.invalidate(`terms:cat:${categoryId}:*`);
    queryCache.invalidate(CacheKeys.categoryTree());
  },

  user: (userId: string) => {
    userCache.invalidate(`user:${userId}:*`);
  },

  search: () => {
    searchCache.invalidateAll();
    queryCache.invalidate('search:*');
    queryCache.invalidate('search-opt:*');
    queryCache.invalidate('search-optimized:*');
  },

  analytics: () => {
    queryCache.invalidate('analytics:*');
    queryCache.invalidate('popular:*');
  },
};

// Enhanced cache warming functions
export const CacheWarming = {
  async warmPopularTerms() {
    const { db } = await import('../db');
    const { terms, categories } = await import('../../shared/schema');
    const { desc, eq } = await import('drizzle-orm');

    console.log('🔥 Warming popular terms cache...');

    const popularTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        categoryName: categories.name,
        viewCount: terms.viewCount,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .orderBy(desc(terms.viewCount))
      .limit(50);

    queryCache.set(
      CacheKeys.popularTerms(),
      popularTerms,
      (30 * TIME_CONSTANTS.MILLISECONDS_IN_HOUR) / 2
    ); // 30 minutes
    console.log(`✅ Cached ${popularTerms.length} popular terms`);
  },

  async warmCategoryTree() {
    const { db } = await import('../db');
    const { categories, terms } = await import('../../shared/schema');
    const { eq, sql } = await import('drizzle-orm');

    console.log('🔥 Warming category tree cache...');

    // Warm basic categories
    const categoryTree = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        termCount: sql<number>`count(${terms.id})::int`,
      })
      .from(categories)
      .leftJoin(terms, eq(terms.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.description)
      .orderBy(categories.name);

    queryCache.set(CacheKeys.categoryTree(), categoryTree, TIME_CONSTANTS.MILLISECONDS_IN_HOUR); // 1 hour
    console.log(`✅ Cached ${categoryTree.length} categories`);

    // Warm paginated categories for common page sizes
    for (const limit of [10, 20, 50]) {
      const paginatedKey = CacheKeys.categoriesPaginated(1, limit, 'id,name,description,termCount');
      queryCache.set(
        paginatedKey,
        categoryTree.slice(0, limit),
        (30 * TIME_CONSTANTS.MILLISECONDS_IN_HOUR) / 2
      );
    }
    console.log('✅ Warmed paginated category caches');
  },

  async warmFrequentTermQueries() {
    const { db } = await import('../db');
    const { terms, categories } = await import('../../shared/schema');
    const { desc, eq, sql } = await import('drizzle-orm');

    console.log('🔥 Warming frequent term queries...');

    // Warm featured terms with different field combinations
    const featuredFields = [
      'id,name,shortDefinition,viewCount',
      'id,name,shortDefinition',
      'id,name,viewCount',
    ];

    for (const fields of featuredFields) {
      const fieldList = fields.split(',');
      const selectObj: any = {};

      if (fieldList.includes('id')) selectObj.id = terms.id;
      if (fieldList.includes('name')) selectObj.name = terms.name;
      if (fieldList.includes('shortDefinition')) selectObj.shortDefinition = terms.shortDefinition;
      if (fieldList.includes('viewCount')) selectObj.viewCount = terms.viewCount;
      if (fieldList.includes('category')) selectObj.category = categories.name;

      const result = await db
        .select(selectObj)
        .from(terms)
        .leftJoin(categories, eq(terms.categoryId, categories.id))
        .orderBy(desc(terms.viewCount))
        .limit(20);

      queryCache.set(
        `featured-terms:${fields}`,
        result,
        (15 * TIME_CONSTANTS.MILLISECONDS_IN_HOUR) / 4
      );
    }

    console.log('✅ Warmed featured terms with different field combinations');
  },

  async warmAll() {
    console.log('🔥 Starting comprehensive cache warming...');
    const startTime = Date.now();

    try {
      await Promise.all([
        this.warmPopularTerms(),
        this.warmCategoryTree(),
        this.warmFrequentTermQueries(),
      ]);

      const duration = Date.now() - startTime;
      console.log(`✅ Cache warming completed in ${duration}ms`);
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  },
};

// Cache statistics middleware
export function cacheStatsMiddleware(_req: any, res: any, next: any) {
  // Add cache stats to response headers in development
  if (process.env.NODE_ENV === 'development') {
    const stats = queryCache.getStats();
    res.set({
      'X-Cache-Hit-Rate': stats.hitRate.toFixed(2),
      'X-Cache-Size': stats.size.toString(),
      'X-Cache-Hits': stats.hitCount.toString(),
      'X-Cache-Misses': stats.missCount.toString(),
    });
  }
  next();
}

// Enhanced cleanup and warming tasks
setInterval(
  () => {
    if (process.env.NODE_ENV !== 'test') {
      // Cleanup expired entries
      const cleaned = queryCache.cleanup();
      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      }

      // Cleanup other cache instances
      const userCleaned = userCache.cleanup();
      const searchCleaned = searchCache.cleanup();

      if (userCleaned > 0 || searchCleaned > 0) {
        console.log(
          `🧹 Cleaned ${userCleaned} user cache entries, ${searchCleaned} search cache entries`
        );
      }
    }
  },
  (5 * TIME_CONSTANTS.MILLISECONDS_IN_HOUR) / 12
); // Every 5 minutes

// Cache warming task - run every 30 minutes
setInterval(
  () => {
    if (process.env.NODE_ENV === 'production') {
      CacheWarming.warmAll().catch((error) => {
        console.error('Cache warming failed:', error);
      });
    }
  },
  (30 * TIME_CONSTANTS.MILLISECONDS_IN_HOUR) / 2
); // Every 30 minutes

// Initial cache warming on startup (delayed to allow app to fully initialize)
setTimeout(() => {
  if (process.env.NODE_ENV === 'production') {
    CacheWarming.warmAll().catch((error) => {
      console.error('Initial cache warming failed:', error);
    });
  }
}, 30000); // 30 seconds after startup

// Helper functions for cache management
export async function clearCache(): Promise<void> {
  queryCache.invalidateAll();
  userCache.invalidateAll();
  searchCache.invalidateAll();
}

export function getCacheStats(): {
  hitRate: number;
  hits: number;
  misses: number;
  evictions: number;
  averageResponseTime?: number;
  cacheTypes: any;
} {
  const stats = {
    query: queryCache.getStats(),
    search: searchCache.getStats(),
    user: userCache.getStats(),
  };

  const totalHits = stats.query.hitCount + stats.search.hitCount + stats.user.hitCount;
  const totalMisses = stats.query.missCount + stats.search.missCount + stats.user.missCount;
  const totalEvictions =
    stats.query.evictionCount + stats.search.evictionCount + stats.user.evictionCount;
  const totalRequests = totalHits + totalMisses;

  // Get real-time metrics from collector
  const realTimeMetrics = metricsCollector.getRealTimeMetrics();

  return {
    hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
    hits: totalHits,
    misses: totalMisses,
    evictions: totalEvictions,
    averageResponseTime: realTimeMetrics.avgResponseTime,
    cacheTypes: stats,
  };
}

export { QueryCache };
