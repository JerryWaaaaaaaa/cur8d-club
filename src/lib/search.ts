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

export interface TextSegment {
  text: string;
  matched: boolean;
}

/**
 * Split a string into matched and unmatched runs, for highlighting a result
 * against the query that returned it.
 *
 * Runs off a mask rather than a regex. Nothing needs escaping — a query is
 * ordinary text, and `%` and `_` are already known to reach this far — and
 * overlapping terms merge into one run instead of fighting over the same
 * characters, so searching "type typography" marks the word once.
 *
 * Terms come from `parseSearchTerms`, the same splitter the routers use to
 * build their `ILIKE` patterns, so nothing can be highlighted that wasn't
 * searched for.
 */
export function splitOnMatches(text: string, terms: string[]): TextSegment[] {
  if (terms.length === 0 || text === "") {
    return [{ text, matched: false }];
  }

  const haystack = text.toLowerCase();
  const mask = new Array<boolean>(text.length).fill(false);
  let anyMatch = false;

  for (const term of terms) {
    const needle = term.toLowerCase();
    if (needle === "") continue;

    let from = haystack.indexOf(needle);
    while (from !== -1) {
      mask.fill(true, from, from + needle.length);
      anyMatch = true;
      from = haystack.indexOf(needle, from + 1);
    }
  }

  if (!anyMatch) return [{ text, matched: false }];

  const segments: TextSegment[] = [];
  let start = 0;

  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || mask[i] !== mask[start]) {
      segments.push({ text: text.slice(start, i), matched: mask[start]! });
      start = i;
    }
  }

  return segments;
}
