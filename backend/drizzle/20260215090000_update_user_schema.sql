-- Add registration_timestamp column to user table
ALTER TABLE "user" ADD COLUMN "registration_timestamp" timestamp with time zone;--> statement-breakpoint
-- Drop sponsor columns
ALTER TABLE "user" DROP COLUMN IF EXISTS "sponsor_name";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "sponsor_phone";
