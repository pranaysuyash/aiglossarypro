/**
 * Database query optimization utilities
 * Provides query caching, indexing recommendations, and performance monitoring
 */

interface QueryMetrics {
    query: string;
    executionTime: number;
    timestamp: number;
    rowsAffected: number;
    cached: boolean;
}

interface IndexRecommendation {
    table: string;
    columns: string[];
    reason: string;
    estimatedImprovement: string;
}

interface QueryCacheEntry {
    result: Response;
    timestamp: number;
    ttl: number;
    queryHash: string;
}

class QueryOptimizer {
    private queryMetrics: QueryMetrics[] = [];
    private queryCache = new Map<string, QueryCacheEntry>();
    private slowQueryThreshold = 100; // ms
    private readonly maxMetricsSize = 5000;
    private readonly maxCacheSize = 500;

    /**
     * Wrap database query with optimization
     */
    async optimizeQuery<T>(
        queryFn: () => Promise<T>,
        query: string,
        options: {
            cache?: boolean;
            cacheTtl?: number; // seconds
            tags?: string[];
        } = {}
    ): Promise<T> {
        const { cache = false, cacheTtl = 300, tags = [] } = options;
        const queryHash = this.hashQuery(query);
        const startTime = Date.now();

        // Check cache first
        if (cache) {
            const cached = this.getFromCache(queryHash);
            if (cached) {
                this.recordMetrics({
                    query,
                    executionTime: 0,
                    timestamp: Date.now(),
                    rowsAffected: 0,
                    cached: true
                });
                return cached.result;
            }
        }

        try {
            // Execute query
            const result = await queryFn();
            const executionTime = Date.now() - startTime;

            // Record metrics
            this.recordMetrics({
                query,
                executionTime,
                timestamp: Date.now(),
                rowsAffected: Array.isArray(result) ? result.length : 1,
                cached: false
            });

            // Cache result if enabled
            if (cache) {
                this.setCache(queryHash, result, cacheTtl);
            }

            // Log slow queries
            if (executionTime > this.slowQueryThreshold) {
                console.warn(`🐌 Slow query (${executionTime}ms): ${this.truncateQuery(query)}`);
            }

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Record failed query metrics
            this.recordMetrics({
                query,
                executionTime,
                timestamp: Date.now(),
                rowsAffected: 0,
                cached: false
            });

            throw error;
        }
    }

    /**
     * Get query performance statistics
     */
    getQueryStats(timeWindow = 3600000): {
        totalQueries: number;
        avgExecutionTime: number;
        slowQueries: number;
        cacheHitRate: number;
        mostExpensiveQueries: Array<{
            query: string;
            avgTime: number;
            count: number;
        }>;
    } {
        const cutoff = Date.now() - timeWindow;
        const recentMetrics = this.queryMetrics.filter(m => m.timestamp > cutoff);

        if (recentMetrics.length === 0) {
            return {
                totalQueries: 0,
                avgExecutionTime: 0,
                slowQueries: 0,
                cacheHitRate: 0,
                mostExpensiveQueries: []
            };
        }

        const executionTimes = recentMetrics.map(m => m.executionTime);
        const cacheHits = recentMetrics.filter(m => m.cached).length;
        const slowQueries = recentMetrics.filter(m => m.executionTime > this.slowQueryThreshold).length;

        // Group queries by normalized query string
        const queryGroups = new Map<string, { times: number[]; count: number }>();

        recentMetrics.forEach(metric => {
            const normalizedQuery = this.normalizeQuery(metric.query);
            if (!queryGroups.has(normalizedQuery)) {
                queryGroups.set(normalizedQuery, { times: [], count: 0 });
            }
            const group = queryGroups.get(normalizedQuery)!;
            group.times.push(metric.executionTime);
            group.count++;
        });

        // Find most expensive queries
        const mostExpensiveQueries = Array.from(queryGroups.entries())
            .map(([query, data]) => ({
                query: this.truncateQuery(query),
                avgTime: data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
                count: data.count
            }))
            .sort((a, b) => b.avgTime - a.avgTime)
            .slice(0, 10);

        return {
            totalQueries: recentMetrics.length,
            avgExecutionTime: executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length,
            slowQueries,
            cacheHitRate: (cacheHits / recentMetrics.length) * 100,
            mostExpensiveQueries
        };
    }

    /**
     * Generate index recommendations based on query patterns
     */
    generateIndexRecommendations(): IndexRecommendation[] {
        const recommendations: IndexRecommendation[] = [];
        const queryPatterns = this.analyzeQueryPatterns();

        // Analyze WHERE clauses for potential indexes
        queryPatterns.whereColumns.forEach(({ table, column, frequency }) => {
            if (frequency > 5) { // Column used in WHERE clause more than 5 times
                recommendations.push({
                    table,
                    columns: [column],
                    reason: `Column '${column}' frequently used in WHERE clauses (${frequency} times)`,
                    estimatedImprovement: 'High - significant query speed improvement expected'
                });
            }
        });

        // Analyze JOIN conditions
        queryPatterns.joinColumns.forEach(({ table, columns, frequency }) => {
            if (frequency > 3) {
                recommendations.push({
                    table,
                    columns,
                    reason: `Columns frequently used in JOIN conditions (${frequency} times)`,
                    estimatedImprovement: 'Medium - improved JOIN performance'
                });
            }
        });

        // Analyze ORDER BY clauses
        queryPatterns.orderByColumns.forEach(({ table, column, frequency }) => {
            if (frequency > 3) {
                recommendations.push({
                    table,
                    columns: [column],
                    reason: `Column '${column}' frequently used in ORDER BY (${frequency} times)`,
                    estimatedImprovement: 'Medium - faster sorting operations'
                });
            }
        });

        return recommendations;
    }

