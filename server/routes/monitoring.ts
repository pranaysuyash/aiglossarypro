/**
 * Error Monitoring and System Health Routes
 * Provides endpoints for monitoring application health and errors
 */

import type { Express, Request, Response } from 'express';
import { errorLogger, ErrorCategory } from '../middleware/errorHandler';
import { analyticsService } from '../services/analyticsService';
import { enhancedStorage as storage } from '../enhancedStorage';
// TODO: Phase 2 - Remove direct db usage after storage layer implementation
// import { db } from '../db';
// import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../middleware/adminAuth';

export function registerMonitoringRoutes(app: Express): void {

  /**
   * Get system health status
   * GET /api/monitoring/health
   */
  app.get('/api/monitoring/health', async (req: Request, res: Response) => {
    try {
      const healthChecks = {
        database: false,
        filesystem: false,
        memory: false,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

      // Check database connectivity
      try {
        // Use enhanced storage health check
        healthChecks.database = await storage.checkDatabaseHealth();
      } catch (dbError) {
        console.error('Database health check failed:', dbError);
      }

      // Check filesystem
      try {
        const logDir = path.join(process.cwd(), 'logs');
        fs.accessSync(logDir, fs.constants.R_OK | fs.constants.W_OK);
        healthChecks.filesystem = true;
      } catch (fsError) {
        console.error('Filesystem health check failed:', fsError);
      }

      // Check memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };
      
      // Consider memory healthy if heap usage is under 500MB
      healthChecks.memory = memUsageMB.heapUsed < 500;

      const overallHealth = healthChecks.database && healthChecks.filesystem && healthChecks.memory;

      res.json({
        success: true,
        healthy: overallHealth,
        checks: healthChecks,
        memory: memUsageMB,
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        healthy: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get recent errors (admin only)
   * GET /api/monitoring/errors?limit=50&category=DATABASE
   */
  app.get('/api/monitoring/errors', requireAdmin, async (req: Request, res: Response) => {
    try {

      const { limit = 50, category } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);

      let errors;
      if (category && Object.values(ErrorCategory).includes(category as ErrorCategory)) {
        errors = errorLogger.getErrorsByCategory(category as ErrorCategory, limitNum);
      } else {
        errors = errorLogger.getRecentErrors(limitNum);
      }

      const errorStats = errorLogger.getErrorStats();

      res.json({
        success: true,
        data: {
          errors,
          stats: errorStats,
          total: errors.length,
          categories: Object.values(ErrorCategory)
        }
      });

    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch error data'
      });
    }
  });

  /**
   * Get database performance metrics
   * GET /api/monitoring/database
   */
  app.get('/api/monitoring/database', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get comprehensive database metrics using enhanced storage
      const metrics = await storage.getDatabaseMetrics();
      const { tableStats, indexStats, connectionStats, queryPerformance } = metrics;

      res.json({
        success: true,
        data: {
          tableStats,
          indexStats,
          connectionStats,
          queryPerformance,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Database monitoring error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch database metrics'
      });
    }
  });

  /**
   * Get application metrics
   * GET /api/monitoring/metrics
   */
  app.get('/api/monitoring/metrics', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get term and category counts using storage layer
      const contentMetrics = await storage.getContentMetrics();
      
      const termCount = contentMetrics.totalTerms;
      const categoryCount = contentMetrics.totalCategories;
      
      // Get search metrics using enhanced storage
      const searchMetrics = await storage.getSearchMetrics('week');

      // Application metrics
      const metrics = {
        content: {
          total_terms: termCount,
          total_categories: categoryCount
        },
        system: {
          uptime_seconds: Math.floor(process.uptime()),
          uptime_readable: formatUptime(process.uptime()),
          memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          cpu_usage: process.cpuUsage(),
          node_version: process.version,
          environment: process.env.NODE_ENV || 'development'
        },
        search: searchMetrics,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      console.error('Metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch application metrics'
      });
    }
  });

  /**
   * Clear old error logs (admin only)
   * DELETE /api/monitoring/errors?days=30
   */
  app.delete('/api/monitoring/errors', requireAdmin, async (req: Request, res: Response) => {
    try {
      
      const { days = 30 } = req.query;
      const daysNum = parseInt(days as string) || 30;

      // Clear log files older than specified days
      const logDir = path.join(process.cwd(), 'logs');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysNum);

      let deletedFiles = 0;
      
      if (fs.existsSync(logDir)) {
        const files = fs.readdirSync(logDir);
        
        for (const file of files) {
          if (file.startsWith('errors_') && file.endsWith('.log')) {
            const filePath = path.join(logDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < cutoffDate) {
              fs.unlinkSync(filePath);
              deletedFiles++;
            }
          }
        }
      }

      res.json({
        success: true,
        message: `Cleared ${deletedFiles} old log files`,
        deleted_files: deletedFiles,
        cutoff_date: cutoffDate.toISOString()
      });

    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear old logs'
      });
    }
  });

  /**
   * Get comprehensive analytics dashboard
   * GET /api/monitoring/analytics/dashboard?timeframe=week
   */
  app.get('/api/monitoring/analytics/dashboard', requireAdmin, async (req: Request, res: Response) => {
    try {
      const timeframe = req.query.timeframe as 'day' | 'week' | 'month' | 'year' || 'week';
      const dashboardData = await analyticsService.getDashboardData(timeframe);
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      errorLogger.logError(error as Error, req, ErrorCategory.API_ERROR, 'medium');
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics dashboard'
      });
    }
  });

  /**
   * Get search insights and optimization suggestions
   * GET /api/monitoring/analytics/search-insights
   */
  app.get('/api/monitoring/analytics/search-insights', requireAdmin, async (req: Request, res: Response) => {
    try {
      const insights = await analyticsService.getSearchInsights();
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      errorLogger.logError(error as Error, req, ErrorCategory.API_ERROR, 'medium');
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve search insights'
      });
    }
  });

  /**
   * Get real-time system metrics
   * GET /api/monitoring/metrics/realtime
   */
  app.get('/api/monitoring/metrics/realtime', requireAdmin, async (req: Request, res: Response) => {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const metrics = {
        timestamp: new Date().toISOString(),
        memory: {
          heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external_mb: Math.round(memoryUsage.external / 1024 / 1024),
          rss_mb: Math.round(memoryUsage.rss / 1024 / 1024)
        },
        cpu: {
          user_ms: cpuUsage.user / 1000,
          system_ms: cpuUsage.system / 1000
        },
        uptime_seconds: process.uptime(),
        pid: process.pid,
        node_version: process.version
      };
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      errorLogger.logError(error as Error, req, ErrorCategory.API_ERROR, 'medium');
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve real-time metrics'
      });
    }
  });
}

/**
 * Helper function to format uptime in readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}