/**
 * API response optimization utilities
 * Provides caching, compression, and response time monitoring
 */

import { createHash } from 'crypto';
import { NextFunction, Request, Response } from 'express';

interface CacheOptions {
    ttl?: number; // Time to live in seconds
    key?: string; // Custom cache key
    tags?: string[]; // Cache tags for invalidation
    compress?: boolean; // Enable compression
}

interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
    tags: string[];
    compressed: boolean;
}

interface ResponseTimeMetrics {
    endpoint: string;
    method: string;
    responseTime: number;
    timestamp: number;
    statusCode: number;
    cacheHit: boolean;
}

class APIOptimizer {
    private cacheStore = new Map<string, CacheEntry>();
    private responseMetrics: ResponseTimeMetrics[] = [];
    private readonly maxCacheSize = 1000;
    private readonly maxMetricsSize = 10000;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startCleanupInterval();
    }

    /**
     * Cache middleware for API responses
     */
    cache(options: CacheOptions = {}) {
        const {
            ttl = 300, // 5 minutes default
            key,
            tags = [],
            compress = true
        } = options;

        return (req: Request, res: Response, next: NextFunction) => {
            // Generate cache key
            const cacheKey = key || this.generateCacheKey(req);

            // Check cache
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log(`🎯 Cache hit for ${req.method} ${req.path}`);

                // Track cache hit
                this.trackResponseTime({
                    endpoint: req.path,
                    method: req.method,
                    responseTime: 0,
                    timestamp: Date.now(),
                    statusCode: 200,
                    cacheHit: true
                });

                // Set cache headers
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${ttl}`
                });

                return res.json(cached.data);
            }

            // Override res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = (data: any) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    this.setCache(cacheKey, data, ttl, tags, compress);

                    res.set({
                        'X-Cache': 'MISS',
                        'X-Cache-Key': cacheKey,
                        'Cache-Control': `public, max-age=${ttl}`
                    });
                }

                return originalJson(data);
            };

            next();
        };
    }

    /**
     * Response time monitoring middleware
     */
    monitor() {
        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = Date.now();

            // Override res.end to capture response time
            const originalEnd = res.end.bind(res);
            res.end = (...args: any[]) => {
                const responseTime = Date.now() - startTime;

                this.trackResponseTime({
                    endpoint: req.path,
                    method: req.method,
                    responseTime,
                    timestamp: Date.now(),
                    statusCode: res.statusCode,
                    cacheHit: res.get('X-Cache') === 'HIT'
                });

                // Log slow responses
                if (responseTime > 1000) {
                    console.warn(`🐌 Slow response: ${req.method} ${req.path} took ${responseTime}ms`);
                }

                return originalEnd(...args);
            };

            next();
        };
    }

    /**
     * Compression middleware for API responses
     */
    compress() {
        return (req: Request, res: Response, next: NextFunction) => {
            const acceptsGzip = req.headers['accept-encoding']?.includes('gzip');

            if (acceptsGzip) {
                const originalJson = res.json.bind(res);
                res.json = (data: any) => {
                    const jsonString = JSON.stringify(data);

                    // Only compress responses larger than 1KB
                    if (jsonString.length > 1024) {
                        res.set({
                            'Content-Encoding': 'gzip',
                            'Content-Type': 'application/json'
                        });
                    }

                    return originalJson(data);
                };
            }

            next();
        };
    }

    /**
     * Generate cache key from request
     */
    private generateCacheKey(req: Request): string {
        const keyData = {
            method: req.method,
            path: req.path,
            query: req.query,
            user: req.user?.id || 'anonymous'
        };

        return createHash('md5')
            .update(JSON.stringify(keyData))
            .digest('hex');
    }

    /**
     * Get data from cache
     */
    private getFromCache(key: string): CacheEntry | null {
        const entry = this.cacheStore.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl * 1000) {
            this.cacheStore.delete(key);
            return null;
        }

        return entry;
    }

    /**
     * Set data in cache
     */
    private setCache(
        key: string,
        data: any,
        ttl: number,
        tags: string[],
        compress: boolean
    ): void {
        // Prevent cache from growing too large
        if (this.cacheStore.size >= this.maxCacheSize) {
            this.evictOldestEntries();
        }

        const entry: CacheEntry = {
            data,
            timestamp: Date.now(),
            ttl,
            tags,
            compressed: compress
        };

        this.cacheStore.set(key, entry);
    }

    /**
     * Invalidate cache by tags
     */
    invalidateByTags(tags: string[]): number {
        let invalidated = 0;

        for (const [key, entry] of this.cacheStore.entries()) {
            if (entry.tags.some(tag => tags.includes(tag))) {
                this.cacheStore.delete(key);
                invalidated++;
            }
        }

        console.log(`🗑️ Invalidated ${invalidated} cache entries for tags: ${tags.join(', ')}`);
        return invalidated;
    }

    /**
     * Clear all cache
     */
    clearCache(): void {
        const size = this.cacheStore.size;
        this.cacheStore.clear();
        console.log(`🗑️ Cleared ${size} cache entries`);
    }

    /**
     * Track response time metrics
     */
    private trackResponseTime(metrics: ResponseTimeMetrics): void {
        this.responseMetrics.push(metrics);

        // Prevent metrics from growing too large
        if (this.responseMetrics.length > this.maxMetricsSize) {
            this.responseMetrics = this.responseMetrics.slice(-this.maxMetricsSize / 2);
        }
    }

    /**
     * Get response time statistics
     */
    getResponseStats(timeWindow = 3600000): { // 1 hour default
        endpoint?: string;
        avgResponseTime: number;
        maxResponseTime: number;
        minResponseTime: number;
        totalRequests: number;
        cacheHitRate: number;
        slowRequests: number;
        errorRate: number;
    } {
        const cutoff = Date.now() - timeWindow;
        const recentMetrics = this.responseMetrics.filter(m => m.timestamp > cutoff);

        if (recentMetrics.length === 0) {
            return {
                avgResponseTime: 0,
                maxResponseTime: 0,
                minResponseTime: 0,
                totalRequests: 0,
                cacheHitRate: 0,
                slowRequests: 0,
                errorRate: 0
            };
        }

        const responseTimes = recentMetrics.map(m => m.responseTime);
        const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
        const slowRequests = recentMetrics.filter(m => m.responseTime > 1000).length;
        const errors = recentMetrics.filter(m => m.statusCode >= 400).length;

        return {
            avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
            maxResponseTime: Math.max(...responseTimes),
            minResponseTime: Math.min(...responseTimes),
            totalRequests: recentMetrics.length,
            cacheHitRate: (cacheHits / recentMetrics.length) * 100,
            slowRequests,
            errorRate: (errors / recentMetrics.length) * 100
        };
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        hitRate: number;
        memoryUsage: number;
        oldestEntry: number;
        newestEntry: number;
    } {
        const entries = Array.from(this.cacheStore.values());

        if (entries.length === 0) {
            return {
                size: 0,
                hitRate: 0,
                memoryUsage: 0,
                oldestEntry: 0,
                newestEntry: 0
            };
        }

        const timestamps = entries.map(e => e.timestamp);
        const memoryUsage = JSON.stringify(Array.from(this.cacheStore.entries())).length;

        return {
            size: this.cacheStore.size,
            hitRate: this.calculateHitRate(),
            memoryUsage,
            oldestEntry: Math.min(...timestamps),
            newestEntry: Math.max(...timestamps)
        };
    }

    /**
     * Calculate cache hit rate
     */
    private calculateHitRate(): number {
        const recentMetrics = this.responseMetrics.slice(-1000); // Last 1000 requests
        if (recentMetrics.length === 0) {return 0;}

        const hits = recentMetrics.filter(m => m.cacheHit).length;
        return (hits / recentMetrics.length) * 100;
    }

    /**
     * Evict oldest cache entries
     */
    private evictOldestEntries(): void {
        const entries = Array.from(this.cacheStore.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove oldest 25% of entries
        const toRemove = Math.floor(entries.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
            this.cacheStore.delete(entries[i][0]);
        }

        console.log(`🗑️ Evicted ${toRemove} oldest cache entries`);
    }

    /**
     * Start cleanup interval
     */
    private startCleanupInterval(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredEntries();
        }, 300000); // 5 minutes
    }

    /**
     * Cleanup expired cache entries
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cacheStore.entries()) {
            if (now - entry.timestamp > entry.ttl * 1000) {
                this.cacheStore.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
        }
    }

    /**
     * Stop cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cacheStore.clear();
        this.responseMetrics = [];
    }
}

// Export singleton instance
export const apiOptimizer = new APIOptimizer();

// Convenience middleware exports
export const cacheResponse = (options?: CacheOptions) => apiOptimizer.cache(options);
export const monitorResponse = () => apiOptimizer.monitor();
export const compressResponse = () => apiOptimizer.compress();

export default apiOptimizer;