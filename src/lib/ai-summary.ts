import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";

// Short summaries only — these are card captions, not articles.
const MAX_TOKENS = 300;
const MAX_SOURCE_CHARS = 12_000;

// A sync describes a batch of unrelated sites at once under a 60s ceiling, so
// one server that accepts the connection and then never answers would cost the
// whole run. Better to give up on it and take the row next time.
const FETCH_TIMEOUT_MS = 10_000;

const SHARED_STYLE =
  "Write plainly and concretely. Do not use marketing language, do not " +
  "start with the name, and reply with the summary only.";

// One sentence with a word count on it, rather than "one or two sentences":
// the second sentence was where the length came from, and an open-ended
// instruction leaves it to the model to decide how long a sentence runs. The
// blurb sits under a card title and is read at a glance, so it carries the one
// thing worth knowing about the project and stops.
const CASE_STUDY_SYSTEM =
  "You write short blurbs for a curated gallery of design work. " +
  "Given source material about a project, reply with a single sentence of " +
  "no more than 20 words saying what it is and what makes the design " +
  "notable. " +
  SHARED_STYLE;

const DESIGNER_SYSTEM =
  "You read the sites of designers and design studios for a curated " +
  "directory. Given source material from someone's own site, record what it " +
  "says about them with the save_profile tool. Only state what the source " +
  "material supports — never guess, and never carry over what you happen to " +
  "know about the person from elsewhere. Leave a field empty rather than " +
  "filling it with something the page does not say.";

const PROFILE_TOOL = {
  name: "save_profile",
  description:
    "Record what the source material says about the designer or studio. " +
    "Every field is optional: pass an empty string for anything the source " +
    "material does not support.",
  input_schema: {
    type: "object" as const,
    properties: {
      description: {
        type: "string",
        description:
          "One or two sentences describing who they are and the kind of " +
          "work they do. Write plainly and concretely. Do not use marketing " +
          "language and do not start with their name. Empty if the page is " +
          "too thin to say anything specific about its owner.",
      },
      location: {
        type: "string",
        description:
          'Where they are based, as the page gives it — "Berlin", ' +
          '"Brooklyn, NY", "Lisbon, Portugal". Not a full address, and not ' +
          "an office list for a studio with several. Empty if unstated.",
      },
      company: {
        type: "string",
        description:
          "Where they work now, as a name on its own without a role or " +
          '"at" — "Figma", "Stripe". Use "Freelance" when they describe ' +
          "themselves as freelance, independent, or self-employed. Leave it " +
          "empty for a studio's own site, where the studio is the subject " +
          "rather than an employer, and empty when the page names no current " +
          "employer or only past ones.",
      },
      title: {
        type: "string",
        description:
          'Their current role on its own — "Product Designer", "Design ' +
          'Engineer", "Creative Director". No company name, no seniority ' +
          "invented. Empty if unstated.",
      },
    },
    required: ["description", "location", "company", "title"],
  },
};

// The profile call answers in JSON, so it needs room for the same blurb plus
// the keys and the three short fields around it.
const PROFILE_MAX_TOKENS = 500;

// Location, company and title are a badge and a subtitle, not fields to hold a
// sentence in; the description is a card caption rather than a paragraph.
// Anything longer is the model writing into the wrong slot, and it is dropped
// rather than truncated mid-word.
const MAX_DETAIL_CHARS = 60;
const MAX_DESCRIPTION_CHARS = 400;

interface SummaryInput {
  name: string;
  url: string | null;
  sourceText: string | null;
  types: string[];
  industries: string[];
}

interface DesignerInput {
  name: string;
  url: string;
  type: string | null;
  tags: string[];
}

export interface DesignerProfile {
  /**
   * Whether the site yielded any text to read. False separates a portfolio
   * that cannot be scraped from one that was read and simply says nothing
   * about its owner — the fields below are null either way, and only the
   * second kind is worth reading again the same way.
   */
  pageRead: boolean;
  description: string | null;
  location: string | null;
  company: string | null;
  title: string | null;
}

// A page that scrapes to nothing is an answer: the site will read the same way
// tomorrow, so the row counts as looked at and waits out the retry window with
// the rest. Only an attempt that never got to look — no key, a call that
// errored, a rate limit — returns null, and those rows are left unstamped so
// the next run picks them straight back up.
const UNREADABLE_PAGE: DesignerProfile = {
  pageRead: false,
  description: null,
  location: null,
  company: null,
  title: null,
};

const READ_BUT_EMPTY: DesignerProfile = {
  pageRead: true,
  description: null,
  location: null,
  company: null,
  title: null,
};

