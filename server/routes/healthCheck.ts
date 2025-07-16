/**
 * Comprehensive Health Check Endpoints
 * Provides detailed health monitoring for production deployment
 */

import type { Express, Request, Response } from 'express';
import { analyticsService } from '../config/analytics';
import { isSentryEnabled } from '../config/sentry';
import { enhancedStorage } from '../enhancedStorage';
import { productionEmailService } from '../services/productionEmailService';
import { log as logger } from '../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message: string;
  lastChecked: string;
  details?: Record<string, any>;
}

interface DetailedHealthCheck {
  overall: HealthStatus;
  services: ServiceHealth[];
  system: {
    memory: {
      used: number;
      total: number;
      free: number;
      usage_percent: number;
    };
    cpu: {
      user: number;
      system: number;
    };
    nodejs: {
      version: string;
      platform: string;
      arch: string;
    };
  };
}

export function registerHealthCheckRoutes(app: Express): void {
  /**
   * Basic health check - fast response for load balancers
   * GET /health
   */
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * Liveness probe - checks if application is running
   * GET /health/live
   */
  app.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
    });
  });

  /**
   * Readiness probe - checks if application is ready to serve traffic
   * GET /health/ready
   */
  app.get('/health/ready', async (_req: Request, res: Response) => {
    try {
      const checks = await performReadinessChecks();
      const allHealthy = checks.every(check => check.status === 'healthy');

      res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks,
      });
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Detailed health check - comprehensive status for monitoring
   * GET /health/detailed
   */
  app.get('/health/detailed', async (_req: Request, res: Response) => {
    try {
      const healthCheck = await performDetailedHealthCheck();
      const status = determineOverallStatus(healthCheck.services);

      res.status(status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503).json(healthCheck);
    } catch (error) {
      logger.error('Detailed health check failed:', error);
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Database health check
   * GET /health/database
   */
  app.get('/health/database', async (_req: Request, res: Response) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      res.status(dbHealth.status === 'healthy' ? 200 : 503).json(dbHealth);
    } catch (error) {
      res.status(503).json({
        name: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database check failed',
        lastChecked: new Date().toISOString(),
      });
    }
  });

  /**
   * Email service health check
   * GET /health/email
   */
  app.get('/health/email', async (_req: Request, res: Response) => {
    try {
      const emailHealth = await checkEmailHealth();
      res.status(emailHealth.status === 'healthy' ? 200 : 503).json(emailHealth);
    } catch (error) {
      res.status(503).json({
        name: 'email',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Email check failed',
        lastChecked: new Date().toISOString(),
      });
    }
  });

  /**
   * Analytics health check
   * GET /health/analytics
   */
  app.get('/health/analytics', async (_req: Request, res: Response) => {
    try {
      const analyticsHealth = await checkAnalyticsHealth();
      res.status(200).json(analyticsHealth); // Analytics is non-critical
    } catch (error) {
      res.status(200).json({
        name: 'analytics',
        status: 'degraded',
        message: error instanceof Error ? error.message : 'Analytics check failed',
        lastChecked: new Date().toISOString(),
      });
    }
  });

  /**
   * Dependencies health check
   * GET /health/dependencies
   */
  app.get('/health/dependencies', async (_req: Request, res: Response) => {
    try {
      const dependencies = await checkAllDependencies();
      const criticalDepsHealthy = dependencies
        .filter(dep => dep.details?.critical)
        .every(dep => dep.status === 'healthy');

      res.status(criticalDepsHealthy ? 200 : 503).json({
        status: criticalDepsHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        dependencies,
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Dependencies check failed',
      });
    }
  });
}

/**
 * Perform basic readiness checks for critical services
 */
async function performReadinessChecks(): Promise<ServiceHealth[]> {
  const checks: Promise<ServiceHealth>[] = [checkDatabaseHealth(), checkEmailHealth()];

  const results = await Promise.allSettled(checks);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } 
      const serviceNames = ['database', 'email'];
      return {
        name: serviceNames[index] || 'unknown',
        status: 'unhealthy' as const,
        message: 'Check failed to execute',
        lastChecked: new Date().toISOString(),
      };
    
  });
}

/**
 * Perform comprehensive health check
 */
async function performDetailedHealthCheck(): Promise<DetailedHealthCheck> {
  const services = await checkAllDependencies();
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    overall: {
      status: determineOverallStatus(services),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    services,
    system: {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        free: Math.round((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024),
        usage_percent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000),
      },
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    },
  };
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const isHealthy = await enhancedStorage.checkDatabaseHealth();
    const responseTime = Date.now() - startTime;

    if (isHealthy) {
      return {
        name: 'database',
        status: 'healthy',
        responseTime,
        message: 'Database connection successful',
        lastChecked: new Date().toISOString(),
        details: {
          critical: true,
          connection_time_ms: responseTime,
        },
      };
    } 
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        message: 'Database connection failed',
        lastChecked: new Date().toISOString(),
        details: {
          critical: true,
        },
      };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Database check failed',
      lastChecked: new Date().toISOString(),
      details: {
        critical: true,
      },
    };
  }
}

