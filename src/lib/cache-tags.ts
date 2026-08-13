/**
 * The filter dropdowns are built from the distinct values across a whole table,
 * so they only move when a sync writes rows — not between two page views. They
 * are cached under this tag and both sync routes drop it when they finish, so a
 * new tag or industry is live the moment it lands rather than at the end of a
 * timeout.
 */
export const FILTER_OPTIONS_TAG = "filter-options";

/** Backstop for anything that edits rows without going through a sync route. */
export const FILTER_OPTIONS_REVALIDATE_SECONDS = 60 * 60;
