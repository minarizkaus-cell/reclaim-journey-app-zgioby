-- Add new columns for journal entry updates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'had_craving') THEN
    ALTER TABLE "journal_entries" ADD COLUMN "had_craving" boolean;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'intensity') THEN
    ALTER TABLE "journal_entries" ADD COLUMN "intensity" integer;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'tools_used') THEN
    ALTER TABLE "journal_entries" ADD COLUMN "tools_used" jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'outcome') THEN
    ALTER TABLE "journal_entries" ADD COLUMN "outcome" text;
  END IF;
END $$;--> statement-breakpoint
-- Convert existing triggers data from text[] to jsonb (if needed)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'triggers' AND udt_name = 'text') THEN
    ALTER TABLE "journal_entries" ALTER COLUMN "triggers" DROP NOT NULL;
    ALTER TABLE "journal_entries" ALTER COLUMN "triggers" SET DATA TYPE jsonb USING COALESCE(to_jsonb("triggers"::text[]), '[]'::jsonb);
    ALTER TABLE "journal_entries" ALTER COLUMN "triggers" SET DEFAULT '[]'::jsonb;
    ALTER TABLE "journal_entries" ALTER COLUMN "triggers" SET NOT NULL;
  END IF;
END $$;--> statement-breakpoint
-- Set defaults and constraints for new columns
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'had_craving' AND is_nullable = 'YES') THEN
    ALTER TABLE "journal_entries" ALTER COLUMN "had_craving" SET NOT NULL;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'tools_used' AND is_nullable = 'YES') THEN
    ALTER TABLE "journal_entries" ALTER COLUMN "tools_used" SET NOT NULL;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'outcome' AND is_nullable = 'YES') THEN
    ALTER TABLE "journal_entries" ALTER COLUMN "outcome" SET NOT NULL;
  END IF;
END $$;--> statement-breakpoint
-- Add user profile columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'display_name') THEN
    ALTER TABLE "user" ADD COLUMN "display_name" text;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'timezone') THEN
    ALTER TABLE "user" ADD COLUMN "timezone" text;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'sponsor_name') THEN
    ALTER TABLE "user" ADD COLUMN "sponsor_name" text;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'sponsor_phone') THEN
    ALTER TABLE "user" ADD COLUMN "sponsor_phone" text;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'emergency_contact_name') THEN
    ALTER TABLE "user" ADD COLUMN "emergency_contact_name" text;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'emergency_contact_phone') THEN
    ALTER TABLE "user" ADD COLUMN "emergency_contact_phone" text;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'timer_minutes') THEN
    ALTER TABLE "user" ADD COLUMN "timer_minutes" integer DEFAULT 15 NOT NULL;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'sobriety_date') THEN
    ALTER TABLE "user" ADD COLUMN "sobriety_date" date;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'onboarded') THEN
    ALTER TABLE "user" ADD COLUMN "onboarded" boolean DEFAULT false NOT NULL;
  END IF;
END $$;--> statement-breakpoint
-- Drop old mood column if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'mood') THEN
    ALTER TABLE "journal_entries" DROP COLUMN "mood";
  END IF;
END $$;
