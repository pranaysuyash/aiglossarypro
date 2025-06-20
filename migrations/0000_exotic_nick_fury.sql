CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "content_analytics" (
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
--> statement-breakpoint
CREATE TABLE "display_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"config_type" varchar(50) NOT NULL,
	"layout" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enhanced_terms" (
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
--> statement-breakpoint
CREATE TABLE "enhanced_user_settings" (
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
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"term_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interactive_elements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"section_name" varchar(100) NOT NULL,
	"element_type" varchar(50) NOT NULL,
	"element_data" jsonb NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "term_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_term_id" uuid NOT NULL,
	"to_term_id" uuid NOT NULL,
	"relationship_type" varchar(50) NOT NULL,
	"strength" integer DEFAULT 5,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "term_sections" (
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
--> statement-breakpoint
CREATE TABLE "term_subcategories" (
	"term_id" uuid NOT NULL,
	"subcategory_id" uuid NOT NULL,
	CONSTRAINT "term_subcategories_term_id_subcategory_id_pk" PRIMARY KEY("term_id","subcategory_id")
);
--> statement-breakpoint
CREATE TABLE "term_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"term_id" uuid NOT NULL,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"short_definition" text,
	"definition" text NOT NULL,
	"category_id" uuid,
	"characteristics" text[],
	"visual_url" text,
	"visual_caption" text,
	"math_formulation" text,
	"applications" jsonb,
	"references" text[],
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "terms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"term_id" uuid NOT NULL,
	"learned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "content_analytics" ADD CONSTRAINT "content_analytics_term_id_enhanced_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "display_configs" ADD CONSTRAINT "display_configs_term_id_enhanced_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enhanced_user_settings" ADD CONSTRAINT "enhanced_user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactive_elements" ADD CONSTRAINT "interactive_elements_term_id_enhanced_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_relationships" ADD CONSTRAINT "term_relationships_from_term_id_enhanced_terms_id_fk" FOREIGN KEY ("from_term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_relationships" ADD CONSTRAINT "term_relationships_to_term_id_enhanced_terms_id_fk" FOREIGN KEY ("to_term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_sections" ADD CONSTRAINT "term_sections_term_id_enhanced_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."enhanced_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_subcategories" ADD CONSTRAINT "term_subcategories_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_subcategories" ADD CONSTRAINT "term_subcategories_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_views" ADD CONSTRAINT "term_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_views" ADD CONSTRAINT "term_views_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_analytics_term_idx" ON "content_analytics" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "content_analytics_section_idx" ON "content_analytics" USING btree ("section_name");--> statement-breakpoint
CREATE INDEX "display_configs_term_idx" ON "display_configs" USING btree ("term_id","config_type");--> statement-breakpoint
CREATE INDEX "enhanced_terms_name_idx" ON "enhanced_terms" USING btree ("name");--> statement-breakpoint
CREATE INDEX "enhanced_terms_slug_idx" ON "enhanced_terms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "enhanced_terms_difficulty_idx" ON "enhanced_terms" USING btree ("difficulty_level");--> statement-breakpoint
CREATE INDEX "enhanced_terms_main_categories_idx" ON "enhanced_terms" USING btree ("main_categories");--> statement-breakpoint
CREATE INDEX "enhanced_terms_search_text_idx" ON "enhanced_terms" USING btree ("search_text");--> statement-breakpoint
CREATE INDEX "favorites_user_term_idx" ON "favorites" USING btree ("user_id","term_id");--> statement-breakpoint
CREATE INDEX "interactive_elements_term_idx" ON "interactive_elements" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "interactive_elements_type_idx" ON "interactive_elements" USING btree ("element_type");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "subcategory_name_category_id_idx" ON "subcategories" USING btree ("name","category_id");--> statement-breakpoint
CREATE INDEX "term_relationships_from_idx" ON "term_relationships" USING btree ("from_term_id");--> statement-breakpoint
CREATE INDEX "term_relationships_to_idx" ON "term_relationships" USING btree ("to_term_id");--> statement-breakpoint
CREATE INDEX "term_relationships_type_idx" ON "term_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "term_section_idx" ON "term_sections" USING btree ("term_id","section_name");--> statement-breakpoint
CREATE INDEX "display_type_idx" ON "term_sections" USING btree ("display_type");--> statement-breakpoint
CREATE INDEX "views_user_term_idx" ON "term_views" USING btree ("user_id","term_id");--> statement-breakpoint
CREATE INDEX "views_viewed_at_idx" ON "term_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "progress_user_term_idx" ON "user_progress" USING btree ("user_id","term_id");