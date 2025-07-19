import compression from 'compression';
import { createHash } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { NodeCache } from 'node-cache';

import logger from '../utils/logger';
// Initialize response cache
const responseCache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60,
  useClones: false,
});

// ETag cache for conditional requests
const etagCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 300,
});

// Response compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression for JSON, HTML, CSS, JS
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression ratio
  threshold: 1024, // Only compress responses larger than 1KB
});

// Cache control headers middleware
export function cacheControlMiddleware(req: Request, res: Response, next: NextFunction) {
  // Set appropriate cache headers based on route
  const path = req.path;

  // Static assets - long cache
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
  }
  // API responses - shorter cache
  else if (path.startsWith('/api/')) {
    if (path.includes('/user/') || path.includes('/auth/')) {
      // User-specific data - no cache
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    } else if (req.method === 'GET') {
      // Public API data - short cache
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5 min client, 10 min CDN
    }
  }
  // HTML pages
  else {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300'); // Always revalidate, 5 min CDN
  }

  next();
}

// ETag generation and validation
export function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only for GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Store original send function
  const originalSend = res.send;

  res.send = function (data: any) {
    // Generate ETag from response data
    const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');
    const etag = `"${hash}"`;

    // Set ETag header
    res.setHeader('ETag', etag);

    // Check if client has matching ETag
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      res.status(304).end();
      return res;
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

// Response caching middleware
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: (req: Request) => string; // Custom cache key function
  condition?: (req: Request) => boolean; // Condition to cache
}

export function responseCacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 300, key, condition } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if not GET request
    if (req.method !== 'GET') {
      return next();
    }

    // Check condition
    if (condition && !condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = key ? key(req) : `${req.path}:${JSON.stringify(req.query)}`;

    // Check cache
    const cached = responseCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json function
    const originalJson = res.json;

    res.json = function (data: any) {
      // Cache the response
      responseCache.set(cacheKey, data, ttl);
      res.setHeader('X-Cache', 'MISS');

      // Call original json
      return originalJson.call(this, data);
    };

    next();
  };
}

// Request deduplication middleware
const pendingRequests = new Map<string, Promise<any>>();

export function deduplicationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only for GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const requestKey = `${req.path}:${JSON.stringify(req.query)}`;

  // Check if there's a pending request
  const pending = pendingRequests.get(requestKey);
  if (pending) {
    // Wait for the pending request
    pending.then(result => res.json(result)).catch(error => next(error));
    return;
  }

  // Create a promise for this request
  let resolvePromise: (value: any) => void;
  let rejectPromise: (error: any) => void;

  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  pendingRequests.set(requestKey, promise);

  // Override json to resolve the promise
  const originalJson = res.json;
  res.json = function (data: any) {
    pendingRequests.delete(requestKey);
    resolvePromise(data);
    return originalJson.call(this, data);
  };

  // Handle errors
  const originalNext = next;
  next = ((error?: any) => {
    if (error) {
      pendingRequests.delete(requestKey);
      rejectPromise(error);
    }
    return originalNext(error);
  }) as NextFunction;

  next();
}

// Performance monitoring middleware
export function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }

    // Set response time header
    res.setHeader('X-Response-Time', `${duration}ms`);

    // Track metrics (integrate with your analytics)
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      trackPerformanceMetric({
        type: 'api_response_time',
        path: req.path,
        method: req.method,
        duration,
        statusCode: res.statusCode,
      });
    }
  });

  next();
}

// Helper function to track metrics
function trackPerformanceMetric(metric: any) {
  // Implement your analytics tracking here
  // Example: send to Google Analytics, Mixpanel, etc.
  if (global.analytics) {
    global.analytics.track('api_performance', metric);
  }
}

// Clear cache endpoint
export function clearCacheEndpoint(req: Request, res: Response) {
  const { pattern } = req.query;

  if (pattern && typeof pattern === 'string') {
    // Clear specific pattern
    const keys = responseCache.keys();
    let cleared = 0;

    keys.forEach(key => {
      if (key.includes(pattern)) {
        responseCache.del(key);
        cleared++;
      }
    });

    res.json({ message: `Cleared ${cleared} cache entries matching pattern: ${pattern}` });
  } else {
    // Clear all
    responseCache.flushAll();
    etagCache.flushAll();
    res.json({ message: 'All caches cleared' });
  }
}

// Export middleware bundle
export const performanceMiddlewareBundle = [
  compressionMiddleware,
  cacheControlMiddleware,
  etagMiddleware,
  deduplicationMiddleware,
  performanceMonitoringMiddleware,
];
