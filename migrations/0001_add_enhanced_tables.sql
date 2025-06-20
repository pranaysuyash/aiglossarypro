-- Migration to add enhanced schema tables safely
-- This migration adds the new enhanced tables while preserving existing data

-- Enhanced terms table with complex categorization
CREATE TABLE IF NOT EXISTS "enhanced_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(250) NOT NULL,
	"short_definition" text,
	"full_definition" text NOT NULL,
	"main_categories" text[] DEFAULT '{}',
	"sub_categories" text[] DEFAULT '{}',
	"related_concepts" text[] DEFAULT '{}',
	"application_domains" text[] DEFAULT '{}',
	"techniques" text[] DEFAULT '{}',
	"difficulty_level" varchar(20),
	"has_implementation" boolean DEFAULT false,
	"has_interactive_elements" boolean DEFAULT false,
	"has_case_studies" boolean DEFAULT false,
	"has_code_examples" boolean DEFAULT false,
	"search_text" text,
	"keywords" text[] DEFAULT '{}',
	"view_count" integer DEFAULT 0,
	"last_viewed" timestamp,
	"parse_hash" varchar(32),
	"parse_version" varchar(10) DEFAULT '1.0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "enhanced_terms_name_unique" UNIQUE("name"),
	CONSTRAINT "enhanced_terms_slug_unique" UNIQUE("slug")
);

-- Content sections table - stores structured data from the 42 sections
CREATE TABLE IF NOT EXISTS "term_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"section_name" varchar(100) NOT NULL,
	"section_data" jsonb NOT NULL,
	"display_type" varchar(20) NOT NULL,
	"priority" integer DEFAULT 5,
	"is_interactive" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Interactive elements table - stores references to interactive content
CREATE TABLE IF NOT EXISTS "interactive_elements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"section_name" varchar(100) NOT NULL,
	"element_type" varchar(50) NOT NULL,
	"element_data" jsonb NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

-- Term relationships - for related concepts and prerequisites
CREATE TABLE IF NOT EXISTS "term_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_term_id" uuid NOT NULL,
	"to_term_id" uuid NOT NULL,
	"relationship_type" varchar(50) NOT NULL,
	"strength" integer DEFAULT 5,
	"created_at" timestamp DEFAULT now()
);

-- Display configurations - customizable layouts per term
CREATE TABLE IF NOT EXISTS "display_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"config_type" varchar(50) NOT NULL,
	"layout" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);

-- Enhanced user preferences for personalized display
CREATE TABLE IF NOT EXISTS "enhanced_user_settings" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"experience_level" varchar(20) DEFAULT 'intermediate',
	"preferred_sections" text[] DEFAULT '{}',
	"hidden_sections" text[] DEFAULT '{}',
	"show_mathematical_details" boolean DEFAULT true,
	"show_code_examples" boolean DEFAULT true,
	"show_interactive_elements" boolean DEFAULT true,
	"favorite_categories" text[] DEFAULT '{}',
	"favorite_applications" text[] DEFAULT '{}',
	"compact_mode" boolean DEFAULT false,
	"dark_mode" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Analytics for content optimization
CREATE TABLE IF NOT EXISTS "content_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"section_name" varchar(100),
	"views" integer DEFAULT 0,
	"time_spent_seconds" integer DEFAULT 0,
	"interaction_count" integer DEFAULT 0,
	"user_rating" integer,
	"helpfulness_votes" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "term_sections" ADD CONSTRAINT "term_sections_term_id_enhanced_terms_id_fk" 
  FOREIGN KEY ("term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "interactive_elements" ADD CONSTRAINT "interactive_elements_term_id_enhanced_terms_id_fk" 
  FOREIGN KEY ("term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "term_relationships" ADD CONSTRAINT "term_relationships_from_term_id_enhanced_terms_id_fk" 
  FOREIGN KEY ("from_term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "term_relationships" ADD CONSTRAINT "term_relationships_to_term_id_enhanced_terms_id_fk" 
  FOREIGN KEY ("to_term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "display_configs" ADD CONSTRAINT "display_configs_term_id_enhanced_terms_id_fk" 
  FOREIGN KEY ("term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "enhanced_user_settings" ADD CONSTRAINT "enhanced_user_settings_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "content_analytics" ADD CONSTRAINT "content_analytics_term_id_enhanced_terms_id_fk" 
  FOREIGN KEY ("term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS "enhanced_terms_name_idx" ON "enhanced_terms" USING btree ("name");
CREATE INDEX IF NOT EXISTS "enhanced_terms_slug_idx" ON "enhanced_terms" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "enhanced_terms_difficulty_idx" ON "enhanced_terms" USING btree ("difficulty_level");
CREATE INDEX IF NOT EXISTS "enhanced_terms_main_categories_idx" ON "enhanced_terms" USING btree ("main_categories");
CREATE INDEX IF NOT EXISTS "enhanced_terms_search_text_idx" ON "enhanced_terms" USING btree ("search_text");

CREATE INDEX IF NOT EXISTS "term_section_idx" ON "term_sections" USING btree ("term_id","section_name");
CREATE INDEX IF NOT EXISTS "display_type_idx" ON "term_sections" USING btree ("display_type");

CREATE INDEX IF NOT EXISTS "interactive_elements_term_idx" ON "interactive_elements" USING btree ("term_id");
CREATE INDEX IF NOT EXISTS "interactive_elements_type_idx" ON "interactive_elements" USING btree ("element_type");

CREATE INDEX IF NOT EXISTS "term_relationships_from_idx" ON "term_relationships" USING btree ("from_term_id");
CREATE INDEX IF NOT EXISTS "term_relationships_to_idx" ON "term_relationships" USING btree ("to_term_id");
CREATE INDEX IF NOT EXISTS "term_relationships_type_idx" ON "term_relationships" USING btree ("relationship_type");

CREATE INDEX IF NOT EXISTS "display_configs_term_idx" ON "display_configs" USING btree ("term_id","config_type");

CREATE INDEX IF NOT EXISTS "content_analytics_term_idx" ON "content_analytics" USING btree ("term_id");
CREATE INDEX IF NOT EXISTS "content_analytics_section_idx" ON "content_analytics" USING btree ("section_name");