/**
 * Pulls readable text off a page for summarising.
 *
 * Mirrors the fetch/cheerio approach used by the OpenGraph scraper in the
 * designer sync route. Not usable for x.com, which renders client-side and
 * blocks data-centre traffic — those entries rely on `sourceText` instead.
 */
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const $ = cheerio.load(await response.text());
    $("script, style, noscript, svg").remove();

    const text = $("body").text().replace(/\s+/g, " ").trim();
    return text === "" ? null : text.slice(0, MAX_SOURCE_CHARS);
  } catch (error) {
    console.error("Error fetching page text for", url, error);
    return null;
  }
}

/**
 * One model call, shared by both kinds of blurb.
 *
 * `label` only ever reaches the logs; it identifies the row being summarised
 * when a fetch or a call fails partway through a sync.
 */
async function writeBlurb({
  system,
  context,
  source,
  label,
}: {
  system: string;
  context: string;
  source: string;
  label: string;
}): Promise<string | null> {
  try {
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: MAX_TOKENS,
      system,
      messages: [
        {
          role: "user",
          content: `${context}\n\nSource material:\n${source}`,
        },
      ],
    });

    const blurb = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return blurb === "" ? null : blurb;
  } catch (error) {
    console.error("Error generating summary for", label, error);
    return null;
  }
}

/**
 * Writes a one or two sentence summary of a case study.
 *
 * Prefers the captured source text (e.g. the tweet body) and falls back to
 * scraping the linked page. Tags are never generated here — those stay manual
 * in Notion.
 */
export async function generateSummary({
  name,
  url,
  sourceText,
  types,
  industries,
}: SummaryInput): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set — skipping summary for", name);
    return null;
  }

  const source = sourceText ?? (url ? await fetchPageText(url) : null);

  if (!source) {
    console.warn("No source material to summarise for", name);
    return null;
  }

  const context = [
    `Project name: ${name}`,
    url ? `URL: ${url}` : null,
    types.length > 0 ? `Type: ${types.join(", ")}` : null,
    industries.length > 0 ? `Industry: ${industries.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return writeBlurb({
    system: CASE_STUDY_SYSTEM,
    context,
    source,
    label: name,
  });
}

/**
 * Empty strings are how the tool says "the page doesn't state this", and the
 * columns behind these fields are nullable for the same reason. Over-long
 * values are the model ignoring the field's shape, so they go the same way.
 */
function readDetail(value: unknown, max = MAX_DETAIL_CHARS): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > max) return null;
  return trimmed;
}

/**
 * Reads a designer's profile off their own site.
 *
 * The only source is the linked site itself — the designer database has no
 * equivalent of the case studies' captured source text. Portfolios that render
 * client-side scrape to nothing, and those rows simply keep an empty profile
 * rather than getting an invented one.
 *
 * Description and details come back from a single call: they are read off the
 * same page, and a second call would double the cost of every row the sync
 * touches. Any individual field can be null — a page can load fine and still
 * be a splash screen, a cookie wall, or a holding page.
 *
 * Returns null when the attempt failed rather than came back empty, which is
 * the caller's signal to leave the row unstamped and try it again next run.
 */
export async function generateDesignerProfile({
  name,
  url,
  type,
  tags,
}: DesignerInput): Promise<DesignerProfile | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set — skipping profile for", name);
    return null;
  }

  const source = await fetchPageText(url);

  if (!source) {
    console.warn("No source material to describe", name);
    return UNREADABLE_PAGE;
  }

  const context = [
    `Designer name: ${name}`,
    `URL: ${url}`,
    type ? `Type: ${type}` : null,
    tags.length > 0 ? `Works in: ${tags.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: PROFILE_MAX_TOKENS,
      system: DESIGNER_SYSTEM,
      tools: [PROFILE_TOOL],
      tool_choice: { type: "tool", name: PROFILE_TOOL.name },
      messages: [
        {
          role: "user",
          content: `${context}\n\nSource material:\n${source}`,
        },
      ],
    });

    // A call cut off at the token ceiling leaves the tool's JSON half-written,
    // and a description that stops mid-sentence is worse on a card than none.
    // The same page will run the model just as long next time, so this counts
    // as looked at rather than as something to retry.
    if (message.stop_reason === "max_tokens") {
      console.error("Profile cut off by the token limit for", name);
      return READ_BUT_EMPTY;
    }

    const toolUse = message.content.find((block) => block.type === "tool_use");

    if (!toolUse) {
      console.error("No profile returned for", name);
      return null;
    }

    const profile = toolUse.input as Record<string, unknown>;

    return {
      pageRead: true,
      description: readDetail(profile.description, MAX_DESCRIPTION_CHARS),
      location: readDetail(profile.location),
      company: readDetail(profile.company),
      title: readDetail(profile.title),
    };
  } catch (error) {
    console.error("Error generating profile for", name, error);
    return null;
  }
}
