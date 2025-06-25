-- Migration: Add subscription and monetization fields to users table
-- Adds columns required for monetization and access control

ALTER TABLE "users"
  ADD COLUMN "subscription_tier" varchar(20) DEFAULT 'lifetime',
  ADD COLUMN "lifetime_access" boolean DEFAULT true,
  ADD COLUMN "purchase_date" timestamp NULL,
  ADD COLUMN "daily_views" integer DEFAULT 0,
  ADD COLUMN "last_view_reset" timestamp DEFAULT now(); 