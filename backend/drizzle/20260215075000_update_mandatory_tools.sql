-- Update is_mandatory status for coping tools
-- Set is_mandatory=true ONLY for the 5 specified tools
UPDATE "coping_tools" SET "is_mandatory" = true WHERE "id" IN ('tool-deep-breathing', 'tool-box-breathing', 'tool-grounding', 'tool-delay-10', 'tool-change-location');--> statement-breakpoint
-- Set is_mandatory=false for all other tools
UPDATE "coping_tools" SET "is_mandatory" = false WHERE "id" NOT IN ('tool-deep-breathing', 'tool-box-breathing', 'tool-grounding', 'tool-delay-10', 'tool-change-location');
