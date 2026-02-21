-- Create case-insensitive unique index for email
DO $$ BEGIN
  -- Drop the old case-sensitive unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user' AND constraint_name = 'user_email_unique'
  ) THEN
    ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";
    RAISE NOTICE 'Dropped case-sensitive email constraint';
  END IF;
END $$;--> statement-breakpoint
-- Create case-insensitive unique index on lowercase email
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'user' AND indexname = 'user_email_lower_unique'
  ) THEN
    CREATE UNIQUE INDEX user_email_lower_unique ON "user" (LOWER("email"));
    RAISE NOTICE 'Created case-insensitive unique index on email';
  ELSE
    RAISE NOTICE 'Case-insensitive unique index already exists';
  END IF;
END $$;--> statement-breakpoint
-- Normalize all existing emails to lowercase
DO $$ BEGIN
  UPDATE "user" SET "email" = LOWER("email") WHERE "email" != LOWER("email");
  RAISE NOTICE 'Normalized existing emails to lowercase';
END $$;
