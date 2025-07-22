/**
 * Cache Monitoring Service
 *
 * Integrates cache performance monitoring with existing monitoring systems
 * Provides health checks, alerts, and automated responses
 */

import { EventEmitter } from 'node:events';
import { desc, gte } from 'drizzle-orm';
import { cacheMetrics } from '../../shared/schema';

import { db } from '../db';
import { getCacheStats, queryCache, searchCache, userCache } from '../middleware/queryCache';
import { metricsCollector } from '../cache/CacheMetrics';

import logger from '../utils/logger';
export interface CacheAlert {
  level: 'warning' | 'error' | 'critical';
  type: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface CacheHealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details: any;
}

export class CacheMonitoringService extends EventEmitter {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alertHistory: CacheAlert[] = [];

  // Alert thresholds
  private readonly THRESHOLDS = {
    MIN_HIT_RATE: 0.5, // 50%
    MAX_EVICTION_RATE: 0.2, // 20%
    MAX_RESPONSE_TIME: 100, // 100ms
    MIN_CACHE_EFFICIENCY: 0.7, // 70%
    MAX_MEMORY_USAGE: 500 * 1024 * 1024, // 500MB
  };

  constructor() {
    super();
    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    // Run health checks every minute
    this.healthCheckInterval = setInterval(() => {
      this.runHealthChecks().catch(error => {
        logger.error('Error running cache health checks:', error);
      });
    }, 60000);

    // Run initial check
    this.runHealthChecks().catch(console.error);
  }

  async runHealthChecks(): Promise<CacheHealthCheck[]> {
    const checks: CacheHealthCheck[] = [];

    // Check hit rate
    const hitRateCheck = await this.checkHitRate();
    checks.push(hitRateCheck);

    // Check eviction rate
    const evictionCheck = await this.checkEvictionRate();
    checks.push(evictionCheck);

    // Check response time
    const responseTimeCheck = await this.checkResponseTime();
    checks.push(responseTimeCheck);

    // Check memory usage
    const memoryCheck = await this.checkMemoryUsage();
    checks.push(memoryCheck);

    // Check cache efficiency
    const efficiencyCheck = await this.checkCacheEfficiency();
    checks.push(efficiencyCheck);

    // Emit health status
    this.emit('health-check', checks);

    // Process alerts
    for (const check of checks) {
      if (check.status !== 'healthy') {
        this.processHealthCheckAlert(check);
      }
    }

    return checks;
  }

  private async checkHitRate(): Promise<CacheHealthCheck> {
    const stats = getCacheStats();
    const hitRate = stats.hitRate;

    if (hitRate < this.THRESHOLDS.MIN_HIT_RATE) {
      return {
        name: 'Cache Hit Rate',
        status: hitRate < 0.3 ? 'unhealthy' : 'degraded',
        message: `Hit rate (${(hitRate * 100).toFixed(1)}%) is below threshold (${this.THRESHOLDS.MIN_HIT_RATE * 100}%)`,
        details: { hitRate, threshold: this.THRESHOLDS.MIN_HIT_RATE },
      };
    }

    return {
      name: 'Cache Hit Rate',
      status: 'healthy',
      message: `Hit rate is healthy at ${(hitRate * 100).toFixed(1)}%`,
      details: { hitRate },
    };
  }

  private async checkEvictionRate(): Promise<CacheHealthCheck> {
    const stats = getCacheStats();
    const totalSets = stats.hits + stats.misses; // Approximation
    const evictionRate = totalSets > 0 ? stats.evictions / totalSets : 0;

    if (evictionRate > this.THRESHOLDS.MAX_EVICTION_RATE) {
      return {
        name: 'Cache Eviction Rate',
        status: evictionRate > 0.3 ? 'unhealthy' : 'degraded',
        message: `Eviction rate (${(evictionRate * 100).toFixed(1)}%) exceeds threshold (${this.THRESHOLDS.MAX_EVICTION_RATE * 100}%)`,
        details: { evictionRate, threshold: this.THRESHOLDS.MAX_EVICTION_RATE },
      };
    }

    return {
      name: 'Cache Eviction Rate',
      status: 'healthy',
      message: `Eviction rate is healthy at ${(evictionRate * 100).toFixed(1)}%`,
      details: { evictionRate },
    };
  }

  private async checkResponseTime(): Promise<CacheHealthCheck> {
    const realTimeMetrics = metricsCollector.getRealTimeMetrics();
    const avgResponseTime = realTimeMetrics.avgResponseTime;

    if (avgResponseTime > this.THRESHOLDS.MAX_RESPONSE_TIME) {
      return {
        name: 'Cache Response Time',
        status: avgResponseTime > 200 ? 'unhealthy' : 'degraded',
        message: `Average response time (${avgResponseTime.toFixed(1)}ms) exceeds threshold (${this.THRESHOLDS.MAX_RESPONSE_TIME}ms)`,
        details: { avgResponseTime, threshold: this.THRESHOLDS.MAX_RESPONSE_TIME },
      };
    }

    return {
      name: 'Cache Response Time',
      status: 'healthy',
      message: `Response time is healthy at ${avgResponseTime.toFixed(1)}ms`,
      details: { avgResponseTime },
    };
  }

