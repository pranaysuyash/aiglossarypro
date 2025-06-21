-- Migration: Add AI Content Feedback and Verification System
-- This migration adds comprehensive tracking for AI-generated content quality and user feedback

-- AI Content Feedback Table
CREATE TABLE IF NOT EXISTS "ai_content_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"user_id" varchar,
	"feedback_type" varchar(50) NOT NULL,
	"section" varchar(100),
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'pending',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"user_agent" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- AI Content Verification Table
CREATE TABLE IF NOT EXISTS "ai_content_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"is_ai_generated" boolean DEFAULT false,
	"ai_model" varchar(50),
	"generated_at" timestamp,
	"generated_by" varchar,
	"verification_status" varchar(20) DEFAULT 'unverified',
	"verified_by" varchar,
	"verified_at" timestamp,
	"accuracy_score" integer,
	"completeness_score" integer,
	"clarity_score" integer,
	"expert_review_required" boolean DEFAULT false,
	"expert_reviewer" varchar,
	"expert_review_notes" text,
	"expert_reviewed_at" timestamp,
	"confidence_level" varchar(20) DEFAULT 'medium',
	"last_reviewed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- AI Usage Analytics Table
CREATE TABLE IF NOT EXISTS "ai_usage_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation" varchar(50) NOT NULL,
	"model" varchar(50) NOT NULL,
	"user_id" varchar,
	"term_id" uuid,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"cost" numeric(10,6),
	"success" boolean DEFAULT true,
	"error_type" varchar(100),
	"error_message" text,
	"user_accepted" boolean,
	"user_rating" integer,
	"session_id" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add Foreign Key Constraints
DO $$ BEGIN
 ALTER TABLE "ai_content_feedback" ADD CONSTRAINT "ai_content_feedback_term_id_enhanced_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "enhanced_terms"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_content_feedback" ADD CONSTRAINT "ai_content_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_content_feedback" ADD CONSTRAINT "ai_content_feedback_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_content_verification" ADD CONSTRAINT "ai_content_verification_term_id_enhanced_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "enhanced_terms"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_content_verification" ADD CONSTRAINT "ai_content_verification_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "users"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_content_verification" ADD CONSTRAINT "ai_content_verification_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "users"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_content_verification" ADD CONSTRAINT "ai_content_verification_expert_reviewer_users_id_fk" FOREIGN KEY ("expert_reviewer") REFERENCES "users"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_usage_analytics" ADD CONSTRAINT "ai_usage_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_usage_analytics" ADD CONSTRAINT "ai_usage_analytics_term_id_enhanced_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "enhanced_terms"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS "ai_feedback_term_idx" ON "ai_content_feedback" ("term_id");
CREATE INDEX IF NOT EXISTS "ai_feedback_status_idx" ON "ai_content_feedback" ("status");
CREATE INDEX IF NOT EXISTS "ai_feedback_user_idx" ON "ai_content_feedback" ("user_id");

CREATE INDEX IF NOT EXISTS "ai_verification_term_idx" ON "ai_content_verification" ("term_id");
CREATE INDEX IF NOT EXISTS "ai_verification_status_idx" ON "ai_content_verification" ("verification_status");
CREATE INDEX IF NOT EXISTS "ai_verification_generated_idx" ON "ai_content_verification" ("is_ai_generated");

CREATE INDEX IF NOT EXISTS "ai_usage_operation_idx" ON "ai_usage_analytics" ("operation");
CREATE INDEX IF NOT EXISTS "ai_usage_model_idx" ON "ai_usage_analytics" ("model");
CREATE INDEX IF NOT EXISTS "ai_usage_user_idx" ON "ai_usage_analytics" ("user_id");
CREATE INDEX IF NOT EXISTS "ai_usage_date_idx" ON "ai_usage_analytics" ("created_at");

-- Add Comments for Documentation
COMMENT ON TABLE "ai_content_feedback" IS 'User feedback on AI-generated content quality and accuracy';
COMMENT ON TABLE "ai_content_verification" IS 'Verification status and quality metrics for AI-generated content';
COMMENT ON TABLE "ai_usage_analytics" IS 'Analytics and monitoring for AI service usage and performance';

COMMENT ON COLUMN "ai_content_feedback"."feedback_type" IS 'Type of feedback: incorrect, incomplete, misleading, outdated, other';
COMMENT ON COLUMN "ai_content_feedback"."severity" IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN "ai_content_feedback"."status" IS 'Review status: pending, reviewing, resolved, dismissed';

COMMENT ON COLUMN "ai_content_verification"."verification_status" IS 'Status: unverified, verified, flagged, needs_review, expert_reviewed';
COMMENT ON COLUMN "ai_content_verification"."confidence_level" IS 'AI confidence: low, medium, high';

COMMENT ON COLUMN "ai_usage_analytics"."operation" IS 'AI operation: generate_definition, improve_definition, semantic_search, suggest_terms'; 