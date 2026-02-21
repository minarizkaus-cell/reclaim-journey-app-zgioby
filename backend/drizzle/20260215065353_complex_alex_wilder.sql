CREATE TABLE IF NOT EXISTS "coping_tool_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tool_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coping_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"duration" text NOT NULL,
	"steps" jsonb NOT NULL,
	"when_to_use" text NOT NULL,
	"is_mandatory" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "craving_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"triggers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"intensity" integer NOT NULL,
	"need_type" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coping_tool_completions_user_id_user_id_fk') THEN
    ALTER TABLE "coping_tool_completions" ADD CONSTRAINT "coping_tool_completions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coping_tool_completions_tool_id_coping_tools_id_fk') THEN
    ALTER TABLE "coping_tool_completions" ADD CONSTRAINT "coping_tool_completions_tool_id_coping_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."coping_tools"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coping_tool_completions_session_id_craving_sessions_id_fk') THEN
    ALTER TABLE "coping_tool_completions" ADD CONSTRAINT "coping_tool_completions_session_id_craving_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."craving_sessions"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'craving_sessions_user_id_user_id_fk') THEN
    ALTER TABLE "craving_sessions" ADD CONSTRAINT "craving_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;