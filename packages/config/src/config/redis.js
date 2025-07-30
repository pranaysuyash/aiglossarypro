"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = exports.redisCache = exports.redis = exports.RedisCache = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class ProductionRedisClient {
    constructor(ioredisClient) {
        this.ioredisClient = ioredisClient;
    }
    async get(key) {
        return await this.ioredisClient.get(key);
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.ioredisClient.setex(key, ttl, value);
        }
        else {
            await this.ioredisClient.set(key, value);
        }
    }
    async del(key) {
        await this.ioredisClient.del(key);
    }
    async exists(key) {
        const result = await this.ioredisClient.exists(key);
        return result === 1;
    }
    async expire(key, ttl) {
        await this.ioredisClient.expire(key, ttl);
    }
    async ttl(key) {
        return await this.ioredisClient.ttl(key);
    }
    async flushdb() {
        await this.ioredisClient.flushdb();
    }
    async quit() {
        await this.ioredisClient.quit();
    }
    isConnected() {
        return this.ioredisClient.status === 'ready' || this.ioredisClient.status === 'connecting';
    }
}
class MockRedisClient {
    constructor() {
        this.cache = new Map();
        this.connected = true;
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (entry.expires && Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttl) {
        const entry = { value };
        if (ttl) {
            entry.expires = Date.now() + ttl * 1000;
        }
        this.cache.set(key, entry);
    }
    async del(key) {
        this.cache.delete(key);
    }
    async exists(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }
        if (entry.expires && Date.now() > entry.expires) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    async expire(key, ttl) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.expires = Date.now() + ttl * 1000;
        }
    }
    async ttl(key) {
        const entry = this.cache.get(key);
        if (!entry?.expires) {
            return -1;
        }
        const remaining = Math.floor((entry.expires - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }
    async flushdb() {
        this.cache.clear();
    }
    async quit() {
        this.connected = false;
        this.cache.clear();
    }
    isConnected() {
        return this.connected;
    }
}
// Redis configuration
const redisConfig = {
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
const productionRedisConfig = {
    ...redisConfig,
    retryDelayOnFailover: 1000,
    maxRetriesPerRequest: 5,
    connectTimeout: 30000,
    commandTimeout: 15000,
    enableOfflineQueue: true,
};
// Create Redis client
let redisClient;
const createRedisClient = () => {
    // Use mock client for development if no Redis URL is provided and REDIS_ENABLED is not true
    if (process.env.NODE_ENV === 'development' &&
        !process.env.REDIS_URL &&
        process.env.REDIS_ENABLED !== 'true') {
        logger_1.default.info('[Redis] Using mock Redis client for development');
        return new MockRedisClient();
    }
    // Use actual Redis client only when explicitly enabled and URL is provided
    if (process.env.REDIS_ENABLED === 'true' && process.env.REDIS_URL) {
        try {
            // Use dynamic import instead of require for ESM compatibility
            Promise.resolve().then(() => __importStar(require('ioredis'))).then(({ default: Redis }) => {
                logger_1.default.info('[Redis] Initializing real Redis client');
                const configToUse = process.env.NODE_ENV === 'production' ? productionRedisConfig : redisConfig;
                const client = process.env.REDIS_URL
                    ? new Redis(process.env.REDIS_URL, {
                        ...configToUse,
                        lazyConnect: true,
                        maxRetriesPerRequest: configToUse.maxRetriesPerRequest,
                        // retryDelayOnFailover: configToUse.retryDelayOnFailover, // Not supported in newer versions
                        connectTimeout: configToUse.connectTimeout,
                        commandTimeout: configToUse.commandTimeout,
                        enableOfflineQueue: configToUse.enableOfflineQueue,
                    })
                    : new Redis(configToUse);
                // Add connection event listeners
                client.on('connect', () => {
                    logger_1.default.info('[Redis] Connected to Redis server');
                });
                client.on('ready', () => {
                    logger_1.default.info('[Redis] Redis client ready');
                });
                client.on('error', error => {
                    logger_1.default.error('[Redis] Redis client error:', error);
                });
                client.on('close', () => {
                    logger_1.default.info('[Redis] Redis connection closed');
                });
                client.on('reconnecting', () => {
                    logger_1.default.info('[Redis] Redis reconnecting...');
                });
                // Replace the global client with the real one
                redisClient = new ProductionRedisClient(client);
            })
                .catch(error => {
                logger_1.default.error('[Redis] Failed to dynamically import ioredis:', error);
            });
            // Return mock client for immediate use, will be replaced by real client
            logger_1.default.info('[Redis] Starting with mock client, will upgrade to real Redis when available');
            return new MockRedisClient();
        }
        catch (error) {
            logger_1.default.error('[Redis] Failed to initialize Redis client:', error);
            logger_1.default.warn('[Redis] Falling back to mock Redis client');
            return new MockRedisClient();
        }
    }
    logger_1.default.info('[Redis] Using mock Redis client as fallback');
    return new MockRedisClient();
};
// Initialize Redis client
redisClient = createRedisClient();
// Redis utilities for enhanced storage with stale-while-revalidate support
class RedisCache {
    constructor() {
        this.prefix = 'enhanced_storage:';
        this.stalePrefix = 'stale:';
        this.revalidationJobs = new Map();
    }
    getKey(key) {
        return `${this.prefix}${key}`;
    }
    getStaleKey(key) {
        return `${this.prefix}${this.stalePrefix}${key}`;
    }
    async get(key) {
        try {
            const value = await redisClient.get(this.getKey(key));
            if (!value) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.default.error('[RedisCache] Get error:', error);
            return null;
        }
    }
    async set(key, value, ttl = 300) {
        try {
            const serialized = JSON.stringify(value);
            await redisClient.set(this.getKey(key), serialized, ttl);
        }
        catch (error) {
            logger_1.default.error('[RedisCache] Set error:', error);
            // Don't throw - caching failures should be non-fatal
        }
    }
    /**
     * Stale-while-revalidate cache implementation
     * Returns stale data immediately while revalidating in the background
     */
    async getStaleWhileRevalidate(key, revalidateFn, options) {
        try {
            const cacheKey = this.getKey(key);
            const staleKey = this.getStaleKey(key);
            // Try to get fresh data
            const cachedValue = await redisClient.get(cacheKey);
            if (cachedValue) {
                const entry = JSON.parse(cachedValue);
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
                const staleEntry = JSON.parse(staleValue);
                // Start revalidation if not already running
                if (!this.revalidationJobs.has(key)) {
                    this.startBackgroundRevalidation(key, revalidateFn, options);
                }
                logger_1.default.info(`[RedisCache] Serving stale data for key: ${key}`);
                return staleEntry.data;
            }
            // No cached data available, fetch fresh
            logger_1.default.info(`[RedisCache] No cached data for key: ${key}, fetching fresh`);
            const freshData = await revalidateFn();
            await this.setStaleWhileRevalidate(key, freshData, options);
            return freshData;
        }
        catch (error) {
            logger_1.default.error('[RedisCache] Stale-while-revalidate error:', error);
            // Fallback: try to execute revalidate function
            try {
                return await revalidateFn();
            }
            catch (revalidateError) {
                logger_1.default.error('[RedisCache] Revalidate function failed:', revalidateError);
                return null;
            }
        }
    }
    async startBackgroundRevalidation(key, revalidateFn, options) {
        // Prevent multiple revalidation jobs for the same key
        if (this.revalidationJobs.has(key)) {
            return;
        }
        const revalidationPromise = (async () => {
            try {
                logger_1.default.info(`[RedisCache] Starting background revalidation for key: ${key}`);
                const freshData = await revalidateFn();
                await this.setStaleWhileRevalidate(key, freshData, options);
                logger_1.default.info(`[RedisCache] Background revalidation completed for key: ${key}`);
            }
            catch (error) {
                logger_1.default.error(`[RedisCache] Background revalidation failed for key: ${key}`, error);
            }
            finally {
                this.revalidationJobs.delete(key);
            }
        })();
        this.revalidationJobs.set(key, revalidationPromise);
    }
    async setStaleWhileRevalidate(key, value, options) {
        try {
            const now = Date.now();
            const entry = {
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
        }
        catch (error) {
            logger_1.default.error('[RedisCache] Set stale-while-revalidate error:', error);
        }
    }
    async del(key) {
        try {
            await redisClient.del(this.getKey(key));
        }
        catch (error) {
            logger_1.default.error('[RedisCache] Delete error:', error);
        }
    }
    async exists(key) {
        try {
            return await redisClient.exists(this.getKey(key));
        }
        catch (error) {
            logger_1.default.error('[RedisCache] Exists error:', error);
            return false;
        }
    }
    async invalidatePattern(pattern) {
        try {
            // For mock client, this is a no-op
            // For real Redis, you'd use SCAN + DEL pattern
            logger_1.default.info(`[RedisCache] Invalidating pattern: ${pattern}`);
        }
        catch (error) {
            logger_1.default.error('[RedisCache] Invalidate pattern error:', error);
        }
    }
    async clear() {
        try {
            await redisClient.flushdb();
        }
        catch (error) {
            logger_1.default.error('[RedisCache] Clear error:', error);
        }
    }
    isConnected() {
        return redisClient.isConnected();
    }
}
exports.RedisCache = RedisCache;
// Export instances
exports.redis = redisClient;
exports.redisCache = new RedisCache();
// Cache key generators for enhanced storage
exports.CacheKeys = {
    // Enhanced terms caching
    enhancedTerm: (id) => `enhanced_term:${id}`,
    termSections: (termId) => `term_sections:${termId}`,
    searchResults: (query, filters) => `search:${query}:${filters}`,
    userPreferences: (userId) => `user_prefs:${userId}`,
    // Analytics caching
    searchMetrics: (timeframe) => `search_metrics:${timeframe}`,
    contentMetrics: () => `content_metrics`,
    systemHealth: () => `system_health`,
    // Admin data caching
    adminStats: () => `admin_stats`,
    databaseMetrics: () => `database_metrics`,
    // Interactive elements
    interactiveElements: (termId) => `interactive:${termId}`,
    // Relationships and recommendations
    termRelationships: (termId) => `relationships:${termId}`,
    recommendations: (userId) => `recommendations:${userId}`,
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
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map