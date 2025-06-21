-- Migration: Add isAdmin field to users table for role-based authentication
-- Date: 2025-01-20

ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false;

-- Set admin@example.com as admin if it exists
UPDATE "users" SET "is_admin" = true WHERE "email" = 'admin@example.com';

-- Add index for admin queries
CREATE INDEX "users_is_admin_idx" ON "users" ("is_admin"); 