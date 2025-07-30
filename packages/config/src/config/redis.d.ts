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
export declare class RedisCache {
    private prefix;
    private stalePrefix;
    private revalidationJobs;
    private getKey;
    private getStaleKey;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    /**
     * Stale-while-revalidate cache implementation
     * Returns stale data immediately while revalidating in the background
     */
    getStaleWhileRevalidate<T>(key: string, revalidateFn: () => Promise<T>, options: {
        ttl: number;
        staleTtl: number;
        revalidateThreshold?: number;
    }): Promise<T | null>;
    private startBackgroundRevalidation;
    private setStaleWhileRevalidate;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    invalidatePattern(pattern: string): Promise<void>;
    clear(): Promise<void>;
    isConnected(): boolean;
}
export declare const redis: RedisClient;
export declare const redisCache: RedisCache;
export declare const CacheKeys: {
    enhancedTerm: (id: string) => string;
    termSections: (termId: string) => string;
    searchResults: (query: string, filters: string) => string;
    userPreferences: (userId: string) => string;
    searchMetrics: (timeframe: string) => string;
    contentMetrics: () => string;
    systemHealth: () => string;
    adminStats: () => string;
    databaseMetrics: () => string;
    interactiveElements: (termId: string) => string;
    termRelationships: (termId: string) => string;
    recommendations: (userId: string) => string;
    SHORT_CACHE_TTL: number;
    MEDIUM_CACHE_TTL: number;
    LONG_CACHE_TTL: number;
    SWR_CONFIG: {
        HIGH_FREQUENCY: {
            ttl: number;
            staleTtl: number;
            revalidateThreshold: number;
        };
        MEDIUM_FREQUENCY: {
            ttl: number;
            staleTtl: number;
            revalidateThreshold: number;
        };
        LOW_FREQUENCY: {
            ttl: number;
            staleTtl: number;
            revalidateThreshold: number;
        };
    };
};
export default redis;
