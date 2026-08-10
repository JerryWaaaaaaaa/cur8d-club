import * as cheerio from "cheerio";

const FETCH_TIMEOUT_MS = 10_000;

// Some hosts refuse a request with no User-Agent outright. Naming the crawler
// costs nothing and gets a page back from a few sites that would otherwise 403.
const USER_AGENT = "cur8d-bot/1.0 (+https://cur8d.club)";

// Paths under x.com that are actions or sections rather than people. A site's
// "share this" button links twitter.com/intent/tweet, and taking the first
// segment of that would file every designer on the internet under the handle
// "intent".
const RESERVED_TWITTER_PATHS = new Set([
  "intent",
  "share",
  "home",
  "search",
  "hashtag",
  "explore",
  "messages",
  "notifications",
  "settings",
  "privacy",
  "tos",
  "about",
  "login",
  "signup",
  "i",
]);

const TWITTER_HOSTS = new Set([
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
]);

export interface SiteMeta {
  ogImage: string | null;
  twitterHandle: string | null;
}

/** X's own rule for what a handle may contain. */
function isWellFormedHandle(handle: string): boolean {
  return /^[A-Za-z0-9_]{1,15}$/.test(handle);
}

/**
 * The handle out of anything that might carry one — a full profile URL, or the
 * bare `@name` a `twitter:creator` tag usually holds. Null for a link that
 * points at X but not at a person.
 */
export function parseTwitterHandle(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  // The meta tags hold a handle rather than a URL, and are the only place a
  // leading @ shows up.
  if (!trimmed.includes("/")) {
    const bare = trimmed.replace(/^@/, "");
    return isWellFormedHandle(bare) ? bare.toLowerCase() : null;
  }

  try {
    // Protocol-relative and bare-host hrefs are both common in footers.
    const url = new URL(
      trimmed.startsWith("//")
        ? `https:${trimmed}`
        : /^https?:\/\//i.test(trimmed)
          ? trimmed
          : `https://${trimmed}`,
    );

    if (!TWITTER_HOSTS.has(url.hostname.toLowerCase())) return null;

    const [first] = url.pathname.split("/").filter(Boolean);
    if (!first) return null;

    const handle = first.replace(/^@/, "");
    if (RESERVED_TWITTER_PATHS.has(handle.toLowerCase())) return null;

    return isWellFormedHandle(handle) ? handle.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Reads a designer's site once and takes both things the sync wants off it.
 *
 * One fetch and one parse for the pair: the OG image scrape was already loading
 * every page in the directory, and the handle is sitting in the same document.
 */
export async function fetchSiteMeta(url: string): Promise<SiteMeta> {
  // A designer whose "site" is their X profile is their own answer — and the
  // page itself is unfetchable from a data centre, so this is the only way that
  // row ever gets a handle.
  const handleFromOwnUrl = parseTwitterHandle(url);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      return { ogImage: null, twitterHandle: handleFromOwnUrl };
    }

    const $ = cheerio.load(await response.text());

    let ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage?.startsWith("/")) {
      ogImage = `${new URL(url).origin}${ogImage}`;
    }

    return {
      ogImage: ogImage ?? null,
      twitterHandle: handleFromOwnUrl ?? findTwitterHandle($),
    };
  } catch (error) {
    console.error("Error fetching site meta for", url, error);
    return { ogImage: null, twitterHandle: handleFromOwnUrl };
  }
}

/**
 * Best handle the page offers, in descending order of how deliberate it is.
 *
 * `twitter:creator` is someone stating who wrote the page, which is exactly the
 * question; `twitter:site` is the account behind the site, usually the same
 * person on a portfolio. Only when neither is set does this fall back to
 * reading links, where a designer's own profile competes with every client,
 * friend, and share button they have linked.
 */
function findTwitterHandle($: cheerio.CheerioAPI): string | null {
  const metaCandidates = [
    $('meta[name="twitter:creator"]').attr("content"),
    $('meta[property="twitter:creator"]').attr("content"),
    $('meta[name="twitter:site"]').attr("content"),
    $('meta[property="twitter:site"]').attr("content"),
  ];

  for (const candidate of metaCandidates) {
    const handle = candidate ? parseTwitterHandle(candidate) : null;
    if (handle) return handle;
  }

  for (const element of $("a[href]").toArray()) {
    const href = $(element).attr("href");
    const handle = href ? parseTwitterHandle(href) : null;
    if (handle) return handle;
  }

  return null;
}
