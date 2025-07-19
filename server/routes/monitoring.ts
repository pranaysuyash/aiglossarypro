import { Router } from 'express';
import { monitoringService } from '../monitoring/monitoringService';
import { log } from '../utils/logger';

const router = Router();

/**
 * Get current system health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = monitoringService.getHealthStatus();
    const metrics = await monitoringService.getCurrentMetrics();

    res.json({
      ...health,
      timestamp: new Date(),
      metrics: {
        memory: metrics.memory,
        api: metrics.api,
        database: metrics.database,
      },
    });
  } catch (error) {
    log.error('Failed to get health status', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ error: 'Failed to get health status' });
  }
});

/**
 * Get current system metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await monitoringService.getCurrentMetrics();
    res.json(metrics);
  } catch (error) {
    log.error('Failed to get current metrics', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * Get historical metrics
 */
router.get('/metrics/history', (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const metrics = monitoringService.getHistoricalMetrics(hours);

    res.json({
      metrics,
      period: `${hours} hours`,
      count: metrics.length,
    });
  } catch (error) {
    log.error('Failed to get historical metrics', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ error: 'Failed to get historical metrics' });
  }
});

/**
 * Get active alerts
 */
router.get('/alerts', (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const hours = parseInt(req.query.hours as string) || 24;

    const alerts = activeOnly
      ? monitoringService.getActiveAlerts()
      : monitoringService.getAllAlerts(hours);

    res.json({
      alerts,
      count: alerts.length,
      active: alerts.filter(a => !a.resolved).length,
    });
  } catch (error) {
    log.error('Failed to get alerts', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * Get monitoring dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const health = monitoringService.getHealthStatus();
    const currentMetrics = await monitoringService.getCurrentMetrics();
    const historicalMetrics = monitoringService.getHistoricalMetrics(24);
    const activeAlerts = monitoringService.getActiveAlerts();

    // Calculate trends
    const trends = calculateTrends(historicalMetrics);

    res.json({
      health,
      currentMetrics,
      trends,
      alerts: {
        active: activeAlerts,
        count: activeAlerts.length,
        bySeverity: activeAlerts.reduce((acc, alert) => {
          acc[alert.config.severity] = (acc[alert.config.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      uptime: process.uptime(),
      timestamp: new Date(),
    });
  } catch (error) {
    log.error('Failed to get dashboard data', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * Resolve an alert
 */
router.post('/alerts/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const alerts = monitoringService.getAllAlerts();
    const alert = alerts.find(a => a.id === alertId);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (alert.resolved) {
      return res.status(400).json({ error: 'Alert already resolved' });
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    log.info('Alert resolved', { alertId, name: alert.config.name });

    res.json({ message: 'Alert resolved', alert });
  } catch (error) {
    log.error('Failed to resolve alert', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

/**
 * Get performance metrics for specific endpoints
 */
router.get('/performance/:endpoint', (req, res) => {
  try {
    const { endpoint } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;

    // In a real implementation, you'd filter metrics by endpoint
    const metrics = monitoringService.getHistoricalMetrics(hours);

    const performanceData = {
      endpoint,
      period: `${hours} hours`,
      averageResponseTime: metrics.reduce((sum, m) => sum + m.api.averageResponseTime, 0) / metrics.length,
      errorRate: metrics.reduce((sum, m) => sum + m.api.errorRate, 0) / metrics.length,
      requestCount: metrics.reduce((sum, m) => sum + m.api.requestCount, 0),
      trends: calculateAPITrends(metrics),
    };

    res.json(performanceData);
  } catch (error) {
    log.error('Failed to get performance metrics', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// Helper functions

function calculateTrends(metrics: any[]) {
  if (metrics.length < 2) {
    return {
      memory: 'stable',
      api: 'stable',
      errors: 'stable',
    };
  }

  const recent = metrics.slice(-6); // Last 6 data points
  const older = metrics.slice(-12, -6); // Previous 6 data points

  const recentAvg = {
    memory: recent.reduce((sum, m) => sum + m.memory.percentage, 0) / recent.length,
    apiResponse: recent.reduce((sum, m) => sum + m.api.averageResponseTime, 0) / recent.length,
    errors: recent.reduce((sum, m) => sum + m.errors.total, 0) / recent.length,
  };

  const olderAvg = {
    memory: older.reduce((sum, m) => sum + m.memory.percentage, 0) / older.length,
    apiResponse: older.reduce((sum, m) => sum + m.api.averageResponseTime, 0) / older.length,
    errors: older.reduce((sum, m) => sum + m.errors.total, 0) / older.length,
  };

  return {
    memory: getTrend(recentAvg.memory, olderAvg.memory),
    api: getTrend(olderAvg.apiResponse, recentAvg.apiResponse), // Lower is better for response time
    errors: getTrend(olderAvg.errors, recentAvg.errors), // Lower is better for errors
  };
}

function calculateAPITrends(metrics: any[]) {
  if (metrics.length < 2) return [];

  return metrics.map((metric, index) => ({
    timestamp: metric.timestamp,
    responseTime: metric.api.averageResponseTime,
    errorRate: metric.api.errorRate,
    requestCount: metric.api.requestCount,
  }));
}

function getTrend(current: number, previous: number): 'improving' | 'stable' | 'degrading' {
  const change = ((current - previous) / previous) * 100;

  if (Math.abs(change) < 5) return 'stable';
  return change > 0 ? 'degrading' : 'improving';
}

export default router;