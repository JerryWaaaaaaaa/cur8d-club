import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";

const anthropic = new Anthropic();

// Short summaries only — this is a card caption, not an article.
const MAX_TOKENS = 300;
const MAX_SOURCE_CHARS = 12_000;

interface SummaryInput {
  name: string;
  url: string | null;
  sourceText: string | null;
  types: string[];
  industries: string[];
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
    const response = await fetch(url);
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

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: MAX_TOKENS,
      system:
        "You write short blurbs for a curated gallery of design work. " +
        "Given source material about a project, reply with one or two " +
        "sentences describing what it is and what makes the design notable. " +
        "Write plainly and concretely. Do not use marketing language, do not " +
        "start with the project name, and reply with the summary only.",
      messages: [
        {
          role: "user",
          content: `${context}\n\nSource material:\n${source}`,
        },
      ],
    });

    const summary = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return summary === "" ? null : summary;
  } catch (error) {
    console.error("Error generating summary for", name, error);
    return null;
  }
}
