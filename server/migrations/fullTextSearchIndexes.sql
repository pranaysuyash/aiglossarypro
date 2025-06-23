-- Full-Text Search Indexes for AIGlossaryPro
-- These indexes will dramatically improve search performance for text-based queries

-- =============================================================================
-- 1. FULL-TEXT SEARCH INDEXES
-- =============================================================================

-- Create full-text search index on terms table for name and definition
-- This enables fast search across term names and definitions
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_fulltext_search_idx 
ON terms 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(definition, '') || ' ' || COALESCE(explanation, '')));

-- Create full-text search index on categories table
CREATE INDEX CONCURRENTLY IF NOT EXISTS categories_fulltext_search_idx 
ON categories 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Create full-text search index on subcategories table
CREATE INDEX CONCURRENTLY IF NOT EXISTS subcategories_fulltext_search_idx 
ON subcategories 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =============================================================================
-- 2. TRIGRAM INDEXES (for fuzzy/partial matching)
-- =============================================================================

-- Enable pg_trgm extension for similarity search (fuzzy matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for fuzzy search on term names
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_trgm_idx 
ON terms 
USING GIN (name gin_trgm_ops);

-- Create trigram indexes for fuzzy search on category names
CREATE INDEX CONCURRENTLY IF NOT EXISTS categories_name_trgm_idx 
ON categories 
USING GIN (name gin_trgm_ops);

-- =============================================================================
-- 3. SPECIALIZED SEARCH INDEXES
-- =============================================================================

-- Create index for search with difficulty filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_difficulty_search_idx 
ON terms (difficulty, name);

-- Create index for search with tags filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_tags_search_idx 
ON terms 
USING GIN (tags);

-- Create index for search ordering by view count
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_viewcount_name_idx 
ON terms (view_count DESC, name);

-- =============================================================================
-- 4. ENHANCED SEARCH FUNCTIONS
-- =============================================================================

-- Create a function for ranking search results
CREATE OR REPLACE FUNCTION calculate_search_rank(
    search_query text,
    term_name text,
    term_definition text,
    term_explanation text,
    view_count integer DEFAULT 0
) RETURNS float AS $$
BEGIN
    RETURN (
        -- Name match gets highest priority (weight 4)
        ts_rank_cd(to_tsvector('english', term_name), plainto_tsquery('english', search_query)) * 4.0 +
        
        -- Definition match gets medium priority (weight 2)
        ts_rank_cd(to_tsvector('english', COALESCE(term_definition, '')), plainto_tsquery('english', search_query)) * 2.0 +
        
        -- Explanation match gets lower priority (weight 1)
        ts_rank_cd(to_tsvector('english', COALESCE(term_explanation, '')), plainto_tsquery('english', search_query)) * 1.0 +
        
        -- Popularity boost based on view count (logarithmic scaling)
        (CASE WHEN view_count > 0 THEN LOG(view_count) * 0.1 ELSE 0 END)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function for fuzzy search similarity
CREATE OR REPLACE FUNCTION calculate_similarity_score(
    search_query text,
    term_name text
) RETURNS float AS $$
BEGIN
    RETURN GREATEST(
        similarity(search_query, term_name),
        similarity(search_query, split_part(term_name, ' ', 1)),
        similarity(search_query, split_part(term_name, ' ', 2))
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- 5. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================================================

-- Create composite index for category filtering with full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_category_fulltext_idx 
ON terms (category_id, (to_tsvector('english', name || ' ' || COALESCE(definition, ''))));

-- Create index for difficulty and popularity combined searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_difficulty_popularity_idx 
ON terms (difficulty, view_count DESC, created_at DESC);

-- =============================================================================
-- 6. MAINTENANCE AND MONITORING
-- =============================================================================

-- Create index usage statistics view for monitoring
CREATE OR REPLACE VIEW search_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_blks_read,
    idx_blks_hit
FROM pg_stat_user_indexes 
WHERE indexname LIKE '%search%' OR indexname LIKE '%trgm%' OR indexname LIKE '%fulltext%'
ORDER BY idx_tup_read DESC;

-- Create a function to refresh search statistics
CREATE OR REPLACE FUNCTION refresh_search_stats() RETURNS void AS $$
BEGIN
    -- Update table statistics for better query planning
    ANALYZE terms;
    ANALYZE categories;
    ANALYZE subcategories;
    
    -- Log refresh
    RAISE NOTICE 'Search statistics refreshed at %', now();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. PERFORMANCE HINTS
-- =============================================================================

/*
Performance Notes:
1. The GIN indexes will significantly speed up full-text search queries
2. Trigram indexes enable fuzzy matching for typos and partial matches
3. Composite indexes support filtered searches (e.g., search within category)
4. The ranking function prioritizes name matches over content matches
5. Use CONCURRENTLY to avoid blocking table access during index creation

Usage Examples:

-- Fast full-text search
SELECT * FROM terms 
WHERE to_tsvector('english', name || ' ' || definition) @@ plainto_tsquery('english', 'machine learning');

-- Fuzzy search with similarity
SELECT *, similarity('neural', name) as sim 
FROM terms 
WHERE similarity('neural', name) > 0.3 
ORDER BY sim DESC;

-- Ranked search results
SELECT *, calculate_search_rank('deep learning', name, definition, explanation, view_count) as rank
FROM terms 
WHERE to_tsvector('english', name || ' ' || definition) @@ plainto_tsquery('english', 'deep learning')
ORDER BY rank DESC;
*/

-- Log completion
SELECT 'Full-text search indexes created successfully!' as status;