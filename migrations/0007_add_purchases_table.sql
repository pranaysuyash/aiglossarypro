-- Migration: Add purchases table for Gumroad integration
-- This table was defined in schema.ts but missing from database

CREATE TABLE IF NOT EXISTS "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar REFERENCES "users"("id"),
	"gumroad_order_id" varchar UNIQUE NOT NULL,
	"amount" integer,
	"currency" varchar(3) DEFAULT 'USD',
	"status" varchar DEFAULT 'completed',
	"purchase_data" jsonb,
	"created_at" timestamp DEFAULT now()
);

-- Create indexes for the purchases table
CREATE INDEX IF NOT EXISTS "purchases_user_idx" ON "purchases" ("user_id");
CREATE INDEX IF NOT EXISTS "purchases_order_idx" ON "purchases" ("gumroad_order_id");
CREATE INDEX IF NOT EXISTS "purchases_status_idx" ON "purchases" ("status"); 