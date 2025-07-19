/**
 * Cache Analytics API Routes
 *
 * Provides endpoints for cache performance monitoring and analytics
 */

import { Router } from 'express';
import { z } from 'zod';
import { metricsCollector } from '../cache/CacheMetrics';
import { queryCache, searchCache, userCache } from '../middleware/queryCache';
import { validateRequest } from '../middleware/validateRequest';

import logger from '../utils/logger';
const router = Router();

// Get current cache statistics
router.get('/stats', (_req, res) => {
  const stats = {
    query: queryCache.getStats(),
    search: searchCache.getStats(),
    user: userCache.getStats(),
    combined: {
      totalHits:
        queryCache.getStats().hitCount +
        searchCache.getStats().hitCount +
        userCache.getStats().hitCount,
      totalMisses:
        queryCache.getStats().missCount +
        searchCache.getStats().missCount +
        userCache.getStats().missCount,
      totalSize:
        queryCache.getStats().size + searchCache.getStats().size + userCache.getStats().size,
      overallHitRate: 0,
    },
  };

  const totalRequests = stats.combined.totalHits + stats.combined.totalMisses;
  stats.combined.overallHitRate = totalRequests > 0 ? stats.combined.totalHits / totalRequests : 0;

  res.json(stats);
});

// Get real-time metrics
router.get('/real-time', (_req, res) => {
  const metrics = metricsCollector.getRealTimeMetrics();
  res.json(metrics);
});

// Get cache health status
router.get('/health', (_req, res) => {
  const queryStats = queryCache.getStats();
  const health = metricsCollector.getHealthStatus(queryStats);

  res.status(health.healthy ? 200 : 503).json(health);
});

// Get historical metrics
const historicalMetricsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  cacheType: z.enum(['query', 'search', 'user']).optional(),
  interval: z.enum(['minute', 'hour', 'day']).optional(),
});

router.get(
  '/historical',
  validateRequest({
    query: historicalMetricsSchema,
  }),
  async (req, res) => {
    try {
      const { startDate, endDate, cacheType, interval } = req.query as any;

      let metrics;
      if (interval) {
        metrics = await metricsCollector.getAggregatedMetrics(
          interval,
          new Date(startDate),
          new Date(endDate)
        );
      } else {
        metrics = await metricsCollector.getHistoricalMetrics(
          new Date(startDate),
          new Date(endDate),
          cacheType
        );
      }

      res.json({ metrics });
    } catch (error) {
      logger.error('Error fetching historical metrics:', error);
      res.status(500).json({ error: 'Failed to fetch historical metrics' });
    }
  }
);

// Get top performing and underperforming cache keys
router.get('/key-analysis', async (_req, res) => {
  const snapshot = metricsCollector.generateSnapshot();

  res.json({
    hotKeys: snapshot.hotKeys,
    coldKeys: snapshot.coldKeys,
    totalKeys: snapshot.keyCount,
    recommendations: generateKeyRecommendations(snapshot.hotKeys, snapshot.coldKeys),
  });
});

// Get cache performance report
router.get('/report', async (_req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24); // Last 24 hours

    const hourlyMetrics = await metricsCollector.getAggregatedMetrics('hour', startDate, endDate);
    const currentStats = {
      query: queryCache.getStats(),
      search: searchCache.getStats(),
      user: userCache.getStats(),
    };

    const health = metricsCollector.getHealthStatus(currentStats.query);
    const snapshot = metricsCollector.generateSnapshot();

    const report = {
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      summary: {
        avgHitRate: calculateAverage(hourlyMetrics, 'avgHitRate'),
        totalHits: sumValues(hourlyMetrics, 'totalHits'),
        totalMisses: sumValues(hourlyMetrics, 'totalMisses'),
        avgResponseTime: calculateAverage(hourlyMetrics, 'avgResponseTime'),
        peakCacheSize: Math.max(...hourlyMetrics.map((m: any) => m.maxCacheSize || 0)),
      },
      currentStatus: currentStats,
      health,
      trends: analyzeTrends(hourlyMetrics),
      keyAnalysis: {
        hotKeys: snapshot.hotKeys.slice(0, 5),
        coldKeys: snapshot.coldKeys.slice(0, 5),
      },
      recommendations: generateRecommendations(hourlyMetrics, currentStats, health),
    };

    res.json(report);
  } catch (error) {
    logger.error('Error generating cache report:', error);
    res.status(500).json({ error: 'Failed to generate cache report' });
  }
});

