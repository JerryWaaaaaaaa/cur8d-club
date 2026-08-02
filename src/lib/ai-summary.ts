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

const CASE_STUDY_SYSTEM =
  "You write short blurbs for a curated gallery of design work. " +
  "Given source material about a project, reply with one or two " +
  "sentences describing what it is and what makes the design notable. " +
  SHARED_STYLE;

const DESIGNER_SYSTEM =
  "You write short blurbs for a curated directory of designers and design " +
  "studios. Given source material from someone's own site, reply with one " +
  "or two sentences describing who they are and the kind of work they do. " +
  "Only state what the source material supports — if it is too thin to say " +
  "anything specific, reply with the word NONE. " +
  SHARED_STYLE;

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
 * Writes a one or two sentence description of a designer.
 *
 * The only source is the linked site itself — the designer database has no
 * equivalent of the case studies' captured source text. Portfolios that render
 * client-side scrape to nothing, and those rows simply keep no description
 * rather than getting an invented one.
 */
export async function generateDesignerDescription({
  name,
  url,
  type,
  tags,
}: DesignerInput): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set — skipping description for", name);
    return null;
  }

  const source = await fetchPageText(url);

  if (!source) {
    console.warn("No source material to describe", name);
    return null;
  }

  const context = [
    `Designer name: ${name}`,
    `URL: ${url}`,
    type ? `Type: ${type}` : null,
    tags.length > 0 ? `Works in: ${tags.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const description = await writeBlurb({
    system: DESIGNER_SYSTEM,
    context,
    source,
    label: name,
  });

  // A page can load fine and still say nothing about its owner — a splash
  // screen, a cookie wall, a holding page. The model flags those instead of
  // padding out a description from the tags alone.
  return description === "NONE" ? null : description;
}
