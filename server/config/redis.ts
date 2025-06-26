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
  flushdb(): Promise<void>;
  quit(): Promise<void>;
  isConnected(): boolean;
}

class MockRedisClient implements RedisClient {
  private cache = new Map<string, { value: string; expires?: number }>();
  private connected = true;

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const entry: { value: string; expires?: number } = { value };
    if (ttl) {
      entry.expires = Date.now() + (ttl * 1000);
    }
    this.cache.set(key, entry);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.expires = Date.now() + (ttl * 1000);
    }
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
  enableOfflineQueue: false
};

// Create Redis client
let redisClient: RedisClient;

const createRedisClient = (): RedisClient => {
  if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
    console.log('[Redis] Using mock Redis client for development');
    return new MockRedisClient();
  }

  // In production or when REDIS_URL is provided, you would create actual Redis client
  // For now, use mock client as fallback
  console.log('[Redis] Redis client configuration:', { 
    host: redisConfig.host, 
    port: redisConfig.port,
    db: redisConfig.db 
  });
  
  // TODO: Implement actual Redis client when Redis is available
  // import Redis from 'ioredis';
  // return new Redis(redisConfig);
  
  console.warn('[Redis] Falling back to mock Redis client');
  return new MockRedisClient();
};

// Initialize Redis client
redisClient = createRedisClient();

// Redis utilities for enhanced storage
export class RedisCache {
  private prefix = 'enhanced_storage:';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(this.getKey(key));
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[RedisCache] Get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.set(this.getKey(key), serialized, ttl);
    } catch (error) {
      console.error('[RedisCache] Set error:', error);
      // Don't throw - caching failures should be non-fatal
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
  recommendations: (userId: string) => `recommendations:${userId}`
};

export default redis;