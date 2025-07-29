/**
 * Redis Service for Production Caching
 * Uses Upstash Redis for serverless compatibility
 */

import { Redis } from '@upstash/redis';
import { log } from '../utils/logger';

export class RedisService {
  private redis: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Check if Redis is enabled
      if (process.env.REDIS_ENABLED !== 'true') {
        log.info('Redis caching is disabled');
        return;
      }

      // Initialize Upstash Redis
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        this.isEnabled = true;
        log.info('Upstash Redis initialized successfully');
      } else {
        log.warn('Upstash Redis credentials not found, caching disabled');
      }
    } catch (error) {
      log.error('Failed to initialize Redis', { error });
      this.isEnabled = false;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value as T;
    } catch (error) {
      log.error('Redis get error', { key, error });
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      log.error('Redis set error', { key, error });
      return false;
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      log.error('Redis del error', { key, error });
      return false;
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    if (!this.isEnabled || !this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        const deleted = await this.redis.del(...keys);
        return deleted;
      }
      return 0;
    } catch (error) {
      log.error('Redis clear pattern error', { pattern, error });
      return 0;
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.isEnabled && this.redis !== null;
  }

  /**
   * Cache wrapper function with automatic TTL
   */
  async cached<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    await this.set(key, data, ttlSeconds);
    
    return data;
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    if (!this.isEnabled || !this.redis) {
      return;
    }

    try {
      for (const tag of tags) {
        await this.clearPattern(`*:${tag}:*`);
      }
    } catch (error) {
      log.error('Redis invalidate by tags error', { tags, error });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    enabled: boolean;
    connected: boolean;
    keyCount?: number;
    memoryUsage?: string;
  }> {
    if (!this.isEnabled || !this.redis) {
      return { enabled: false, connected: false };
    }

    try {
      // Note: Upstash may have limitations on info commands
      const dbSize = await this.redis.dbsize();
      
      return {
        enabled: true,
        connected: true,
        keyCount: dbSize,
      };
    } catch (error) {
      log.error('Redis get stats error', { error });
      return { enabled: true, connected: false };
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();

// Cache key generators
export const cacheKeys = {
  // Terms
  term: (id: string) => `term:${id}`,
  termBySlug: (slug: string) => `term:slug:${slug}`,
  termsList: (page: number, limit: number, filters?: any) => 
    `terms:list:${page}:${limit}:${JSON.stringify(filters || {})}`,
  
  // Categories
  category: (id: string) => `category:${id}`,
  categoriesList: () => 'categories:list',
  categoryTerms: (categoryId: string) => `category:${categoryId}:terms`,
  
  // User data
  userProgress: (userId: string) => `user:${userId}:progress`,
  userFavorites: (userId: string) => `user:${userId}:favorites`,
  userHistory: (userId: string) => `user:${userId}:history`,
  
  // Analytics
  analytics: (type: string, date: string) => `analytics:${type}:${date}`,
  trending: () => 'analytics:trending',
  
  // AI features
  aiSuggestions: (termId: string) => `ai:suggestions:${termId}`,
  aiSearch: (query: string) => `ai:search:${query}`,
  
  // Admin
  adminStats: () => 'admin:stats',
  adminMetrics: (type: string) => `admin:metrics:${type}`,
};

// Cache TTL values (in seconds)
export const cacheTTL = {
  short: 300,      // 5 minutes
  medium: 3600,    // 1 hour  
  long: 86400,     // 24 hours
  week: 604800,    // 7 days
};