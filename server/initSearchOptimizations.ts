/**
 * Initialize search optimizations including database indexes
 * This should be run once to set up the optimized search infrastructure
 */

import { createSearchIndexes } from './optimizedSearchService';
import { sql } from 'drizzle-orm';
import { db } from './db';

export async function initializeSearchOptimizations(): Promise<void> {
  console.log('🔧 Initializing search optimizations...');
  
  try {
    // 1. Enable required PostgreSQL extensions
    console.log('📦 Enabling PostgreSQL extensions...');
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      console.log('✓ pg_trgm extension enabled');
    } catch (error) {
      console.warn('⚠ pg_trgm extension setup:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent`);
      console.log('✓ unaccent extension enabled');
    } catch (error) {
      console.warn('⚠ unaccent extension setup:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // 2. Create optimized search indexes
    await createSearchIndexes();
    
    // 3. Update table statistics for better query planning
    console.log('📊 Updating database statistics...');
    try {
      await db.execute(sql`ANALYZE terms, categories`);
      console.log('✓ Database statistics updated');
    } catch (error) {
      console.warn('⚠ Statistics update:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('✅ Search optimizations initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize search optimizations:', error);
    throw error;
  }
}

// Auto-initialize if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSearchOptimizations()
    .then(() => {
      console.log('Search optimizations setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}