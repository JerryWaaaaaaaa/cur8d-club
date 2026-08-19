// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import {
  boolean,
  index,
  integer,
  pgTableCreator,
  timestamp,
  uniqueIndex,
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
    // Stamped on every meta pass, found or not — the column name predates the
    // pass reading anything besides the OG image. It now records when the site
    // was last read for both that and the handle below, which is what keeps a
    // site that yields neither from being re-fetched on every single run.
    ogImageLastFetchedAt: timestamp("og_image_last_fetched_at", {
      withTimezone: true,
    }),

    // Screenshot of the designer's own site, and the card's cover. `ogImageUrl`
    // stays behind it as the fallback: capture is rate-limited and plenty of
    // sites refuse it outright, so a good many rows will never have one.
    screenshotUrl: text("screenshot_url"),
    screenshotLastFetchedAt: timestamp("screenshot_last_fetched_at", {
      withTimezone: true,
    }),

    // The designer's X handle, without the @, read off their own site during
    // the meta pass. Null is the common case and not a failure — most sites
    // never link a profile.
    twitterHandle: text("twitter_handle"),
    // Their X avatar, mirrored into Blob rather than linked: twimg URLs rot the
    // same way Notion's do, which is why `blob-storage.ts` exists.
    avatarUrl: text("avatar_url"),
    avatarLastFetchedAt: timestamp("avatar_last_fetched_at", {
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

/**
 * An agent skill, in the skills.sh sense: a SKILL.md a coding agent can install.
 *
 * Unlike the two tables above, nothing here mirrors Notion. Rows arrive from
 * `scripts/import-skill-sets.ts` as a one-time import and the database owns
 * them afterwards, which is why there is no freshness stamp on the row itself
 * and no origin flag — no sync pass exists to delete what it doesn't recognise.
 */
export const skills = createTable(
  "skill",
  {
    // Derived deterministically from `sourceRepo#skillKey` rather than random,
    // so re-running the import updates rows instead of duplicating them.
    id: varchar("id", { length: 36 }).primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    name: varchar("name", { length: 256 }).notNull(),

    // Install identity. `sourceRepo` is the `owner/repo` shorthand that
    // `npx skills add` takes; `skillKey` is the `--skill` name, null when the
    // repo is itself a single skill. Two columns rather than one prewritten
    // command so a set can group its skills by repo — the sets being imported
    // average nine skills across five repos, which is five commands, not nine.
    sourceRepo: text("source_repo"),
    skillKey: text("skill_key"),
    // Escape hatch for what that pair cannot express — a GitLab URL, a direct
    // download. Wins over the pair above when present.
    installCommand: text("install_command"),

    // A deep link to the skill's own directory, when one is known. Null is the
    // common case and not a gap: the repo URL is derivable from `sourceRepo`,
    // so storing it here would only duplicate it, and callers fall back to
    // `https://github.com/{sourceRepo}`.
    sourceUrl: text("source_url"),

    description: text("description"),

    // "domain" — specific to a set's subject — or "universal", the workflow
    // skills (grill-me, find-skills, writing-plans) that recur across sets
    // whatever their topic. A property of the skill rather than of one
    // membership: a skill that is universal in one set is universal in every
    // set carrying it. Only the universal ones are badged in the set view.
    kind: text("kind"),

    author: text("author"),
    // The repo owner's avatar, mirrored into Blob rather than linked. It
    // belongs to the owner and not the skill, so the import fetches it once
    // per owner — the alternative is nine identical copies of the anthropics
    // avatar for the nine skills of theirs these sets reference.
    authorAvatarUrl: text("author_avatar_url"),
    authorAvatarLastFetchedAt: timestamp("author_avatar_last_fetched_at", {
      withTimezone: true,
    }),

    isBroken: boolean("is_broken").notNull().default(false),
  },
  (skill) => ({
    nameIndex: index("skill_name_idx").on(skill.name),
  }),
);

/**
 * A curated bundle of skills, and the reason this tab exists. The payload is
 * the install text built from its members — see `src/lib/skill-install-text.ts`
 * — rather than a link out, which makes it the first record in the app whose
 * point is something you copy.
 */
export const skillSets = createTable(
  "skill_set",
  {
    // Deterministic from `slug`, for the same idempotency reason as above.
    id: varchar("id", { length: 36 }).primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    name: varchar("name", { length: 256 }).notNull(),

    // URL identity — `?set=brand-identity-foundation`, slugified from the name.
    // The only slug in the app; every other view addresses rows by filter
    // rather than by identity. Globally unique is right while the owner is the
    // only curator, and would need a handle prefix if sets ever came from
    // anyone else.
    slug: text("slug").notNull(),

    description: text("description"),
    // The set's category, and what picks its accent colour in
    // `src/lib/set-accents.ts`. Scalar rather than an array: one badge leads
    // the card, so a list would only raise the question of which to show.
    useCase: text("use_case"),

    // Member ids in display order, domain skills first. The app has no foreign
    // keys, no join tables and no joins anywhere; an array also carries order
    // for free, where a join table would need a position column. Nothing
    // enforces that an id still resolves — see the reader in
    // `src/server/api/routers/skill-set.ts`, which treats that as expected.
    skillIds: text("skill_ids").array(),

    // Replaces the default lead-in of the copied agent prompt, per set.
    promptIntro: text("prompt_intro"),
    // Card order on the index. Nulls sort last, as everywhere else.
    sortOrder: integer("sort_order"),

    // Attribution, for sets submitted by someone other than the owner. Null on
    // curated sets, which is what tells the two apart. One provider/handle
    // pair rather than a column per network: the card shows one face, and the
    // avatar service resolves exactly one provider at a time.
    submitterProvider: text("submitter_provider"),
    submitterHandle: text("submitter_handle"),
    submitterAvatarUrl: text("submitter_avatar_url"),
    submitterAvatarLastFetchedAt: timestamp("submitter_avatar_last_fetched_at", {
      withTimezone: true,
    }),

    isBroken: boolean("is_broken").notNull().default(false),
  },
  (skillSet) => ({
    slugIndex: uniqueIndex("skill_set_slug_idx").on(skillSet.slug),
  }),
);

/**
 * A set someone submitted rather than curated. Nothing writes here yet — the
 * flow is designed in TODO.md — but the table ships with its siblings so the
 * schema SQL is applied to the deployed database once rather than twice.
 *
 * URLs are stored exactly as pasted rather than resolved into `skills` rows on
 * arrival: nothing unreviewed should reach a published table, and normalising
 * once at approval is when someone is already looking at it.
 */
export const skillSetSubmissions = createTable(
  "skill_set_submission",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    name: varchar("name", { length: 256 }).notNull(),
    description: text("description"),
    useCase: text("use_case"),
    skillUrls: text("skill_urls").array().notNull(),
    submitterProvider: text("submitter_provider"),
    submitterHandle: text("submitter_handle"),
  },
  (skillSetSubmission) => ({
    createdAtIndex: index("skill_set_submission_created_at_idx").on(
      skillSetSubmission.createdAt,
    ),
  }),
);
