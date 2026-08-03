// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import {
  boolean,
  index,
  pgTableCreator,
  timestamp,
  varchar,
  text,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `cur8d_${name}`);

export const collectables = createTable(
  "collectable",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    name: varchar("name", { length: 256 }).notNull(),
    type: text("type"),
    tags: text("tags").array(),
    websiteUrl: text("website_url").notNull(),
    ogImageUrl: text("og_image_url"),
    ogImageLastFetchedAt: timestamp("og_image_last_fetched_at", {
      withTimezone: true,
    }),

    // Written by the sync from the designer's own site — see `ai-summary.ts`.
    aiDescription: text("ai_description"),
    aiDescriptionGeneratedAt: timestamp("ai_description_generated_at", {
      withTimezone: true,
    }),

    // Read off the same page in the same pass as the description. Any of them
    // can stay null — plenty of portfolios never say where their owner lives or
    // who they work for. `company` holds "Freelance" for the independents.
    location: text("location"),
    company: text("company"),
    title: text("title"),
    // Stamped on every profile pass, whether or not anything was found, so rows
    // whose site gives nothing aren't re-read on every sync.
    profileGeneratedAt: timestamp("profile_generated_at", {
      withTimezone: true,
    }),
    // Whether the last pass got any text off the page at all, which is what
    // separates the two reasons a field above is null. False is a site that
    // cannot be read — rendered client-side, or behind a block — and says
    // nothing about the designer. True means the page was read and simply does
    // not mention where they are or who they work for, which no amount of
    // re-reading will change. Null is a row no pass has reached yet.
    profilePageRead: boolean("profile_page_read"),

    isReported: boolean("is_reported").notNull().default(false),
    isBroken: boolean("is_broken").notNull().default(false),
  },
  (example) => ({
    nameIndex: index("name_idx").on(example.name),
  }),
);

export const caseStudies = createTable(
  "case_study",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    name: varchar("name", { length: 256 }).notNull(),
    websiteUrl: text("website_url"),

    // "video" when a demo video is available, otherwise "website".
    mediaType: text("media_type").notNull().default("website"),
    videoUrl: text("video_url"),
    posterUrl: text("poster_url"),

    // Screenshot cover, only fetched for website-type entries.
    coverImageUrl: text("cover_image_url"),
    coverImageLastFetchedAt: timestamp("cover_image_last_fetched_at", {
      withTimezone: true,
    }),

    // Notion "Type" is a multi-select here, unlike the designer database.
    types: text("types").array(),
    industries: text("industries").array(),
    infoRole: text("info_role"),
    infoTeam: text("info_team"),

    // Raw source copy (e.g. tweet text) used as AI summary input when the
    // linked page cannot be scraped.
    sourceText: text("source_text"),
    aiSummary: text("ai_summary"),
    aiSummaryGeneratedAt: timestamp("ai_summary_generated_at", {
      withTimezone: true,
    }),

    isBroken: boolean("is_broken").notNull().default(false),
  },
  (caseStudy) => ({
    nameIndex: index("case_study_name_idx").on(caseStudy.name),
  }),
);

export const submissions = createTable(
  "submission",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    designerUrl: text("designer_url").notNull(),
    expertiseAreas: text("expertise_areas").array().notNull(),
    referrerUrl: text("referrer_url"),
  },
  (submission) => ({
    createdAtIndex: index("created_at_idx").on(submission.createdAt),
  }),
);
