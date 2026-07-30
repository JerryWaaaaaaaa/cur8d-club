import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { notion } from "./notion-sync";

export interface NotionCaseStudy {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  websiteUrl: string | null;
  types: string[];
  industries: string[];
  infoRole: string | null;
  infoTeam: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
  sourceText: string | null;
}

type Properties = PageObjectResponse["properties"];

function plainText(properties: Properties, key: string): string | null {
  const property = properties[key];
  if (property?.type !== "rich_text") return null;

  const text = property.rich_text
    .map((chunk: RichTextItemResponse) => chunk.plain_text)
    .join("")
    .trim();

  return text === "" ? null : text;
}

function multiSelect(properties: Properties, key: string): string[] {
  const property = properties[key];
  if (property?.type !== "multi_select") return [];
  return property.multi_select.map((option) => option.name);
}

function url(properties: Properties, key: string): string | null {
  const property = properties[key];
  if (property?.type !== "url") return null;
  const value = property.url?.trim();
  return value === "" ? null : (value ?? null);
}

/**
 * Reads the "design / case studies" Notion database.
 *
 * Property names here are capitalised and differ from the designer database's
 * lowercase keys, so this deliberately does not share a mapper with
 * `fetchNotionData`. Sub-items are skipped so only top-level rows become cards.
 */
export async function fetchCaseStudyData(): Promise<NotionCaseStudy[]> {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_CASE_STUDY_DATABASE_ID!,
    });

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .filter((page) => {
        const parent = page.properties["Parent item"];
        return parent?.type !== "relation" || parent.relation.length === 0;
      })
      .map((page) => {
        const properties = page.properties;

        return {
          id: page.id,
          createdAt: page.created_time,
          updatedAt: page.last_edited_time,
          name:
            properties.Name?.type === "title"
              ? (properties.Name.title[0]?.plain_text ?? "")
              : "",
          websiteUrl: url(properties, "URL"),
          types: multiSelect(properties, "Type"),
          industries: multiSelect(properties, "Industries"),
          infoRole: plainText(properties, "Info / Role"),
          infoTeam: plainText(properties, "Info / Team"),
          videoUrl: url(properties, "Video"),
          posterUrl: url(properties, "Poster"),
          sourceText: plainText(properties, "Source Text"),
        };
      })
      .filter((item) => item.name !== "");
  } catch (error) {
    console.error("Error fetching Notion case study data:", error);
    throw error;
  }
}