  private async checkMemoryUsage(): Promise<CacheHealthCheck> {
    const memoryUsage = process.memoryUsage().heapUsed;

    if (memoryUsage > this.THRESHOLDS.MAX_MEMORY_USAGE) {
      return {
        name: 'Cache Memory Usage',
        status: memoryUsage > this.THRESHOLDS.MAX_MEMORY_USAGE * 1.2 ? 'unhealthy' : 'degraded',
        message: `Memory usage (${(memoryUsage / 1024 / 1024).toFixed(1)}MB) exceeds threshold (${(this.THRESHOLDS.MAX_MEMORY_USAGE / 1024 / 1024).toFixed(1)}MB)`,
        details: { memoryUsage, threshold: this.THRESHOLDS.MAX_MEMORY_USAGE },
      };
    }

    return {
      name: 'Cache Memory Usage',
      status: 'healthy',
      message: `Memory usage is healthy at ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`,
      details: { memoryUsage },
    };
  }

  private async checkCacheEfficiency(): Promise<CacheHealthCheck> {
    // Calculate cache efficiency based on hit rate and eviction rate
    const stats = getCacheStats();
    const hitRate = stats.hitRate;
    const totalSets = stats.hits + stats.misses;
    const evictionRate = totalSets > 0 ? stats.evictions / totalSets : 0;

    // Efficiency = hit rate * (1 - eviction rate)
    const efficiency = hitRate * (1 - evictionRate);

    if (efficiency < this.THRESHOLDS.MIN_CACHE_EFFICIENCY) {
      return {
        name: 'Cache Efficiency',
        status: efficiency < 0.5 ? 'unhealthy' : 'degraded',
        message: `Cache efficiency (${(efficiency * 100).toFixed(1)}%) is below threshold (${this.THRESHOLDS.MIN_CACHE_EFFICIENCY * 100}%)`,
        details: {
          efficiency,
          hitRate,
          evictionRate,
          threshold: this.THRESHOLDS.MIN_CACHE_EFFICIENCY,
        },
      };
    }

    return {
      name: 'Cache Efficiency',
      status: 'healthy',
      message: `Cache efficiency is healthy at ${(efficiency * 100).toFixed(1)}%`,
      details: { efficiency, hitRate, evictionRate },
    };
  }

  private processHealthCheckAlert(check: CacheHealthCheck): void {
    const alert: CacheAlert = {
      level: check.status === 'unhealthy' ? 'critical' : 'warning',
      type: check.name,
      message: check.message,
      metric: check.name.toLowerCase().replace(/ /g, '_'),
      value: Object.values(check.details)[0] as number,
      threshold: check.details.threshold || 0,
      timestamp: new Date(),
    };

    this.alertHistory.push(alert);

    // Keep only last 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-500);
    }

    // Emit alert
    this.emit('alert', alert);

