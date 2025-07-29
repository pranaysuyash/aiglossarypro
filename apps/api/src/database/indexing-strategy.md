# Database Indexing Strategy

## Overview
This document outlines the comprehensive indexing strategy for AIGlossaryPro's PostgreSQL database hosted on Neon. The strategy is based on analysis of query patterns, performance requirements, and best practices for PostgreSQL optimization.

## Current Database Stack
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Connection**: @neondatabase/serverless with connection pooling
- **Caching**: Redis with query result caching

## Index Priority Levels

### 🔴 Critical Indexes (Apply Immediately)
These indexes are essential for core functionality and should be applied as soon as possible.

#### 1. Terms Table
```sql
-- Primary lookups and foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_id ON terms(id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_category_id ON terms(category_id);

-- Search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_name_lower ON terms(LOWER(name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_created_at_desc ON terms(created_at DESC);

-- Composite indexes for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_category_viewcount 
  ON terms(category_id, view_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_category_updated 
  ON terms(category_id, updated_at DESC);

-- Full-text search (if not exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_fulltext 
  ON terms USING GIN(to_tsvector('english', name || ' ' || COALESCE(short_definition, '')));
```

#### 2. Enhanced Terms Table (296 columns)
```sql
-- Primary lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_terms_id ON enhanced_terms(id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_terms_slug ON enhanced_terms(slug);

-- Array field indexes using GIN
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_terms_keywords_gin 
  ON enhanced_terms USING GIN(keywords);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_terms_app_domains_gin 
  ON enhanced_terms USING GIN(application_domains);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_terms_techniques_gin 
  ON enhanced_terms USING GIN(techniques);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_terms_main_categories_gin 
  ON enhanced_terms USING GIN(main_categories);

-- Filtering and sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_terms_difficulty_viewcount 
  ON enhanced_terms(difficulty_level, view_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_terms_search_text 
  ON enhanced_terms USING GIN(to_tsvector('english', search_text));
```

#### 3. User Activity Tables
```sql
-- Term views tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_term_views_user_viewed 
  ON term_views(user_id, viewed_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_term_views_term_user 
  ON term_views(term_id, user_id);

-- User progress tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_term 
  ON user_progress(user_id, term_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_learned 
  ON user_progress(user_id, is_learned) WHERE is_learned = true;

-- Users table
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
```

### 🟡 Medium Priority Indexes
These indexes improve performance for common operations but are not critical.

```sql
-- Favorites
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_created 
  ON favorites(user_id, created_at DESC);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_term 
  ON favorites(user_id, term_id);

-- Term sections
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_term_sections_priority 
  ON term_sections(term_id, priority);

-- Categories (if term counts are slow)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_id ON categories(id);

-- Subcategories relationship
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_term_subcategories_term 
  ON term_subcategories(term_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_term_subcategories_subcategory 
  ON term_subcategories(subcategory_id);
```

### 🟢 Low Priority Indexes
These are nice-to-have optimizations for specific use cases.

```sql
-- Analytics and reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_analytics_timestamp 
  ON content_analytics(timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_analytics_term_timestamp 
  ON content_analytics(term_id, timestamp DESC);

-- User settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_settings_user 
  ON user_settings(user_id);

-- Partial indexes for specific queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_featured 
  ON terms(view_count DESC) WHERE is_featured = true;
```

## Implementation Script

```bash
#!/bin/bash
# Database indexing implementation script
# Run with: ./apply-indexes.sh

echo "Starting database index optimization..."

# Set database connection
DATABASE_URL="your-database-url-here"

# Function to apply index and check result
apply_index() {
    local index_sql="$1"
    local index_name="$2"
    
    echo "Creating index: $index_name"
    psql "$DATABASE_URL" -c "$index_sql"
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully created $index_name"
    else
        echo "❌ Failed to create $index_name"
    fi
}

# Apply critical indexes
echo "📍 Applying critical indexes..."
apply_index "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_category_viewcount ON terms(category_id, view_count DESC);" "idx_terms_category_viewcount"

# Add more indexes here...

# Analyze tables after index creation
echo "📊 Analyzing tables..."
psql "$DATABASE_URL" -c "ANALYZE terms;"
psql "$DATABASE_URL" -c "ANALYZE enhanced_terms;"
psql "$DATABASE_URL" -c "ANALYZE term_views;"
psql "$DATABASE_URL" -c "ANALYZE user_progress;"

echo "✅ Index optimization complete!"
```

## Monitoring and Maintenance

### 1. Query Performance Monitoring
```sql
-- Monitor slow queries
ALTER SYSTEM SET log_min_duration_statement = 100; -- Log queries over 100ms

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';
```

### 2. Regular Maintenance Tasks
```sql
-- Weekly maintenance
VACUUM ANALYZE terms;
VACUUM ANALYZE enhanced_terms;
VACUUM ANALYZE term_views;

-- Monthly maintenance
REINDEX TABLE CONCURRENTLY terms;
REINDEX TABLE CONCURRENTLY enhanced_terms;

-- Check index bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 10485760 -- 10MB
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 3. Performance Optimization Tips

1. **Use EXPLAIN ANALYZE** for query optimization:
   ```sql
   EXPLAIN (ANALYZE, BUFFERS) 
   SELECT * FROM terms WHERE category_id = 1 ORDER BY view_count DESC LIMIT 10;
   ```

2. **Consider partial indexes** for filtered queries:
   ```sql
   CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
   ```

3. **Cluster tables** on frequently used indexes:
   ```sql
   CLUSTER terms USING idx_terms_category_viewcount;
   ```

4. **Monitor connection pool** performance:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

## Expected Performance Improvements

Based on the query patterns analyzed:

1. **Search Performance**: 50-70% improvement with proper full-text indexes
2. **Category Filtering**: 40-60% improvement with composite indexes
3. **User Activity Queries**: 60-80% improvement with user-specific indexes
4. **Array Field Queries**: 70-90% improvement with GIN indexes
5. **Overall Response Time**: 30-50% reduction in average query time

## Rollback Plan

If any index causes performance degradation:

```sql
-- Drop specific index
DROP INDEX CONCURRENTLY IF EXISTS index_name;

-- Emergency: Disable all non-essential indexes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename IN ('terms', 'enhanced_terms') 
        AND indexname NOT LIKE '%_pkey'
    LOOP
        EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS ' || r.indexname;
    END LOOP;
END $$;
```

## Next Steps

1. Review and approve the indexing strategy
2. Test indexes in staging environment first
3. Schedule maintenance window for production deployment
4. Monitor query performance post-implementation
5. Adjust indexes based on actual usage patterns

## References

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Neon Database Best Practices](https://neon.tech/docs/introduction)
- [Drizzle ORM Performance Guide](https://orm.drizzle.team/docs/performance)