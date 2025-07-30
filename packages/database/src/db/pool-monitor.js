"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoredPool = void 0;
exports.createMonitoredPool = createMonitoredPool;
const events_1 = require("events");
const serverless_1 = require("@neondatabase/serverless");
// Simple logger for now
const logger = {
    info: (...args) => console.log('[pool-monitor]', ...args),
    warn: (...args) => console.warn('[pool-monitor]', ...args),
    error: (...args) => console.error('[pool-monitor]', ...args),
};
class MonitoredPool extends serverless_1.Pool {
    constructor(config) {
        super(config);
        this.acquireTimes = [];
        this.maxAcquireTimeSamples = 100;
        this.stats = {
            totalConnections: 0,
            idleConnections: 0,
            waitingRequests: 0,
            totalCreated: 0,
            totalDestroyed: 0,
            avgAcquireTime: 0,
            peakConnections: 0,
            lastActivity: new Date()
        };
        this.connectionMetrics = new Map();
        this.metricsEmitter = new events_1.EventEmitter();
        this.setupEventHandlers();
        this.startMonitoring();
    }
    setupEventHandlers() {
        // Track connection creation
        this.on('connect', (client) => {
            this.stats.totalCreated++;
            this.stats.totalConnections++;
            this.stats.lastActivity = new Date();
            if (this.stats.totalConnections > this.stats.peakConnections) {
                this.stats.peakConnections = this.stats.totalConnections;
            }
            this.connectionMetrics.set(client, {
                queryCount: 0,
                totalQueryTime: 0,
                errors: 0
            });
            logger.info('Pool connection created', {
                totalConnections: this.stats.totalConnections,
                peakConnections: this.stats.peakConnections
            });
        });
        // Track connection destruction
        this.on('remove', (client) => {
            this.stats.totalDestroyed++;
            this.stats.totalConnections--;
            this.stats.lastActivity = new Date();
            const metrics = this.connectionMetrics.get(client);
            if (metrics) {
                logger.info('Connection removed', {
                    queryCount: metrics.queryCount,
                    avgQueryTime: metrics.queryCount > 0 ? metrics.totalQueryTime / metrics.queryCount : 0,
                    errors: metrics.errors
                });
                this.connectionMetrics.delete(client);
            }
        });
        // Track acquire events
        this.on('acquire', (client) => {
            const metrics = this.connectionMetrics.get(client);
            if (metrics && metrics.acquireStartTime) {
                metrics.acquireEndTime = Date.now();
                const acquireTime = metrics.acquireEndTime - metrics.acquireStartTime;
                this.acquireTimes.push(acquireTime);
                if (this.acquireTimes.length > this.maxAcquireTimeSamples) {
                    this.acquireTimes.shift();
                }
                this.stats.avgAcquireTime = this.calculateAverage(this.acquireTimes);
                this.stats.lastActivity = new Date();
                if (acquireTime > 1000) {
                    logger.warn('Slow connection acquire', {
                        acquireTime,
                        waitingRequests: this.stats.waitingRequests
                    });
                }
            }
        });
        // Track errors
        this.on('error', (err, client) => {
            const metrics = this.connectionMetrics.get(client);
            if (metrics) {
                metrics.errors++;
            }
            logger.error('Pool error', {
                error: err.message,
                totalConnections: this.stats.totalConnections
            });
        });
    }
    calculateAverage(values) {
        if (values.length === 0) {
            return 0;
        }
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    startMonitoring() {
        // Emit metrics every 30 seconds
        this.monitoringInterval = setInterval(() => {
            this.emitMetrics();
        }, 30000);
    }
    emitMetrics() {
        const metrics = {
            ...this.stats,
            healthStatus: this.getHealthStatus()
        };
        this.metricsEmitter.emit('metrics', metrics);
        // Log if there are concerning patterns
        if (this.stats.waitingRequests > 10) {
            logger.warn('High number of waiting requests', metrics);
        }
        if (this.stats.avgAcquireTime > 500) {
            logger.warn('High average acquire time', metrics);
        }
    }
    getHealthStatus() {
        if (this.stats.waitingRequests > 20 || this.stats.avgAcquireTime > 1000) {
            return 'critical';
        }
        if (this.stats.waitingRequests > 10 || this.stats.avgAcquireTime > 500) {
            return 'degraded';
        }
        return 'healthy';
    }
    getStats() {
        return {
            ...this.stats,
            healthStatus: this.getHealthStatus()
        };
    }
    onMetrics(callback) {
        this.metricsEmitter.on('metrics', callback);
    }
    async connect() {
        const metrics = {
            acquireStartTime: Date.now(),
            queryCount: 0,
            totalQueryTime: 0,
            errors: 0
        };
        this.stats.waitingRequests++;
        try {
            const client = await super.connect();
            this.stats.waitingRequests--;
            this.connectionMetrics.set(client, metrics);
            // Wrap query method to track metrics
            const originalQuery = client.query;
            const connectionMetrics = this.connectionMetrics;
            client.query = async (...args) => {
                const queryStart = Date.now();
                const clientMetrics = connectionMetrics.get(client);
                try {
                    const result = await originalQuery.call(client, ...args);
                    if (clientMetrics) {
                        clientMetrics.queryCount++;
                        clientMetrics.totalQueryTime += Date.now() - queryStart;
                    }
                    return result;
                }
                catch (error) {
                    if (clientMetrics) {
                        clientMetrics.errors++;
                    }
                    throw error;
                }
            };
            return client;
        }
        catch (error) {
            this.stats.waitingRequests--;
            throw error;
        }
    }
    async end() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        logger.info('Pool shutting down', this.getStats());
        await super.end();
    }
    // Utility method for dynamic pool size adjustment based on load
    getRecommendedPoolSize() {
        const baseMin = 2;
        const baseMax = 10;
        // Adjust based on peak usage
        const recommendedMax = Math.max(baseMax, Math.ceil(this.stats.peakConnections * 1.2));
        // Ensure min is reasonable
        const recommendedMin = Math.min(baseMin, Math.floor(recommendedMax * 0.3));
        return {
            min: recommendedMin,
            max: Math.min(recommendedMax, 50) // Cap at 50 connections
        };
    }
}
exports.MonitoredPool = MonitoredPool;
// Export a factory function for creating monitored pools
function createMonitoredPool(config) {
    const pool = new MonitoredPool(config);
    // Log metrics periodically
    pool.onMetrics((metrics) => {
        logger.info('Connection pool metrics', metrics);
    });
    return pool;
}
//# sourceMappingURL=pool-monitor.js.map