    // Take automated action for critical alerts
    if (alert.level === 'critical') {
      this.handleCriticalAlert(alert);
    }
  }

  private handleCriticalAlert(alert: CacheAlert): void {
    logger.error(`CRITICAL CACHE ALERT: ${alert.message}`);

    switch (alert.type) {
      case 'Cache Hit Rate':
        // Trigger cache warming
        logger.info('Triggering emergency cache warming...');
        this.emit('action', { type: 'warm-cache', reason: alert.message });
        break;

      case 'Cache Memory Usage':
        // Clear cold entries
        logger.info('Clearing cold cache entries...');
        this.emit('action', { type: 'clear-cold-entries', reason: alert.message });
        break;

      case 'Cache Eviction Rate':
        // Increase cache size temporarily
        logger.info('Recommending cache size increase...');
        this.emit('action', { type: 'increase-cache-size', reason: alert.message });
        break;
    }
  }

  async getAlertHistory(hours = 24): Promise<CacheAlert[]> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    return this.alertHistory.filter(alert => alert.timestamp > cutoff);
  }

  async generateHealthReport(): Promise<any> {
    const checks = await this.runHealthChecks();
    const stats = getCacheStats();

    // Get recent metrics from database
    const _endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 1);

    const recentMetrics = await db
      .select()
      .from(cacheMetrics)
      .where(gte(cacheMetrics.timestamp, startDate))
      .orderBy(desc(cacheMetrics.timestamp))
      .limit(60);

    return {
      timestamp: new Date(),
      overallHealth: this.calculateOverallHealth(checks),
      checks,
      currentStats: stats,
      recentAlerts: this.alertHistory.slice(-10),
      performanceTrends: this.analyzePerformanceTrends(recentMetrics),
      recommendations: this.generateRecommendations(checks, stats),
    };
  }

  private calculateOverallHealth(checks: CacheHealthCheck[]): string {
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    if (unhealthyCount > 0) {return 'unhealthy';}
    if (degradedCount > 1) {return 'degraded';}
    if (degradedCount === 1) {return 'warning';}
    return 'healthy';
  }

  private analyzePerformanceTrends(metrics: any[]): any {
    if (metrics.length < 2) {
      return { trending: 'stable', details: 'Insufficient data' };
    }

    // Analyze hit rate trend
    const hitRates = metrics.map(m => m.hitRate / 100); // Convert from stored format
    const avgHitRate = hitRates.reduce((a, b) => a + b, 0) / hitRates.length;
    const recentHitRate = hitRates.slice(0, 10).reduce((a, b) => a + b, 0) / 10;

    const hitRateTrend = recentHitRate > avgHitRate ? 'improving' : 'degrading';

    return {
      hitRateTrend,
      avgHitRate,
      recentHitRate,
      volatility: this.calculateVolatility(hitRates),
    };
  }

  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  private generateRecommendations(checks: CacheHealthCheck[], stats: any): string[] {
    const recommendations: string[] = [];

    // Based on health checks
    for (const check of checks) {
      if (check.status !== 'healthy') {
        switch (check.name) {
          case 'Cache Hit Rate':
            recommendations.push(
              'Consider implementing cache warming for frequently accessed data'
            );
            recommendations.push('Review cache key generation to ensure proper granularity');
            break;
          case 'Cache Eviction Rate':
            recommendations.push('Increase cache size limits to reduce evictions');
            recommendations.push('Implement tiered caching for different data priorities');
            break;
          case 'Cache Response Time':
            recommendations.push('Optimize cache key structure for faster lookups');
            recommendations.push('Consider using in-memory caching for hot data');
            break;
        }
      }
    }

    // Based on cache type analysis
    const cacheTypes = stats.cacheTypes;
    if (cacheTypes.query.hitRate < 0.6) {
      recommendations.push('Query cache has low hit rate - review query patterns');
    }
    if (cacheTypes.search.size > cacheTypes.search.maxItems * 0.9) {
      recommendations.push('Search cache is near capacity - consider increasing size');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Global monitoring service instance
export const cacheMonitor = new CacheMonitoringService();

// Export monitoring integration functions
export function setupCacheMonitoring(app: any): void {
  // Add monitoring middleware
  app.use('/api', (_req: any, res: any, next: any) => {
    // Add cache performance headers
    const stats = getCacheStats();
    res.set({
      'X-Cache-Hit-Rate': `${(stats.hitRate * 100).toFixed(1)}%`,
      'X-Cache-Response-Time': `${stats.averageResponseTime?.toFixed(1)}ms` || 'N/A',
    });
    next();
  });

  // Set up alert handlers
  cacheMonitor.on('alert', (alert: CacheAlert) => {
    logger.warn(`Cache Alert [${alert.level}]: ${alert.message}`);

    // Here you can integrate with external monitoring services
    // e.g., send to Datadog, New Relic, PagerDuty, etc.
  });

  cacheMonitor.on('action', (action: any) => {
    logger.info(`Cache Action: ${action.type} - ${action.reason}`);

    // Implement automated responses
    switch (action.type) {
      case 'warm-cache':
        // Trigger cache warming
        import('../middleware/queryCache').then(({ CacheWarming }) => {
          CacheWarming.warmAll().catch(console.error);
        });
        break;

      case 'clear-cold-entries':
        // Clear entries that haven't been accessed recently
        queryCache.cleanup();
        searchCache.cleanup();
        userCache.cleanup();
        break;
    }
  });
}

// Prometheus metrics export (optional)
export function getPrometheusMetrics(): string {
  const stats = getCacheStats();
  const health = cacheMonitor.calculateOverallHealth([]);

  return `
# HELP cache_hit_rate Cache hit rate
# TYPE cache_hit_rate gauge
cache_hit_rate ${stats.hitRate}

# HELP cache_hits_total Total number of cache hits
# TYPE cache_hits_total counter
cache_hits_total ${stats.hits}

# HELP cache_misses_total Total number of cache misses
# TYPE cache_misses_total counter
cache_misses_total ${stats.misses}

# HELP cache_evictions_total Total number of cache evictions
# TYPE cache_evictions_total counter
cache_evictions_total ${stats.evictions}

# HELP cache_health Cache health status (1=healthy, 0=unhealthy)
# TYPE cache_health gauge
cache_health ${health === 'healthy' ? 1 : 0}
`;
}
