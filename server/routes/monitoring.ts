/**
 * Error Monitoring and System Health Routes
 * Provides endpoints for monitoring application health and errors
 */

import type { Express, Request, Response } from 'express';
import { errorLogger, ErrorCategory } from '../middleware/errorHandler';
import { analyticsService } from '../services/analyticsService';
import { enhancedStorage as storage } from '../enhancedStorage';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../middleware/adminAuth';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import OpenAI from 'openai';

/**
 * Health check helper functions
 */
async function checkS3Health(): Promise<{ healthy: boolean; message: string; responseTime?: number }> {
  const start = Date.now();
  
  try {
    if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_REGION) {
      return {
        healthy: false,
        message: 'S3 configuration missing (bucket name or region)'
      };
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    // Test bucket access
    await s3Client.send(new HeadBucketCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME
    }));

    const responseTime = Date.now() - start;
    return {
      healthy: true,
      message: 'S3 bucket accessible',
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      healthy: false,
      message: `S3 health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime
    };
  }
}

async function checkOpenAIHealth(): Promise<{ healthy: boolean; message: string; responseTime?: number }> {
  const start = Date.now();
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        healthy: false,
        message: 'OpenAI API key not configured'
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Test with a minimal request to check API connectivity
    await openai.models.list();

    const responseTime = Date.now() - start;
    return {
      healthy: true,
      message: 'OpenAI API accessible',
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    let message = 'OpenAI API check failed';
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        message = 'OpenAI API key invalid or unauthorized';
      } else if (error.message.includes('429')) {
        message = 'OpenAI API rate limit exceeded';
      } else if (error.message.includes('timeout')) {
        message = 'OpenAI API timeout';
      } else {
        message = `OpenAI API error: ${error.message}`;
      }
    }
    
    return {
      healthy: false,
      message,
      responseTime
    };
  }
}

export function registerMonitoringRoutes(app: Express): void {

  /**
   * Get system health status
   * GET /api/monitoring/health?extended=true
   */
  app.get('/api/monitoring/health', async (req: Request, res: Response) => {
    try {
      const { extended } = req.query;
      const includeExtended = extended === 'true';
      
      const healthChecks = {
        database: false,
        filesystem: false,
        memory: false,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

      const externalServices: Record<string, any> = {};
      const responseTimes: Record<string, number> = {};

      // Check database connectivity
      try {
        const dbStart = Date.now();
        healthChecks.database = await storage.checkDatabaseHealth();
        responseTimes.database = Date.now() - dbStart;
      } catch (dbError) {
        console.error('Database health check failed:', dbError);
        responseTimes.database = -1;
      }

      // Check filesystem
      try {
        const fsStart = Date.now();
        const logDir = path.join(process.cwd(), 'logs');
        fs.accessSync(logDir, fs.constants.R_OK | fs.constants.W_OK);
        healthChecks.filesystem = true;
        responseTimes.filesystem = Date.now() - fsStart;
      } catch (fsError) {
        console.error('Filesystem health check failed:', fsError);
        responseTimes.filesystem = -1;
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

      // Extended health checks (S3 and AI services)
      if (includeExtended) {
        // Check S3 connectivity
        try {
          const s3Health = await checkS3Health();
          externalServices.s3 = s3Health;
          if (s3Health.responseTime) {
            responseTimes.s3 = s3Health.responseTime;
          }
        } catch (s3Error) {
          console.error('S3 health check failed:', s3Error);
          externalServices.s3 = {
            healthy: false,
            message: 'S3 health check error'
          };
        }

        // Check OpenAI connectivity  
        try {
          const openaiHealth = await checkOpenAIHealth();
          externalServices.openai = openaiHealth;
          if (openaiHealth.responseTime) {
            responseTimes.openai = openaiHealth.responseTime;
          }
        } catch (aiError) {
          console.error('OpenAI health check failed:', aiError);
          externalServices.openai = {
            healthy: false,
            message: 'OpenAI health check error'
          };
        }
      }

      const coreHealth = healthChecks.database && healthChecks.filesystem && healthChecks.memory;
      
      // Overall health includes external services if extended check
      let overallHealth = coreHealth;
      if (includeExtended && Object.keys(externalServices).length > 0) {
        const externalHealthy = Object.values(externalServices).every((service: any) => service.healthy);
        overallHealth = coreHealth && externalHealthy;
      }

      const response: any = {
        success: true,
        healthy: overallHealth,
        checks: healthChecks,
        memory: memUsageMB,
        responseTimes,
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      };

      if (includeExtended) {
        response.externalServices = externalServices;
        response.extendedCheck = true;
      }

      res.json(response);

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
   * Get external services health status (admin only)
   * GET /api/monitoring/services
   */
  app.get('/api/monitoring/services', requireAdmin, async (req: Request, res: Response) => {
    try {
      const services = {};
      const responseTimes = {};
      
      // Check all external services in parallel
      const [s3Health, openaiHealth] = await Promise.allSettled([
        checkS3Health(),
        checkOpenAIHealth()
      ]);
      
      // Process S3 results
      if (s3Health.status === 'fulfilled') {
        services.s3 = s3Health.value;
        if (s3Health.value.responseTime) {
          responseTimes.s3 = s3Health.value.responseTime;
        }
      } else {
        services.s3 = {
          healthy: false,
          message: 'S3 health check failed to execute'
        };
      }
      
      // Process OpenAI results
      if (openaiHealth.status === 'fulfilled') {
        services.openai = openaiHealth.value;
        if (openaiHealth.value.responseTime) {
          responseTimes.openai = openaiHealth.value.responseTime;
        }
      } else {
        services.openai = {
          healthy: false,
          message: 'OpenAI health check failed to execute'
        };
      }
      
      const allHealthy = Object.values(services).every((service: any) => service.healthy);
      
      res.json({
        success: true,
        healthy: allHealthy,
        services,
        responseTimes,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        healthy: false,
        message: 'Services health check failed',
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