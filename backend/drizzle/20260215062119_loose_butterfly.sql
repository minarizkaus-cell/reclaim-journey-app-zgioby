-- Add new columns for journal entry updates
ALTER TABLE "journal_entries" ADD COLUMN "had_craving" boolean;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "intensity" integer;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "tools_used" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "outcome" text;--> statement-breakpoint
-- Convert existing triggers data from text[] to jsonb
ALTER TABLE "journal_entries" ALTER COLUMN "triggers" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "triggers" SET DATA TYPE jsonb USING COALESCE(to_jsonb("triggers"::text[]), '[]'::jsonb);--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "triggers" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "triggers" SET NOT NULL;--> statement-breakpoint
-- Set defaults and constraints for new columns
ALTER TABLE "journal_entries" ALTER COLUMN "had_craving" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "tools_used" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "outcome" SET NOT NULL;--> statement-breakpoint
-- Add user profile columns
ALTER TABLE "user" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "sponsor_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "sponsor_phone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "timer_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "sobriety_date" date;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Drop old mood column
ALTER TABLE "journal_entries" DROP COLUMN "mood";
