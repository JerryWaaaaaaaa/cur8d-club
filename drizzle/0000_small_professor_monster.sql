CREATE TABLE IF NOT EXISTS "cur8d_collectable" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"name" varchar(256) NOT NULL,
	"type" text,
	"tags" text[],
	"website_url" text NOT NULL,
	"og_image_url" text,
	"og_image_last_fetched_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cur8d_submission" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"designer_url" text NOT NULL,
	"expertise_areas" text[] NOT NULL,
	"referrer_url" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "cur8d_collectable" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "created_at_idx" ON "cur8d_submission" USING btree ("created_at");