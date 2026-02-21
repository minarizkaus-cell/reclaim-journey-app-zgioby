DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'registration_timestamp') THEN
    ALTER TABLE "user" ADD COLUMN "registration_timestamp" timestamp with time zone;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'sponsor_name') THEN
    ALTER TABLE "user" DROP COLUMN "sponsor_name";
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'sponsor_phone') THEN
    ALTER TABLE "user" DROP COLUMN "sponsor_phone";
  END IF;
END $$;