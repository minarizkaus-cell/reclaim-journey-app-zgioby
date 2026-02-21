-- Ensure email unique constraint exists on user table
DO $$ BEGIN
  -- Check if the unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user' AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%email%'
  ) THEN
    -- If constraint doesn't exist, create it
    ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE ("email");
    RAISE NOTICE 'Created unique constraint on user.email';
  ELSE
    RAISE NOTICE 'Unique constraint on user.email already exists';
  END IF;
END $$;
