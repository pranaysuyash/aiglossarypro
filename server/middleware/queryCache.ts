/**
 * Query Cache Middleware
 * 
 * Implements intelligent caching for database queries to reduce load
 * and improve response times. Uses LRU cache with TTL support.
 */

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
  
  constructor(options: QueryCacheOptions = {}) {
    this.maxItems = options.maxItems || 1000;
    this.defaultTtlMs = options.defaultTtlMs || 5 * 60 * 1000; // 5 minutes
    this.enabled = options.enabled !== false;
  }
  
  get<T>(key: string): T | undefined {
    if (!this.enabled) return undefined;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.missCount++;
      return undefined;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return undefined;
    }
    
    // Update hit count
    entry.hits++;
    this.hitCount++;
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }
  
  set<T>(key: string, value: T, ttlMs?: number): void {
    if (!this.enabled) return;
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlMs || this.defaultTtlMs,
      hits: 0
    };
    
    this.cache.set(key, entry);
  }
  
  invalidate(pattern: string): number {
    if (!this.enabled) return 0;
    
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (this.matchesPattern(key, pattern)) {
        this.cache.delete(key);
        deletedCount++;
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
    return {
      size: this.cache.size,
      maxItems: this.maxItems,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) : 0,
      enabled: this.enabled
    };
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
  defaultTtlMs: 10 * 60 * 1000, // 10 minutes
  enabled: process.env.NODE_ENV !== 'test'
});

export const searchCache = new QueryCache({
  maxItems: 500,
  defaultTtlMs: 5 * 60 * 1000, // 5 minutes
  enabled: process.env.NODE_ENV !== 'test'
});

export const userCache = new QueryCache({
  maxItems: 1000,
  defaultTtlMs: 15 * 60 * 1000, // 15 minutes
  enabled: process.env.NODE_ENV !== 'test'
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
  const result = await queryFn();
  cacheInstance.set(key, result, ttlMs);
  
  return result;
}

// Cache key generators
export const CacheKeys = {
  term: (id: string) => `term:${id}`,
  termsByCategory: (categoryId: string, page: number = 1) => `terms:cat:${categoryId}:page:${page}`,
  termSearch: (query: string, limit: number = 20) => `search:${query}:${limit}`,
  categoryTree: () => 'categories:tree',
  userFavorites: (userId: string) => `user:${userId}:favorites`,
  termSections: (termId: string) => `term:${termId}:sections`,
  analytics: (type: string, date: string) => `analytics:${type}:${date}`,
  popularTerms: (timeframe: string = 'week') => `popular:${timeframe}`,
  recentTerms: (limit: number = 10) => `recent:${limit}`
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
    queryCache.invalidate('categories:*');
  },
  
  user: (userId: string) => {
    userCache.invalidate(`user:${userId}:*`);
  },
  
  search: () => {
    searchCache.invalidateAll();
    queryCache.invalidate('search:*');
  },
  
  analytics: () => {
    queryCache.invalidate('analytics:*');
    queryCache.invalidate('popular:*');
  }
};

// Cache warming functions
export const CacheWarming = {
  async warmPopularTerms() {
    const { db } = await import('../db');
    const { terms, categories } = await import('../../shared/schema');
    const { desc } = await import('drizzle-orm');
    
    console.log('🔥 Warming popular terms cache...');
    
    const popularTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        shortDefinition: terms.shortDefinition,
        categoryName: categories.name,
        viewCount: terms.viewCount
      })
      .from(terms)
      .leftJoin(categories, terms.categoryId)
      .orderBy(desc(terms.viewCount))
      .limit(50);
    
    queryCache.set(CacheKeys.popularTerms(), popularTerms, 30 * 60 * 1000); // 30 minutes
    console.log(`✅ Cached ${popularTerms.length} popular terms`);
  },
  
  async warmCategoryTree() {
    const { db } = await import('../db');
    const { categories } = await import('../../shared/schema');
    const { isNull } = await import('drizzle-orm');
    
    console.log('🔥 Warming category tree cache...');
    
    const categoryTree = await db
      .select()
      .from(categories)
      .orderBy(categories.name);
    
    queryCache.set(CacheKeys.categoryTree(), categoryTree, 60 * 60 * 1000); // 1 hour
    console.log(`✅ Cached ${categoryTree.length} categories`);
  }
};

// Cache statistics middleware
export function cacheStatsMiddleware(req: any, res: any, next: any) {
  // Add cache stats to response headers in development
  if (process.env.NODE_ENV === 'development') {
    const stats = queryCache.getStats();
    res.set({
      'X-Cache-Hit-Rate': stats.hitRate.toFixed(2),
      'X-Cache-Size': stats.size.toString(),
      'X-Cache-Hits': stats.hitCount.toString(),
      'X-Cache-Misses': stats.missCount.toString()
    });
  }
  next();
}

// Cleanup task - run periodically
setInterval(() => {
  if (process.env.NODE_ENV !== 'test') {
    const cleaned = queryCache.cleanup();
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

export { QueryCache };