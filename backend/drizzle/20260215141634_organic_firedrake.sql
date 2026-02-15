ALTER TABLE "user" ADD COLUMN "registration_timestamp" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "sponsor_name";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "sponsor_phone";