/**
 * Free-text search shared by the designer and case study listings.
 *
 * Matching is case-insensitive substring, one `ILIKE` per word, ANDed together:
 * "brand tokyo" keeps only rows carrying both words somewhere in their searched
 * columns. Substrings rather than whole words so partial typing works —
 * "typo" finds "typography" while the query is still being written.
 */

/** A query longer than this can only be a paste or an attack. */
const MAX_TERMS = 6;
const MAX_TERM_LENGTH = 64;

/**
 * Split a raw query into the words to match. The listing endpoints are public
 * and unauthenticated, so the caps are what stop one request from building an
 * unbounded `WHERE` clause.
 */
export function parseSearchTerms(query: string | undefined | null): string[] {
  if (!query) return [];

  return query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .slice(0, MAX_TERMS)
    .map((term) => term.slice(0, MAX_TERM_LENGTH));
}

/**
 * Wrap a term for `ILIKE`, escaping the wildcards so a query containing `%` or
 * `_` matches those characters literally. Postgres treats backslash as the
 * escape character for `LIKE` by default, so no `ESCAPE` clause is needed — and
 * the pattern is bound as a parameter, never interpolated.
 */
export function toLikePattern(term: string): string {
  const escaped = term.replace(/[\\%_]/g, (character) => `\\${character}`);

  return `%${escaped}%`;
}