/**
 * Check email service health
 */
async function checkEmailHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const emailStatus = productionEmailService.getServiceStatus();
    const responseTime = Date.now() - startTime;

    if (emailStatus.available && emailStatus.configured) {
      return {
        name: 'email',
        status: 'healthy',
        responseTime,
        message: `Email service (${emailStatus.service}) is operational`,
        lastChecked: new Date().toISOString(),
        details: {
          critical: true,
          service: emailStatus.service,
          enabled: emailStatus.configured,
        },
      };
    } else if (emailStatus.available) {
      return {
        name: 'email',
        status: 'degraded',
        responseTime,
        message: 'Email service available but not enabled',
        lastChecked: new Date().toISOString(),
        details: {
          critical: true,
          service: emailStatus.service,
          enabled: emailStatus.configured,
        },
      };
    } 
      return {
        name: 'email',
        status: 'unhealthy',
        responseTime,
        message: 'No email service configured',
        lastChecked: new Date().toISOString(),
        details: {
          critical: true,
        },
      };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'email',
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Email check failed',
      lastChecked: new Date().toISOString(),
      details: {
        critical: true,
      },
    };
  }
}

/**
 * Check analytics health
 */
async function checkAnalyticsHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const analyticsStatus = analyticsService.getStatus();
    const responseTime = Date.now() - startTime;

    const hasAnalytics = analyticsStatus.posthog.enabled || analyticsStatus.googleAnalytics.enabled;

    return {
      name: 'analytics',
      status: hasAnalytics ? 'healthy' : 'degraded',
      responseTime,
      message: hasAnalytics ? 'Analytics services operational' : 'Analytics not configured',
      lastChecked: new Date().toISOString(),
      details: {
        critical: false,
        posthog: analyticsStatus.posthog,
        googleAnalytics: analyticsStatus.googleAnalytics,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'analytics',
      status: 'degraded',
      responseTime,
      message: error instanceof Error ? error.message : 'Analytics check failed',
      lastChecked: new Date().toISOString(),
      details: {
        critical: false,
      },
    };
  }
}

/**
 * Check monitoring health
 */
async function checkMonitoringHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const sentryEnabled = isSentryEnabled();
    const responseTime = Date.now() - startTime;

    return {
      name: 'monitoring',
      status: sentryEnabled ? 'healthy' : 'degraded',
      responseTime,
      message: sentryEnabled ? 'Error monitoring active' : 'Error monitoring not configured',
      lastChecked: new Date().toISOString(),
      details: {
        critical: false,
        sentry_enabled: sentryEnabled,
        environment: process.env.NODE_ENV,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'monitoring',
      status: 'degraded',
      responseTime,
      message: error instanceof Error ? error.message : 'Monitoring check failed',
      lastChecked: new Date().toISOString(),
      details: {
        critical: false,
      },
    };
  }
}

/**
 * Check all dependencies
 */
async function checkAllDependencies(): Promise<ServiceHealth[]> {
  const checks: Promise<ServiceHealth>[] = [
    checkDatabaseHealth(),
    checkEmailHealth(),
    checkAnalyticsHealth(),
    checkMonitoringHealth(),
  ];

  const results = await Promise.allSettled(checks);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } 
      const serviceNames = ['database', 'email', 'analytics', 'monitoring'];
      return {
        name: serviceNames[index] || 'unknown',
        status: 'unhealthy' as const,
        message: 'Check failed to execute',
        lastChecked: new Date().toISOString(),
        details: {
          critical: ['database', 'email'].includes(serviceNames[index]),
        },
      };
    
  });
}

/**
 * Determine overall status based on service health
 */
function determineOverallStatus(services: ServiceHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
  const criticalServices = services.filter(s => s.details?.critical);
  const hasUnhealthyCritical = criticalServices.some(s => s.status === 'unhealthy');
  const hasDegradedCritical = criticalServices.some(s => s.status === 'degraded');
  const hasUnhealthyNonCritical = services.some(
    s => !s.details?.critical && s.status === 'unhealthy'
  );

  if (hasUnhealthyCritical) {
    return 'unhealthy';
  } else if (hasDegradedCritical || hasUnhealthyNonCritical) {
    return 'degraded';
  } 
    return 'healthy';
  
}
