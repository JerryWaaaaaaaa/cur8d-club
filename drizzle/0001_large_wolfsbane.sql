CREATE TABLE IF NOT EXISTS "cur8d_case_study" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"name" varchar(256) NOT NULL,
	"website_url" text,
	"media_type" text DEFAULT 'website' NOT NULL,
	"video_url" text,
	"poster_url" text,
	"cover_image_url" text,
	"cover_image_last_fetched_at" timestamp with time zone,
	"types" text[],
	"industries" text[],
	"info_role" text,
	"info_team" text,
	"source_text" text,
	"ai_summary" text,
	"ai_summary_generated_at" timestamp with time zone,
	"is_broken" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cur8d_collectable" ADD COLUMN IF NOT EXISTS "ai_description" text;--> statement-breakpoint
ALTER TABLE "cur8d_collectable" ADD COLUMN IF NOT EXISTS "ai_description_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cur8d_collectable" ADD COLUMN IF NOT EXISTS "location" text;--> statement-breakpoint
ALTER TABLE "cur8d_collectable" ADD COLUMN IF NOT EXISTS "company" text;--> statement-breakpoint
ALTER TABLE "cur8d_collectable" ADD COLUMN IF NOT EXISTS "title" text;--> statement-breakpoint
ALTER TABLE "cur8d_collectable" ADD COLUMN IF NOT EXISTS "profile_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cur8d_collectable" ADD COLUMN IF NOT EXISTS "is_reported" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cur8d_collectable" ADD COLUMN IF NOT EXISTS "is_broken" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_study_name_idx" ON "cur8d_case_study" USING btree ("name");