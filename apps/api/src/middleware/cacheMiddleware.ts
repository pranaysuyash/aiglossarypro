/**
 * Cache Middleware using Redis
 * Provides automatic caching for API responses
 */

import { Request, Response, NextFunction } from 'express';
import { redisService, cacheKeys, cacheTTL } from '../services/redisService';
import { log } from '../utils/logger';

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  invalidateOn?: string[];
  condition?: (req: Request) => boolean;
}

/**
 * Cache middleware factory
 */
export function cache(options: CacheOptions = {}) {
  const {
    ttl = cacheTTL.medium,
    keyGenerator,
    condition = () => true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if Redis is not available
    if (!redisService.isAvailable()) {
      return next();
    }

    // Skip caching if condition is not met
    if (!condition(req)) {
      return next();
    }

    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : `api:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cached = await redisService.get(cacheKey);
      if (cached) {
        log.debug('Cache hit', { key: cacheKey });
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', ttl.toString());
        return res.json(cached);
      }

      // Cache miss - store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache the response
      res.json = function(data: Response) {
        // Store in cache
        redisService.set(cacheKey, data, ttl).catch(error => {
          log.error('Failed to cache response', { key: cacheKey, error });
        });
        
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-TTL', ttl.toString());
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      log.error('Cache middleware error', { error });
      next();
    }
  };
}

/**
 * Invalidate cache middleware
 */
export function invalidateCache(patterns: string[] | ((req: Request) => string[])) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if Redis is not available
    if (!redisService.isAvailable()) {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to invalidate cache after successful response
    res.json = function(data: Response) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternsToInvalidate = typeof patterns === 'function' 
          ? patterns(req) 
          : patterns;
        
        // Invalidate cache patterns asynchronously
        Promise.all(
          patternsToInvalidate.map(pattern => 
            redisService.clearPattern(pattern)
          )
        ).catch(error => {
          log.error('Failed to invalidate cache', { patterns: patternsToInvalidate, error });
        });
      }
      
      return originalJson(data);
    };

    next();
  };
}

/**
 * Specific cache configurations for different endpoints
 */
export const cacheConfigs = {
  // Terms caching
  termsList: cache({
    ttl: cacheTTL.medium,
    keyGenerator: (req) => {
      const { page = 1, limit = 20, ...filters } = req.query;
      return cacheKeys.termsList(Number(page), Number(limit), filters);
    },
  }),

  termDetail: cache({
    ttl: cacheTTL.long,
    keyGenerator: (req) => cacheKeys.term(req.params.id),
  }),

  termBySlug: cache({
    ttl: cacheTTL.long,
    keyGenerator: (req) => cacheKeys.termBySlug(req.params.slug),
  }),

  // Categories caching
  categoriesList: cache({
    ttl: cacheTTL.long,
    keyGenerator: () => cacheKeys.categoriesList(),
  }),

  categoryDetail: cache({
    ttl: cacheTTL.long,
    keyGenerator: (req) => cacheKeys.category(req.params.id),
  }),

  // Analytics caching
  trending: cache({
    ttl: cacheTTL.short,
    keyGenerator: () => cacheKeys.trending(),
  }),

  adminStats: cache({
    ttl: cacheTTL.short,
    keyGenerator: () => cacheKeys.adminStats(),
    condition: (req) => req.user?.isAdmin === true,
  }),

  // AI features caching
  aiSuggestions: cache({
    ttl: cacheTTL.medium,
    keyGenerator: (req) => cacheKeys.aiSuggestions(req.params.termId),
  }),

  aiSearch: cache({
    ttl: cacheTTL.short,
    keyGenerator: (req) => cacheKeys.aiSearch(req.query.q as string),
  }),

  // User-specific caching
  userProgress: cache({
    ttl: cacheTTL.short,
    keyGenerator: (req) => cacheKeys.userProgress(req.user?.id || ''),
    condition: (req) => !!req.user,
  }),

  userFavorites: cache({
    ttl: cacheTTL.medium,
    keyGenerator: (req) => cacheKeys.userFavorites(req.user?.id || ''),
    condition: (req) => !!req.user,
  }),
};

/**
 * Cache invalidation patterns for different operations
 */
export const invalidationPatterns = {
  // When a term is updated
  termUpdate: (termId: string) => [
    cacheKeys.term(termId),
    'terms:list:*',
    'ai:suggestions:*',
    'analytics:*',
  ],

  // When a category is updated
  categoryUpdate: (categoryId: string) => [
    cacheKeys.category(categoryId),
    cacheKeys.categoriesList(),
    `category:${categoryId}:*`,
  ],

  // When user data changes
  userDataUpdate: (userId: string) => [
    cacheKeys.userProgress(userId),
    cacheKeys.userFavorites(userId),
    cacheKeys.userHistory(userId),
  ],

  // When analytics are updated
  analyticsUpdate: () => [
    'analytics:*',
    cacheKeys.trending(),
    cacheKeys.adminStats(),
  ],
};