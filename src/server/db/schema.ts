// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import {
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
  },
  (example) => ({
    nameIndex: index("name_idx").on(example.name),
  }),
);
