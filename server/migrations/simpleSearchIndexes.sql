-- Simplified Full-Text Search Indexes for AIGlossaryPro
-- Basic indexes for improved search performance

-- Enable pg_trgm extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create full-text search index on terms table
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_fulltext_search_idx 
ON terms 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(definition, '') || ' ' || COALESCE(explanation, '')));

-- Create trigram indexes for fuzzy search on term names
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_name_trgm_idx 
ON terms 
USING GIN (name gin_trgm_ops);

-- Create full-text search index on categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS categories_fulltext_search_idx 
ON categories 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Create trigram indexes for category names
CREATE INDEX CONCURRENTLY IF NOT EXISTS categories_name_trgm_idx 
ON categories 
USING GIN (name gin_trgm_ops);

-- Create composite index for category filtering with search
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_category_search_idx 
ON terms (category_id, name);

-- Create index for difficulty filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_difficulty_search_idx 
ON terms (difficulty, name);

-- Create index for popularity-based search results
CREATE INDEX CONCURRENTLY IF NOT EXISTS terms_viewcount_name_idx 
ON terms (view_count DESC, name);

-- Update table statistics for better query planning
ANALYZE terms;
ANALYZE categories;
ANALYZE subcategories;