// Clear cache with metrics tracking
router.post('/clear', async (req, res) => {
  const { cacheType } = req.body;

  try {
    let clearedCount = 0;

    switch (cacheType) {
      case 'query':
        clearedCount = queryCache.getStats().size;
        queryCache.invalidateAll();
        break;
      case 'search':
        clearedCount = searchCache.getStats().size;
        searchCache.invalidateAll();
        break;
      case 'user':
        clearedCount = userCache.getStats().size;
        userCache.invalidateAll();
        break;
      case 'all':
        clearedCount =
          queryCache.getStats().size + searchCache.getStats().size + userCache.getStats().size;
        queryCache.invalidateAll();
        searchCache.invalidateAll();
        userCache.invalidateAll();
        break;
      default:
        return res.status(400).json({ error: 'Invalid cache type' });
    }

    res.json({
      success: true,
      clearedCount,
      message: `Cleared ${clearedCount} entries from ${cacheType} cache`,
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Helper functions
function calculateAverage(metrics: any[], field: string): number {
  if (metrics.length === 0) {return 0;}
  const sum = metrics.reduce((acc, m) => acc + (m[field] || 0), 0);
  return sum / metrics.length;
}

function sumValues(metrics: any[], field: string): number {
  return metrics.reduce((acc, m) => acc + (m[field] || 0), 0);
}

function analyzeTrends(metrics: any[]): any {
  if (metrics.length < 2) {return { improving: false, degrading: false };}

  const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
  const secondHalf = metrics.slice(Math.floor(metrics.length / 2));

  const firstHalfHitRate = calculateAverage(firstHalf, 'avgHitRate');
  const secondHalfHitRate = calculateAverage(secondHalf, 'avgHitRate');

  return {
    hitRateTrend: secondHalfHitRate > firstHalfHitRate ? 'improving' : 'degrading',
    hitRateChange: `${(((secondHalfHitRate - firstHalfHitRate) / firstHalfHitRate) * 100).toFixed(1)}%`,
    responseTimeTrend:
      calculateAverage(secondHalf, 'avgResponseTime') <
      calculateAverage(firstHalf, 'avgResponseTime')
        ? 'improving'
        : 'degrading',
  };
}

function generateKeyRecommendations(hotKeys: any[], coldKeys: any[]): string[] {
  const recommendations: string[] = [];

  if (hotKeys.length > 0 && hotKeys[0].hits > 100) {
    recommendations.push('Consider implementing dedicated caching for frequently accessed keys');
  }

  if (coldKeys.length > 5) {
    recommendations.push('Implement TTL-based eviction to remove stale entries');
  }

  return recommendations;
}

function generateRecommendations(metrics: any[], currentStats: any, health: any): string[] {
  const recommendations: string[] = [...health.recommendations];

  // Add metric-based recommendations
  const avgHitRate = calculateAverage(metrics, 'avgHitRate');
  if (avgHitRate < 0.5) {
    recommendations.push(
      'Very low hit rate detected. Review cache key generation and TTL settings'
    );
  }

  const totalSize = currentStats.query.size + currentStats.search.size + currentStats.user.size;
  const totalMax =
    currentStats.query.maxItems + currentStats.search.maxItems + currentStats.user.maxItems;

  if (totalSize > totalMax * 0.9) {
    recommendations.push('Caches are near capacity. Consider increasing size limits');
  }

  return [...new Set(recommendations)]; // Remove duplicates
}

export default router;
