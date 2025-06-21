-- Add performance indexes for categories, terms, and subcategories
-- This migration addresses the 15-51 second response times for categories API

-- Add index for subcategories.category_id (critical for the N+1 query fix)
CREATE INDEX IF NOT EXISTS "subcategories_category_id_idx" ON "subcategories" ("category_id");

-- Add full-text search indexes for terms
CREATE INDEX IF NOT EXISTS "terms_name_gin_idx" ON "terms" USING gin(to_tsvector('english', "name"));
CREATE INDEX IF NOT EXISTS "terms_definition_gin_idx" ON "terms" USING gin(to_tsvector('english', "definition"));

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "terms_category_view_count_idx" ON "terms" ("category_id", "view_count" DESC);
CREATE INDEX IF NOT EXISTS "terms_category_created_at_idx" ON "terms" ("category_id", "created_at" DESC);

-- Add index for term_subcategories junction table performance
CREATE INDEX IF NOT EXISTS "term_subcategories_term_id_idx" ON "term_subcategories" ("term_id");
CREATE INDEX IF NOT EXISTS "term_subcategories_subcategory_id_idx" ON "term_subcategories" ("subcategory_id");

-- Add indexes for user-related queries
CREATE INDEX IF NOT EXISTS "favorites_user_id_idx" ON "favorites" ("user_id");
CREATE INDEX IF NOT EXISTS "user_progress_user_id_idx" ON "user_progress" ("user_id");
CREATE INDEX IF NOT EXISTS "term_views_term_id_idx" ON "term_views" ("term_id");

-- Add index for categories name for faster sorting
CREATE INDEX IF NOT EXISTS "categories_name_lower_idx" ON "categories" (LOWER("name"));

-- Add partial indexes for non-null values
CREATE INDEX IF NOT EXISTS "terms_category_id_not_null_idx" ON "terms" ("category_id") WHERE "category_id" IS NOT NULL;

-- Terms table indexes
CREATE INDEX IF NOT EXISTS "terms_name_idx" ON "terms" ("name");
CREATE INDEX IF NOT EXISTS "terms_category_idx" ON "terms" ("category_id");
CREATE INDEX IF NOT EXISTS "terms_view_count_idx" ON "terms" ("view_count");
CREATE INDEX IF NOT EXISTS "terms_created_at_idx" ON "terms" ("created_at");
CREATE INDEX IF NOT EXISTS "terms_updated_at_idx" ON "terms" ("updated_at");

-- Full-text search indexes for terms
CREATE INDEX IF NOT EXISTS "terms_name_search_idx" ON "terms" USING gin(to_tsvector('english', "name"));
CREATE INDEX IF NOT EXISTS "terms_definition_search_idx" ON "terms" USING gin(to_tsvector('english', "definition"));

-- Categories table indexes
CREATE INDEX IF NOT EXISTS "categories_name_idx" ON "categories" ("name");

-- User activity indexes
CREATE INDEX IF NOT EXISTS "favorites_user_created_idx" ON "favorites" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "user_progress_user_learned_idx" ON "user_progress" ("user_id", "learned_at" DESC);
CREATE INDEX IF NOT EXISTS "term_views_term_viewed_idx" ON "term_views" ("term_id", "viewed_at" DESC); 