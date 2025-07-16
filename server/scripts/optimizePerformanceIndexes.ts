#!/usr/bin/env tsx

/**
 * Performance Index Optimization Script
 *
 * This script creates database indexes specifically optimized for the
 * performance improvements implemented in the API endpoints.
 */

import { sql } from 'drizzle-orm';
import { db } from '../db';

async function createPerformanceIndexes() {
  console.log('🚀 Creating performance-optimized database indexes...');

  const startTime = Date.now();
  const indexes = [
    // Terms table indexes for pagination and sorting
    {
      name: 'terms_name_lower_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_lower_idx ON terms(LOWER(name))`,
    },
    {
      name: 'terms_view_count_desc_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_view_count_desc_idx ON terms(view_count DESC NULLS LAST)`,
    },
    {
      name: 'terms_created_at_desc_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_created_at_desc_idx ON terms(created_at DESC NULLS LAST)`,
    },
    {
      name: 'terms_category_view_count_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_category_view_count_idx ON terms(category_id, view_count DESC NULLS LAST)`,
    },
    {
      name: 'terms_category_name_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_category_name_idx ON terms(category_id, name)`,
    },

    // Full-text search indexes
    {
      name: 'terms_fts_name_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_fts_name_idx ON terms USING GIN(to_tsvector('english', name))`,
    },
    {
      name: 'terms_fts_definition_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_fts_definition_idx ON terms USING GIN(to_tsvector('english', COALESCE(definition, '')))`,
    },
    {
      name: 'terms_fts_combined_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_fts_combined_idx ON terms USING GIN(to_tsvector('english', name || ' ' || COALESCE(short_definition, '') || ' ' || COALESCE(definition, '')))`,
    },

    // Trigram indexes for fuzzy search (requires pg_trgm extension)
    {
      name: 'enable_pg_trgm',
      sql: `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
    },
    {
      name: 'terms_name_trgm_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_trgm_idx ON terms USING GIN(name gin_trgm_ops)`,
    },
    {
      name: 'terms_short_definition_trgm_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_short_definition_trgm_idx ON terms USING GIN(short_definition gin_trgm_ops)`,
    },

    // Categories table indexes
    {
      name: 'categories_name_lower_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS categories_name_lower_idx ON categories(LOWER(name))`,
    },

    // User activity indexes for analytics
    {
      name: 'favorites_user_term_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS favorites_user_term_idx ON favorites(user_id, term_id)`,
    },
    {
      name: 'favorites_created_at_desc_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS favorites_created_at_desc_idx ON favorites(created_at DESC NULLS LAST)`,
    },
    {
      name: 'user_progress_user_term_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS user_progress_user_term_idx ON user_progress(user_id, term_id)`,
    },
    {
      name: 'term_views_user_viewed_at_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS term_views_user_viewed_at_idx ON term_views(user_id, viewed_at DESC NULLS LAST)`,
    },
    {
      name: 'term_views_term_viewed_at_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS term_views_term_viewed_at_idx ON term_views(term_id, viewed_at DESC NULLS LAST)`,
    },

    // Composite indexes for common query patterns
    {
      name: 'terms_category_created_at_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_category_created_at_idx ON terms(category_id, created_at DESC NULLS LAST)`,
    },
    {
      name: 'favorites_user_created_at_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS favorites_user_created_at_idx ON favorites(user_id, created_at DESC NULLS LAST)`,
    },

    // Partial indexes for active/popular content
    {
      name: 'terms_popular_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_popular_idx ON terms(view_count DESC NULLS LAST) WHERE view_count > 10`,
    },
    {
      name: 'terms_recent_idx',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_recent_idx ON terms(created_at DESC NULLS LAST) WHERE created_at > NOW() - INTERVAL '30 days'`,
    },
  ];

  const results = [];

  for (const index of indexes) {
    try {
      console.log(`Creating ${index.name}...`);
      await db.execute(sql.raw(index.sql));
      results.push({ name: index.name, status: 'success' });
      console.log(`✅ ${index.name} created successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ name: index.name, status: 'error', error: errorMessage });

      if (errorMessage.includes('already exists')) {
        console.log(`ℹ️  ${index.name} already exists`);
      } else {
        console.error(`❌ Failed to create ${index.name}:`, errorMessage);
      }
    }
  }

  // Update table statistics
  try {
    console.log('Updating table statistics...');
    await db.execute(sql`ANALYZE terms, categories, favorites, user_progress, term_views`);
    console.log('✅ Table statistics updated');
  } catch (error) {
    console.error('❌ Failed to update statistics:', error);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`\n📊 Index Creation Summary:`);
  console.log(`Total time: ${duration}ms`);
  console.log(`Successful indexes: ${results.filter(r => r.status === 'success').length}`);
  console.log(`Failed indexes: ${results.filter(r => r.status === 'error').length}`);

  const failed = results.filter(r => r.status === 'error');
  if (failed.length > 0) {
    console.log(`\n❌ Failed indexes:`);
    failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }

  console.log('\n🎯 Performance optimization complete!');

  return results;
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createPerformanceIndexes()
    .then(() => {
      console.log('Index creation completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Index creation failed:', error);
      process.exit(1);
    });
}

export { createPerformanceIndexes };
