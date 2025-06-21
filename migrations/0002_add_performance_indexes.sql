-- Add performance indexes for critical queries

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

-- Term-subcategories junction table indexes
CREATE INDEX IF NOT EXISTS "term_subcategories_term_idx" ON "term_subcategories" ("term_id");
CREATE INDEX IF NOT EXISTS "term_subcategories_subcategory_idx" ON "term_subcategories" ("subcategory_id");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "terms_category_view_count_idx" ON "terms" ("category_id", "view_count" DESC);
CREATE INDEX IF NOT EXISTS "terms_category_name_idx" ON "terms" ("category_id", "name");

-- User activity indexes
CREATE INDEX IF NOT EXISTS "favorites_user_created_idx" ON "favorites" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "user_progress_user_learned_idx" ON "user_progress" ("user_id", "learned_at" DESC);
CREATE INDEX IF NOT EXISTS "term_views_term_viewed_idx" ON "term_views" ("term_id", "viewed_at" DESC); 