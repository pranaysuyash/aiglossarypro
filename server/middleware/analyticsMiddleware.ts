/**
 * Analytics Middleware for Automatic Performance and Usage Tracking
 * Automatically tracks all API requests, performance metrics, and user interactions
 */

import os from 'node:os';
import type { NextFunction, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { ErrorCategory, errorLogger } from './errorHandler';

// Extend Request interface to include analytics data
declare global {
  namespace Express {
    interface Request {
      startTime: number;
      userIp?: string;
      sessionId?: string;
    }
  }
}

/**
 * Performance tracking middleware - tracks all API requests
 */
export function performanceTrackingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Record start time for performance measurement
    req.startTime = Date.now();

    // Extract user IP (handling proxies)
    req.userIp =
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    // Generate or extract session ID
    req.sessionId =
      (req.headers['x-session-id'] as string) ||
      (req as any).sessionID ||
      `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Override res.end to capture response data
    const originalEnd = res.end.bind(res);
    (res as any).end = function (
      this: Response,
      chunk?: any,
      encoding?: BufferEncoding,
      callback?: () => void
    ): any {
      const responseTime = Date.now() - (req.startTime || Date.now());
      const endpoint = req.route?.path || req.path;
      const method = req.method;
      const statusCode = res.statusCode;

      // Get system metrics
      const memoryUsage = process.memoryUsage();
      const memoryUsageMb = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;

      // Calculate approximate CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      const cpuPercent = Math.round(((cpuUsage.user + cpuUsage.system) / 1000000) * 100) / 100;

      // Track performance asynchronously to avoid blocking response
      setImmediate(() => {
        analyticsService
          .trackPerformance(endpoint, method, responseTime, statusCode, memoryUsageMb, cpuPercent)
          .catch(error => {
            errorLogger.logError(error, req, ErrorCategory.UNKNOWN, 'medium');
          });
      });

      // Handle different call patterns safely (Type-safe solution following Express signature)
      return originalEnd.call(this, chunk || undefined, encoding as BufferEncoding, callback);
    };

    next();
  };
}

/**
 * Page view tracking middleware - tracks page visits and user engagement
 */
export function pageViewTrackingMiddleware() {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Only track GET requests to avoid duplicate tracking on API calls
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      const page = req.path;
      const referrer = req.headers.referer || (req.headers.referrer as string);
      const userAgent = req.headers['user-agent'];

      // Extract term ID if viewing a term page
      const termIdMatch = req.path.match(/\/term\/([^/]+)/);
      const termId = termIdMatch ? termIdMatch[1] : undefined;

      // Track page view asynchronously
      setImmediate(() => {
        analyticsService
          .trackPageView(page, termId, req.userIp, referrer, userAgent)
          .catch(error => {
            errorLogger.logError(error, req, ErrorCategory.UNKNOWN, 'medium');
          });
      });
    }

    next();
  };
}

/**
 * Search tracking middleware - specifically for search endpoints
 */
export function searchTrackingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply to search endpoints
    if (req.path.includes('/search') || (req.path.includes('/api/terms') && req.query.q)) {
      const originalJson = res.json;

      res.json = function (this: Response, data: any) {
        const responseTime = Date.now() - (req.startTime || Date.now());
        const query = (req.query.q as string) || req.body.query || '';

        // Determine results count from response
        let resultsCount = 0;
        if (data?.data) {
          if (Array.isArray(data.data)) {
            resultsCount = data.data.length;
          } else if (data.data.terms && Array.isArray(data.data.terms)) {
            resultsCount = data.data.terms.length;
          }
        }

        // Track search asynchronously
        if (query) {
          setImmediate(() => {
            analyticsService
              .trackSearch(query, resultsCount, responseTime, req.userIp)
              .catch(error => {
                errorLogger.logError(error, req, ErrorCategory.UNKNOWN, 'medium');
              });
          });
        }

        return originalJson.call(this, data);
      };
    }

    next();
  };
}

/**
 * User interaction tracking helper
 */
export function trackUserInteraction(action: 'favorite' | 'share' | 'feedback' | 'suggest_term') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const termId = req.params.termId || req.params.id;

    // Track interaction asynchronously
    setImmediate(() => {
      analyticsService
        .trackUserInteraction(action, termId, undefined, req.userIp, req.sessionId)
        .catch(error => {
          errorLogger.logError(error, req, ErrorCategory.UNKNOWN, 'medium');
        });
    });

    next();
  };
}

/**
 * System health monitoring middleware
 */
export function systemHealthMiddleware() {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // Monitor system health on every 10th request to avoid overhead
    if (Math.random() < 0.1) {
      setImmediate(() => {
        const memoryUsage = process.memoryUsage();
        const loadAverage = os.loadavg();
        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();

        const healthMetrics = {
          heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external_mb: Math.round(memoryUsage.external / 1024 / 1024),
          load_average_1m: loadAverage[0],
          free_memory_mb: Math.round(freeMemory / 1024 / 1024),
          total_memory_mb: Math.round(totalMemory / 1024 / 1024),
          memory_usage_percent: Math.round((1 - freeMemory / totalMemory) * 100),
          uptime_seconds: process.uptime(),
          timestamp: new Date(),
        };

        // Log critical system health issues (less aggressive in development)
        const isDevelopment = process.env.NODE_ENV === 'development';
        const memoryThreshold = isDevelopment ? 95 : 90; // Higher threshold in dev

        if (healthMetrics.memory_usage_percent > memoryThreshold) {
          console.warn(
            `High memory usage: ${healthMetrics.memory_usage_percent}% (Node heap: ${healthMetrics.heap_used_mb}MB)`
          );
        }

        if (healthMetrics.load_average_1m > os.cpus().length * 2) {
          console.warn(`High system load: ${healthMetrics.load_average_1m}`);
        }
      });
    }

    next();
  };
}

/**
 * Analytics initialization - creates necessary database tables
 */
export async function initializeAnalytics(): Promise<void> {
  try {
    // The analytics service will create tables on first flush
    // This is a placeholder for any initialization logic
    console.log('📊 Analytics middleware initialized');
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}