    /**
     * Invalidate cache by tags or patterns
     */
    invalidateCache(pattern?: string): number {
        let invalidated = 0;

        if (pattern) {
            // Invalidate by query pattern
            for (const [key, entry] of this.queryCache.entries()) {
                if (key.includes(pattern)) {
                    this.queryCache.delete(key);
                    invalidated++;
                }
            }
        } else {
            // Clear all cache
            invalidated = this.queryCache.size;
            this.queryCache.clear();
        }

        console.log(`🗑️ Invalidated ${invalidated} query cache entries`);
        return invalidated;
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        hitRate: number;
        memoryUsage: number;
    } {
        const hitRate = this.calculateCacheHitRate();
        const memoryUsage = JSON.stringify(Array.from(this.queryCache.entries())).length;

        return {
            size: this.queryCache.size,
            hitRate,
            memoryUsage
        };
    }

    /**
     * Record query metrics
     */
    private recordMetrics(metrics: QueryMetrics): void {
        this.queryMetrics.push(metrics);

        // Prevent metrics from growing too large
        if (this.queryMetrics.length > this.maxMetricsSize) {
            this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsSize / 2);
        }
    }

    /**
     * Hash query for caching
     */
    private hashQuery(query: string): string {
        // Simple hash function for query caching
        let hash = 0;
        for (let i = 0; i < query.length; i++) {
            const char = query.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * Get result from cache
     */
    private getFromCache(queryHash: string): QueryCacheEntry | null {
        const entry = this.queryCache.get(queryHash);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl * 1000) {
            this.queryCache.delete(queryHash);
            return null;
        }

        return entry;
    }

    /**
     * Set result in cache
     */
    private setCache(queryHash: string, result: Response, ttl: number): void {
        // Prevent cache from growing too large
        if (this.queryCache.size >= this.maxCacheSize) {
            this.evictOldestCacheEntries();
        }

        this.queryCache.set(queryHash, {
            result,
            timestamp: Date.now(),
            ttl,
            queryHash
        });
    }

    /**
     * Evict oldest cache entries
     */
    private evictOldestCacheEntries(): void {
        const entries = Array.from(this.queryCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove oldest 25% of entries
        const toRemove = Math.floor(entries.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
            this.queryCache.delete(entries[i][0]);
        }
    }

    /**
     * Calculate cache hit rate
     */
    private calculateCacheHitRate(): number {
        const recentMetrics = this.queryMetrics.slice(-1000); // Last 1000 queries
        if (recentMetrics.length === 0) {return 0;}

        const hits = recentMetrics.filter(m => m.cached).length;
        return (hits / recentMetrics.length) * 100;
    }

    /**
     * Normalize query for pattern analysis
     */
    private normalizeQuery(query: string): string {
        return query
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\$\d+/g, '?') // Replace parameters
            .replace(/\d+/g, 'N') // Replace numbers
            .replace(/'[^']*'/g, "'STRING'") // Replace string literals
            .toLowerCase()
            .trim();
    }

    /**
     * Truncate query for logging
     */
    private truncateQuery(query: string): string {
        return query.length > 100 ? query.substring(0, 100) + '...' : query;
    }

    /**
     * Analyze query patterns for index recommendations
     */
    private analyzeQueryPatterns(): {
        whereColumns: Array<{ table: string; column: string; frequency: number }>;
        joinColumns: Array<{ table: string; columns: string[]; frequency: number }>;
        orderByColumns: Array<{ table: string; column: string; frequency: number }>;
    } {
        const whereColumns = new Map<string, number>();
        const joinColumns = new Map<string, number>();
        const orderByColumns = new Map<string, number>();

        this.queryMetrics.forEach(metric => {
            const query = metric.query.toLowerCase();

            // Analyze WHERE clauses (simplified pattern matching)
            const whereMatches = query.match(/where\s+(\w+)\.(\w+)/g);
            whereMatches?.forEach(match => {
                const key = match.replace('where ', '');
                whereColumns.set(key, (whereColumns.get(key) || 0) + 1);
            });

            // Analyze JOIN conditions
            const joinMatches = query.match(/join\s+(\w+)\s+on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/g);
            joinMatches?.forEach(match => {
                joinColumns.set(match, (joinColumns.get(match) || 0) + 1);
            });

            // Analyze ORDER BY clauses
            const orderMatches = query.match(/order\s+by\s+(\w+)\.(\w+)/g);
            orderMatches?.forEach(match => {
                const key = match.replace('order by ', '');
                orderByColumns.set(key, (orderByColumns.get(key) || 0) + 1);
            });
        });

        return {
            whereColumns: Array.from(whereColumns.entries()).map(([key, frequency]) => {
                const [table, column] = key.split('.');
                return { table, column, frequency };
            }),
            joinColumns: Array.from(joinColumns.entries()).map(([key, frequency]) => {
                // Simplified parsing - in real implementation, use proper SQL parser
                return { table: 'unknown', columns: ['unknown'], frequency };
            }),
            orderByColumns: Array.from(orderByColumns.entries()).map(([key, frequency]) => {
                const [table, column] = key.split('.');
                return { table, column, frequency };
            })
        };
    }
}

// Export singleton instance
export const queryOptimizer = new QueryOptimizer();

export default queryOptimizer;