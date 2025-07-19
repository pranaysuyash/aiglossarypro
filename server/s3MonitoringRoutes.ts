import { Router } from 'express';
import { mockIsAuthenticated } from './middleware/dev/mockAuth';
import { type AlertRule, getS3MonitoringService } from './s3MonitoringService';

import logger from './utils/logger';
const router = Router();
const monitoringService = getS3MonitoringService();

// Get comprehensive metrics
router.get('/metrics', mockIsAuthenticated, async (_req, res) => {
  try {
    const metrics = monitoringService.generateMetrics();
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate metrics',
    });
  }
});

// Get recent logs
router.get('/logs', mockIsAuthenticated, async (req, res) => {
  try {
    const { limit = 100, operation } = req.query;

    const logs = monitoringService.getRecentLogs(parseInt(limit as string), operation as string);

    res.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch logs',
    });
  }
});

// Get logs by date range
router.get('/logs/range', mockIsAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    const logs = monitoringService.getLogsByDateRange(start, end);

    res.json({
      success: true,
      logs,
      total: logs.length,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching logs by date range:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch logs',
    });
  }
});

// Export logs
router.get('/logs/export', mockIsAuthenticated, async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    let dateRange;
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        dateRange = { start, end };
      }
    }

    const exportData = monitoringService.exportLogs(format as 'json' | 'csv', dateRange);

    const filename = `s3-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(exportData);
  } catch (error) {
    logger.error('Error exporting logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export logs',
    });
  }
});

// Get alerts
router.get('/alerts', mockIsAuthenticated, async (_req, res) => {
  try {
    const alerts = monitoringService.getAlerts();
    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch alerts',
    });
  }
});

// Add new alert
router.post('/alerts', mockIsAuthenticated, async (req, res) => {
  try {
    const alertData: Omit<AlertRule, 'id'> = req.body;

    // Validate required fields
    if (!alertData.name || !alertData.type || typeof alertData.threshold !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, threshold',
      });
    }

    const alertId = monitoringService.addAlert(alertData);

    res.json({
      success: true,
      alertId,
      message: 'Alert created successfully',
    });
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create alert',
    });
  }
});

// Update alert
router.put('/alerts/:id', mockIsAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const updates: Partial<AlertRule> = req.body;

    const success = monitoringService.updateAlert(id, updates);

    if (success) {
      res.json({
        success: true,
        message: 'Alert updated successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }
  } catch (error) {
    logger.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update alert',
    });
  }
});

// Delete alert
router.delete('/alerts/:id', mockIsAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const success = monitoringService.deleteAlert(id);

    if (success) {
      res.json({
        success: true,
        message: 'Alert deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }
  } catch (error) {
    logger.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete alert',
    });
  }
});

// Real-time metrics endpoint (for dashboards)
router.get('/metrics/realtime', mockIsAuthenticated, async (_req, res) => {
  try {
    const metrics = monitoringService.generateMetrics();

    // Get recent activity (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentLogs = monitoringService.getLogsByDateRange(oneHourAgo, new Date());

    const realtimeData = {
      currentTime: new Date().toISOString(),
      activeOperations: recentLogs.filter(log => log.status === 'started').length,
      recentActivity: {
        lastHour: recentLogs.length,
        successful: recentLogs.filter(log => log.status === 'success').length,
        failed: recentLogs.filter(log => log.status === 'error').length,
      },
      systemHealth: {
        errorRate: metrics.errors.errorRate,
        averageResponseTime: metrics.performance.averageUploadTime,
        status:
          metrics.errors.errorRate > 10
            ? 'warning'
            : metrics.errors.errorRate > 5
              ? 'caution'
              : 'healthy',
      },
      topOperations: Object.entries(metrics.operations.byOperation)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([operation, count]) => ({ operation, count })),
    };

    res.json({
      success: true,
      data: realtimeData,
    });
  } catch (error) {
    logger.error('Error generating realtime metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate realtime metrics',
    });
  }
});

// Performance analytics
router.get('/analytics/performance', mockIsAuthenticated, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysCount = parseInt(days as string);

    const startDate = new Date(Date.now() - daysCount * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const logs = monitoringService.getLogsByDateRange(startDate, endDate);

    // Group by day
    const dailyPerformance: Record<
      string,
      {
        date: string;
        operations: number;
        averageDuration: number;
        errors: number;
        dataTransferred: number;
      }
    > = {};

    logs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];

      if (!dailyPerformance[date]) {
        dailyPerformance[date] = {
          date,
          operations: 0,
          averageDuration: 0,
          errors: 0,
          dataTransferred: 0,
        };
      }

      const day = dailyPerformance[date];
      day.operations++;

      if (log.duration) {
        day.averageDuration =
          (day.averageDuration * (day.operations - 1) + log.duration) / day.operations;
      }

      if (log.status === 'error') {
        day.errors++;
      }

      if (log.fileSize) {
        day.dataTransferred += log.fileSize;
      }
    });

    const performanceData = Object.values(dailyPerformance).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.json({
      success: true,
      data: performanceData,
      summary: {
        totalOperations: logs.length,
        averageOperationsPerDay: logs.length / daysCount,
        totalDataTransferred: logs.reduce((sum, log) => sum + (log.fileSize || 0), 0),
        overallErrorRate:
          logs.length > 0
            ? (logs.filter(log => log.status === 'error').length / logs.length) * 100
            : 0,
      },
    });
  } catch (error) {
    logger.error('Error generating performance analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate performance analytics',
    });
  }
});

// Usage analytics
router.get('/analytics/usage', mockIsAuthenticated, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysCount = parseInt(days as string);

    const startDate = new Date(Date.now() - daysCount * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const logs = monitoringService.getLogsByDateRange(startDate, endDate);

    // Analyze usage patterns
    const usageAnalytics = {
      operationTypes: logs.reduce(
        (acc, log) => {
          acc[log.operation] = (acc[log.operation] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),

      hourlyDistribution: logs.reduce(
        (acc, log) => {
          const hour = log.timestamp.getHours();
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      ),

      dailyDistribution: logs.reduce(
        (acc, log) => {
          const day = log.timestamp.getDay(); // 0 = Sunday
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      ),

      fileSizeDistribution: {
        small: logs.filter(log => (log.fileSize || 0) < 1024 * 1024).length, // < 1MB
        medium: logs.filter(log => {
          const size = log.fileSize || 0;
          return size >= 1024 * 1024 && size < 10 * 1024 * 1024;
        }).length, // 1MB - 10MB
        large: logs.filter(log => {
          const size = log.fileSize || 0;
          return size >= 10 * 1024 * 1024 && size < 100 * 1024 * 1024;
        }).length, // 10MB - 100MB
        xlarge: logs.filter(log => (log.fileSize || 0) >= 100 * 1024 * 1024).length, // > 100MB
      },

      topUsers: logs.reduce(
        (acc, log) => {
          if (log.userId) {
            acc[log.userId] = (acc[log.userId] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    res.json({
      success: true,
      data: usageAnalytics,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: daysCount,
      },
    });
  } catch (error) {
    logger.error('Error generating usage analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate usage analytics',
    });
  }
});

export default router;
