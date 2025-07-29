/**
 * Cache Warm Job Processor
 * Handles cache warming operations for better performance
 */

import type { Job } from 'bullmq';
import { redisCache } from '@aiglossarypro/config/config/redis';
import { enhancedStorage } from '../../enhancedStorage';
import { optimizedSearch } from '../../optimizedSearchService';
import { log as logger } from '../../utils/logger';
import type { CacheWarmJobData } from '../types';

interface CacheWarmJobResult {
  warmedKeys: string[];
  failedKeys: string[];
  duration: number;
  errors: Array<{ key: string; error: string }>;
}

export async function cacheWarmProcessor(job: Job<CacheWarmJobData>): Promise<CacheWarmJobResult> {
  const startTime = Date.now();
  const { keys, ttl = 3600, priority = 'normal' } = job.data;

  logger.info(`Starting cache warm job ${job.id} for ${keys.length} keys`);

  const result: CacheWarmJobResult = {
    warmedKeys: [],
    failedKeys: [],
    duration: 0,
    errors: [],
  };

  try {
    // Process keys based on priority
    const processOrder = priority === 'high' ? keys : keys.sort();

    for (let i = 0; i < processOrder.length; i++) {
      const key = processOrder[i];

      await job.updateProgress({
        progress: (i / processOrder.length) * 90,
        message: `Warming cache for key: ${key}`,
        stage: 'warming',
        details: {
          currentKey: key,
          processed: i,
          total: processOrder.length,
        },
      });

      try {
        await warmCacheKey(key, ttl);
        result.warmedKeys.push(key);
      } catch (error) {
        logger.error(`Failed to warm cache for key ${key}:`, {
          error: error instanceof Error ? error.message : String(error),
        });
        result.failedKeys.push(key);
        result.errors.push({
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    result.duration = Date.now() - startTime;

    await job.updateProgress({
      progress: 100,
      message: 'Cache warming completed',
      stage: 'completed',
      details: {
        warmedKeys: result.warmedKeys.length,
        failedKeys: result.failedKeys.length,
        duration: result.duration,
      },
    });

    logger.info(`Cache warm job ${job.id} completed`, {
      warmedKeys: result.warmedKeys.length,
      failedKeys: result.failedKeys.length,
      duration: result.duration,
    });

    return result;
  } catch (error) {
    logger.error(`Cache warm job ${job.id} failed:`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Warm cache for a specific key
 */
async function warmCacheKey(key: string, ttl: number): Promise<void> {
  // Check if key already exists in cache
  const exists = await redisCache.exists(key);
  if (exists) {
    logger.debug(`Cache key ${key} already exists, skipping`);
    return;
  }

  // Determine cache type and generate content
  if (key.startsWith('search:')) {
    await warmSearchCache(key, ttl);
  } else if (key.startsWith('enhanced_term:')) {
    await warmTermCache(key, ttl);
  } else if (key.startsWith('term_sections:')) {
    await warmTermSectionsCache(key, ttl);
  } else if (key.startsWith('user_prefs:')) {
    await warmUserPrefsCache(key, ttl);
  } else if (key.startsWith('search_metrics:')) {
    await warmSearchMetricsCache(key, ttl);
  } else if (key.startsWith('recommendations:')) {
    await warmRecommendationsCache(key, ttl);
  } else if (key.startsWith('relationships:')) {
    await warmRelationshipsCache(key, ttl);
  } else {
    logger.warn(`Unknown cache key pattern: ${key}`);
  }
}

/**
 * Warm search result cache
 */
async function warmSearchCache(key: string, ttl: number): Promise<void> {
  // Extract search query from key (format: search:query:filters)
  const keyParts = key.split(':');
  if (keyParts.length < 2) {return;}

  const query = keyParts[1];
  const filters = keyParts[2] ? JSON.parse(decodeURIComponent(keyParts[2])) : {};

  const searchResults = await optimizedSearch({
    query,
    ...filters,
    limit: 20,
  });

  await redisCache.set(key, searchResults, ttl);
}

/**
 * Warm enhanced term cache
 */
async function warmTermCache(key: string, ttl: number): Promise<void> {
  // Extract term ID from key (format: enhanced_term:id)
  const termId = key.split(':')[1];
  if (!termId) {return;}

  const term = await enhancedStorage.getTermById(termId);
  if (term) {
    await redisCache.set(key, term, ttl);
  }
}

/**
 * Warm term sections cache
 */
async function warmTermSectionsCache(key: string, ttl: number): Promise<void> {
  // Extract term ID from key (format: term_sections:termId)
  const termId = key.split(':')[1];
  if (!termId) {return;}

  const sections = await enhancedStorage.getTermSections(termId);
  if (sections) {
    await redisCache.set(key, sections, ttl);
  }
}

/**
 * Warm user preferences cache
 */
async function warmUserPrefsCache(key: string, ttl: number): Promise<void> {
  // Extract user ID from key (format: user_prefs:userId)
  const userId = key.split(':')[1];
  if (!userId) {return;}

  // Get user preferences from database
  const userPrefs = await getUserPreferences(userId);
  if (userPrefs) {
    await redisCache.set(key, userPrefs, ttl);
  }
}

/**
 * Warm search metrics cache
 */
async function warmSearchMetricsCache(key: string, ttl: number): Promise<void> {
  // Extract timeframe from key (format: search_metrics:timeframe)
  const timeframe = key.split(':')[1];
  if (!timeframe) {return;}

  const metrics = await calculateSearchMetrics(timeframe);
  await redisCache.set(key, metrics, ttl);
}

/**
 * Warm recommendations cache
 */
async function warmRecommendationsCache(key: string, ttl: number): Promise<void> {
  // Extract user ID from key (format: recommendations:userId)
  const userId = key.split(':')[1];
  if (!userId) {return;}

  const recommendations = await generateUserRecommendations(userId);
  await redisCache.set(key, recommendations, ttl);
}

/**
 * Warm relationships cache
 */
async function warmRelationshipsCache(key: string, ttl: number): Promise<void> {
  // Extract term ID from key (format: relationships:termId)
  const termId = key.split(':')[1];
  if (!termId) {return;}

  const relationships = await findTermRelationships(termId);
  await redisCache.set(key, relationships, ttl);
}

/**
 * Helper function to get user preferences
 */
async function getUserPreferences(userId: string): Promise<unknown> {
  // Mock implementation - replace with actual database query
  return {
    userId,
    favoriteCategories: ['machine-learning', 'deep-learning'],
    searchHistory: [],
    displayPreferences: {
      theme: 'light',
      density: 'comfortable',
    },
    lastActive: new Date().toISOString(),
  };
}

/**
 * Helper function to calculate search metrics
 */
async function calculateSearchMetrics(timeframe: string): Promise<unknown> {
  // Mock implementation - replace with actual analytics query
  return {
    timeframe,
    totalSearches: 1000,
    uniqueUsers: 250,
    topQueries: [
      { query: 'machine learning', count: 150 },
      { query: 'neural network', count: 120 },
      { query: 'deep learning', count: 100 },
    ],
    avgResultsPerSearch: 8.5,
    clickThroughRate: 0.65,
  };
}

/**
 * Helper function to generate user recommendations
 */
async function generateUserRecommendations(userId: string): Promise<unknown> {
  // Mock implementation - replace with actual recommendation engine
  return {
    userId,
    recommendations: [
      {
        termId: 'ml-001',
        termName: 'Machine Learning',
        score: 0.95,
        reason: 'Based on your search history',
      },
      {
        termId: 'dl-001',
        termName: 'Deep Learning',
        score: 0.9,
        reason: 'Popular in your categories',
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Helper function to find term relationships
 */
async function findTermRelationships(termId: string): Promise<unknown> {
  // Mock implementation - replace with actual relationship analysis
  return {
    termId,
    relationships: [
      {
        relatedTermId: 'dl-001',
        relatedTermName: 'Deep Learning',
        relationshipType: 'subcategory',
        strength: 0.9,
      },
      {
        relatedTermId: 'nn-001',
        relatedTermName: 'Neural Networks',
        relationshipType: 'related',
        strength: 0.8,
      },
    ],
    calculatedAt: new Date().toISOString(),
  };
}
