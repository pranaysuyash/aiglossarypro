import type { NextFunction, Request, Response } from 'express';

interface PerformanceMetrics {
  slowQueries: Array<{
    method: string;
    path: string;
    duration: number;
    timestamp: Date;
  }>;
  totalRequests: number;
  averageResponseTime: number;
}

// In-memory metrics store (in production, use Redis or database)
const metrics: PerformanceMetrics = {
  slowQueries: [],
  totalRequests: 0,
  averageResponseTime: 0,
};

/**
 * Performance monitoring middleware
 * Tracks response times and logs slow queries
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Update metrics
    metrics.totalRequests++;
    metrics.averageResponseTime =
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + duration) /
      metrics.totalRequests;

    // Log slow queries (>1000ms)
    if (duration > 1000) {
      const slowQuery = {
        method: req.method,
        path: req.path,
        duration,
        timestamp: new Date(),
      };

      metrics.slowQueries.push(slowQuery);

      // Keep only last 100 slow queries
      if (metrics.slowQueries.length > 100) {
        metrics.slowQueries.shift();
      }

      console.warn(`🐌 Slow query detected: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Log API requests
    if (req.path.startsWith('/api')) {
      console.log(`📊 ${req.method} ${req.path} - ${duration}ms`);
    }
  });

  next();
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return {
    ...metrics,
    slowQueries: [...metrics.slowQueries], // Return copy to prevent mutation
  };
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  metrics.slowQueries = [];
  metrics.totalRequests = 0;
  metrics.averageResponseTime = 0;
}
