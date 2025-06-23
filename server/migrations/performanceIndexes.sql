-- Performance optimization indexes for AI/ML Glossary Pro
-- Run this file against your PostgreSQL database to improve query performance

-- Terms table optimizations
-- Full-text search index for term names and definitions
CREATE INDEX IF NOT EXISTS terms_fulltext_search_idx 
ON terms USING gin(to_tsvector('english', name || ' ' || definition || ' ' || COALESCE(short_definition, '')));

-- Composite index for category-based searches with view count ordering
CREATE INDEX IF NOT EXISTS terms_category_viewcount_idx 
ON terms (category_id, view_count DESC, created_at DESC);

-- Index for term name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS terms_name_lower_idx 
ON terms USING btree(lower(name));

-- Index for recently created terms
CREATE INDEX IF NOT EXISTS terms_recent_idx 
ON terms (created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';

-- Index for popular terms (high view count)
CREATE INDEX IF NOT EXISTS terms_popular_idx 
ON terms (view_count DESC) WHERE view_count > 0;

-- Categories table optimizations
-- Index for category name searches
CREATE INDEX IF NOT EXISTS categories_name_lower_idx 
ON categories USING btree(lower(name));

-- Subcategories table optimizations
-- Composite index for subcategory lookups
CREATE INDEX IF NOT EXISTS subcategories_category_name_idx 
ON subcategories (category_id, name);

-- User activity optimizations
-- Favorites table - composite index for user lookups
CREATE INDEX IF NOT EXISTS favorites_user_created_idx 
ON favorites (user_id, created_at DESC);

-- User progress tracking
CREATE INDEX IF NOT EXISTS user_progress_user_updated_idx 
ON user_progress (user_id, updated_at DESC);

-- Term views for analytics
CREATE INDEX IF NOT EXISTS term_views_term_date_idx 
ON term_views (term_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS term_views_user_date_idx 
ON term_views (user_id, viewed_at DESC);

-- Enhanced terms optimizations (if using enhanced schema)
-- Application domains search
CREATE INDEX IF NOT EXISTS enhanced_terms_domains_idx 
ON enhanced_terms USING gin(application_domains);

-- Techniques search
CREATE INDEX IF NOT EXISTS enhanced_terms_techniques_idx 
ON enhanced_terms USING gin(techniques);

-- Keywords search
CREATE INDEX IF NOT EXISTS enhanced_terms_keywords_idx 
ON enhanced_terms USING gin(keywords);

-- Difficulty level filtering
CREATE INDEX IF NOT EXISTS enhanced_terms_difficulty_idx 
ON enhanced_terms (difficulty_level, created_at DESC);

-- Session management optimization
CREATE INDEX IF NOT EXISTS sessions_expire_idx 
ON sessions (expire) WHERE expire > NOW();

-- Partial indexes for active data
-- Only index non-deleted terms (if soft delete is implemented)
-- CREATE INDEX IF NOT EXISTS terms_active_idx 
-- ON terms (id, name, created_at) WHERE deleted_at IS NULL;

-- Only index terms with content
CREATE INDEX IF NOT EXISTS terms_with_content_idx 
ON terms (id, name, view_count DESC) WHERE definition IS NOT NULL AND definition != '';

-- Analytics optimizations
-- Index for trending calculations (last 7 days)
CREATE INDEX IF NOT EXISTS term_views_trending_idx 
ON term_views (term_id, viewed_at) WHERE viewed_at > NOW() - INTERVAL '7 days';

-- Index for monthly analytics
CREATE INDEX IF NOT EXISTS term_views_monthly_idx 
ON term_views (date_trunc('month', viewed_at), term_id);

-- User engagement analytics
CREATE INDEX IF NOT EXISTS user_activity_daily_idx 
ON term_views (user_id, date_trunc('day', viewed_at));

-- Search performance index for autocomplete
CREATE INDEX IF NOT EXISTS terms_name_prefix_idx 
ON terms USING gin(name gin_trgm_ops);

-- Note: The gin_trgm_ops requires the pg_trgm extension
-- Enable with: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Vacuum and analyze tables for optimal performance
VACUUM ANALYZE terms;
VACUUM ANALYZE categories;
VACUUM ANALYZE subcategories;
VACUUM ANALYZE favorites;
VACUUM ANALYZE user_progress;
VACUUM ANALYZE term_views;

-- Display index information
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('terms', 'categories', 'subcategories', 'favorites', 'user_progress', 'term_views')
ORDER BY tablename, indexname;