/**
 * Initialize search optimizations including database indexes
 * This should be run once to set up the optimized search infrastructure
 */

import { sql } from 'drizzle-orm';
import { db } from './db';
import { createSearchIndexes } from './optimizedSearchService';

import logger from './utils/logger';
export async function initializeSearchOptimizations(): Promise<void> {
  logger.info('🔧 Initializing search optimizations...');

  try {
    // 1. Enable required PostgreSQL extensions
    logger.info('📦 Enabling PostgreSQL extensions...');
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      logger.info('✓ pg_trgm extension enabled');
    } catch (error) {
      logger.warn(
        '⚠ pg_trgm extension setup:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent`);
      logger.info('✓ unaccent extension enabled');
    } catch (error) {
      logger.warn(
        '⚠ unaccent extension setup:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // 2. Create optimized search indexes
    await createSearchIndexes();

    // 3. Update table statistics for better query planning
    logger.info('📊 Updating database statistics...');
    try {
      await db.execute(sql`ANALYZE terms, categories`);
      logger.info('✓ Database statistics updated');
    } catch (error) {
      logger.warn(
        '⚠ Statistics update:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    logger.info('✅ Search optimizations initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize search optimizations:', error);
    throw error;
  }
}

// Auto-initialize if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSearchOptimizations()
    .then(() => {
      logger.info('Search optimizations setup complete');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Setup failed:', error);
      process.exit(1);
    });
}
