/**
 * Redis Configuration for Enhanced Storage
 *
 * Provides Redis caching integration for the enhanced storage layer.
 * Recommended by Gemini for scalable caching of 42-section data.
 *
 * Phase 2B Implementation
 * Date: June 26, 2025
 */

interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  enableOfflineQueue?: boolean;
}

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<void>;
  ttl(key: string): Promise<number>;
  flushdb(): Promise<void>;
  quit(): Promise<void>;
  isConnected(): boolean;
}

class ProductionRedisClient implements RedisClient {
  constructor(private ioredisClient: any) {}

  async get(key: string): Promise<string | null> {
    return await this.ioredisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.ioredisClient.setex(key, ttl, value);
    } else {
      await this.ioredisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.ioredisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.ioredisClient.exists(key);
    return result === 1;
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.ioredisClient.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return await this.ioredisClient.ttl(key);
  }

  async flushdb(): Promise<void> {
    await this.ioredisClient.flushdb();
  }

  async quit(): Promise<void> {
    await this.ioredisClient.quit();
  }

  isConnected(): boolean {
    return this.ioredisClient.status === 'ready' || this.ioredisClient.status === 'connecting';
  }
}

class MockRedisClient implements RedisClient {
  private cache = new Map<string, { value: string; expires?: number }>();
  private connected = true;

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) {return null;}

    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const entry: { value: string; expires?: number } = { value };
    if (ttl) {
      entry.expires = Date.now() + ttl * 1000;
    }
    this.cache.set(key, entry);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {return false;}

    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.expires = Date.now() + ttl * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry?.expires) {return -1;}

    const remaining = Math.floor((entry.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async flushdb(): Promise<void> {
    this.cache.clear();
  }

  async quit(): Promise<void> {
    this.connected = false;
    this.cache.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Redis configuration
const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000,
  enableOfflineQueue: false,
};

// Production Redis configuration with additional settings
const productionRedisConfig: RedisConfig = {
  ...redisConfig,
  retryDelayOnFailover: 1000,
  maxRetriesPerRequest: 5,
  connectTimeout: 30000,
  commandTimeout: 15000,
  enableOfflineQueue: true,
};

// Create Redis client
let redisClient: RedisClient;

const createRedisClient = (): RedisClient => {
  // Use mock client for development if no Redis URL is provided and REDIS_ENABLED is not true
  if (
    process.env.NODE_ENV === 'development' &&
    !process.env.REDIS_URL &&
    process.env.REDIS_ENABLED !== 'true'
  ) {
    console.log('[Redis] Using mock Redis client for development');
    return new MockRedisClient();
  }

  // Use actual Redis client in production or when REDIS_URL is provided
  if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
    try {
      // Use dynamic import instead of require for ESM compatibility
      import('ioredis')
        .then(({ default: Redis }) => {
          console.log('[Redis] Initializing real Redis client');

          const configToUse =
            process.env.NODE_ENV === 'production' ? productionRedisConfig : redisConfig;

          const client = process.env.REDIS_URL
            ? new Redis(process.env.REDIS_URL, {
                ...configToUse,
                lazyConnect: true,
                maxRetriesPerRequest: configToUse.maxRetriesPerRequest,
                retryDelayOnFailover: configToUse.retryDelayOnFailover,
                connectTimeout: configToUse.connectTimeout,
                commandTimeout: configToUse.commandTimeout,
                enableOfflineQueue: configToUse.enableOfflineQueue,
              })
            : new Redis(configToUse);

          // Add connection event listeners
          client.on('connect', () => {
            console.log('[Redis] Connected to Redis server');
          });

          client.on('ready', () => {
            console.log('[Redis] Redis client ready');
          });

          client.on('error', error => {
            console.error('[Redis] Redis client error:', error);
          });

          client.on('close', () => {
            console.log('[Redis] Redis connection closed');
          });

          client.on('reconnecting', () => {
            console.log('[Redis] Redis reconnecting...');
          });

          // Replace the global client with the real one
          redisClient = new ProductionRedisClient(client);
        })
        .catch(error => {
          console.error('[Redis] Failed to dynamically import ioredis:', error);
        });

      // Return mock client for immediate use, will be replaced by real client
      console.log('[Redis] Starting with mock client, will upgrade to real Redis when available');
      return new MockRedisClient();
    } catch (error) {
      console.error('[Redis] Failed to initialize Redis client:', error);
      console.warn('[Redis] Falling back to mock Redis client');
      return new MockRedisClient();
    }
  }

  console.log('[Redis] Using mock Redis client as fallback');
  return new MockRedisClient();
};

// Initialize Redis client
redisClient = createRedisClient();

// Stale-while-revalidate cache entry interface
interface StaleWhileRevalidateEntry<T> {
  data: T;
  timestamp: number;
  staleTimestamp: number;
}

// Redis utilities for enhanced storage with stale-while-revalidate support
export class RedisCache {
  private prefix = 'enhanced_storage:';
  private stalePrefix = 'stale:';
  private revalidationJobs = new Map<string, Promise<any>>();

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private getStaleKey(key: string): string {
    return `${this.prefix}${this.stalePrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(this.getKey(key));
      if (!value) {return null;}

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[RedisCache] Get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.set(this.getKey(key), serialized, ttl);
    } catch (error) {
      console.error('[RedisCache] Set error:', error);
      // Don't throw - caching failures should be non-fatal
    }
  }

  /**
   * Stale-while-revalidate cache implementation
   * Returns stale data immediately while revalidating in the background
   */
  async getStaleWhileRevalidate<T>(
    key: string,
    revalidateFn: () => Promise<T>,
    options: {
      ttl: number; // Fresh cache duration
      staleTtl: number; // How long to serve stale data
      revalidateThreshold?: number; // When to trigger background revalidation (default: 80% of ttl)
    }
  ): Promise<T | null> {
    try {
      const cacheKey = this.getKey(key);
      const staleKey = this.getStaleKey(key);

      // Try to get fresh data
      const cachedValue = await redisClient.get(cacheKey);
      if (cachedValue) {
        const entry: StaleWhileRevalidateEntry<T> = JSON.parse(cachedValue);

        // Check if we should trigger background revalidation
        const now = Date.now();
        const age = now - entry.timestamp;
        const revalidateThreshold = options.revalidateThreshold || 0.8;
        const shouldRevalidate = age > options.ttl * 1000 * revalidateThreshold;

        if (shouldRevalidate && !this.revalidationJobs.has(key)) {
          // Start background revalidation
          this.startBackgroundRevalidation(key, revalidateFn, options);
        }

        return entry.data;
      }

      // Try to get stale data
      const staleValue = await redisClient.get(staleKey);
      if (staleValue) {
        const staleEntry: StaleWhileRevalidateEntry<T> = JSON.parse(staleValue);

        // Start revalidation if not already running
        if (!this.revalidationJobs.has(key)) {
          this.startBackgroundRevalidation(key, revalidateFn, options);
        }

        console.log(`[RedisCache] Serving stale data for key: ${key}`);
        return staleEntry.data;
      }

      // No cached data available, fetch fresh
      console.log(`[RedisCache] No cached data for key: ${key}, fetching fresh`);
      const freshData = await revalidateFn();
      await this.setStaleWhileRevalidate(key, freshData, options);

      return freshData;
    } catch (error) {
      console.error('[RedisCache] Stale-while-revalidate error:', error);

      // Fallback: try to execute revalidate function
      try {
        return await revalidateFn();
      } catch (revalidateError) {
        console.error('[RedisCache] Revalidate function failed:', revalidateError);
        return null;
      }
    }
  }

  private async startBackgroundRevalidation<T>(
    key: string,
    revalidateFn: () => Promise<T>,
    options: { ttl: number; staleTtl: number }
  ): Promise<void> {
    // Prevent multiple revalidation jobs for the same key
    if (this.revalidationJobs.has(key)) {
      return;
    }

    const revalidationPromise = (async () => {
      try {
        console.log(`[RedisCache] Starting background revalidation for key: ${key}`);
        const freshData = await revalidateFn();
        await this.setStaleWhileRevalidate(key, freshData, options);
        console.log(`[RedisCache] Background revalidation completed for key: ${key}`);
      } catch (error) {
        console.error(`[RedisCache] Background revalidation failed for key: ${key}`, error);
      } finally {
        this.revalidationJobs.delete(key);
      }
    })();

    this.revalidationJobs.set(key, revalidationPromise);
  }

  private async setStaleWhileRevalidate<T>(
    key: string,
    value: T,
    options: { ttl: number; staleTtl: number }
  ): Promise<void> {
    try {
      const now = Date.now();
      const entry: StaleWhileRevalidateEntry<T> = {
        data: value,
        timestamp: now,
        staleTimestamp: now + options.ttl * 1000,
      };

      const serialized = JSON.stringify(entry);
      const cacheKey = this.getKey(key);
      const staleKey = this.getStaleKey(key);

      // Set fresh cache
      await redisClient.set(cacheKey, serialized, options.ttl);

      // Set stale cache with longer TTL
      await redisClient.set(staleKey, serialized, options.staleTtl);
    } catch (error) {
      console.error('[RedisCache] Set stale-while-revalidate error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(this.getKey(key));
    } catch (error) {
      console.error('[RedisCache] Delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await redisClient.exists(this.getKey(key));
    } catch (error) {
      console.error('[RedisCache] Exists error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // For mock client, this is a no-op
      // For real Redis, you'd use SCAN + DEL pattern
      console.log(`[RedisCache] Invalidating pattern: ${pattern}`);
    } catch (error) {
      console.error('[RedisCache] Invalidate pattern error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await redisClient.flushdb();
    } catch (error) {
      console.error('[RedisCache] Clear error:', error);
    }
  }

  isConnected(): boolean {
    return redisClient.isConnected();
  }
}

// Export instances
export const redis = redisClient;
export const redisCache = new RedisCache();

// Cache key generators for enhanced storage
export const CacheKeys = {
  // Enhanced terms caching
  enhancedTerm: (id: string) => `enhanced_term:${id}`,
  termSections: (termId: string) => `term_sections:${termId}`,
  searchResults: (query: string, filters: string) => `search:${query}:${filters}`,
  userPreferences: (userId: string) => `user_prefs:${userId}`,

  // Analytics caching
  searchMetrics: (timeframe: string) => `search_metrics:${timeframe}`,
  contentMetrics: () => `content_metrics`,
  systemHealth: () => `system_health`,

  // Admin data caching
  adminStats: () => `admin_stats`,
  databaseMetrics: () => `database_metrics`,

  // Interactive elements
  interactiveElements: (termId: string) => `interactive:${termId}`,

  // Relationships and recommendations
  termRelationships: (termId: string) => `relationships:${termId}`,
  recommendations: (userId: string) => `recommendations:${userId}`,

  // TTL constants (in seconds for Redis, in milliseconds for reference)
  SHORT_CACHE_TTL: 5 * 60, // 5 minutes
  MEDIUM_CACHE_TTL: 30 * 60, // 30 minutes
  LONG_CACHE_TTL: 60 * 60, // 1 hour

  // Stale-while-revalidate configurations
  SWR_CONFIG: {
    // High-frequency data (search results, trending)
    HIGH_FREQUENCY: {
      ttl: 2 * 60, // 2 minutes fresh
      staleTtl: 10 * 60, // 10 minutes stale
      revalidateThreshold: 0.7, // Revalidate after 70% of TTL
    },
    // Medium-frequency data (term content, user preferences)
    MEDIUM_FREQUENCY: {
      ttl: 15 * 60, // 15 minutes fresh
      staleTtl: 60 * 60, // 1 hour stale
      revalidateThreshold: 0.8, // Revalidate after 80% of TTL
    },
    // Low-frequency data (admin stats, system metrics)
    LOW_FREQUENCY: {
      ttl: 60 * 60, // 1 hour fresh
      staleTtl: 4 * 60 * 60, // 4 hours stale
      revalidateThreshold: 0.9, // Revalidate after 90% of TTL
    },
  },
};

export default redis;
