import { Client as NotionClient } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { parseTwitterHandle } from "@/lib/site-meta";

export const notion = new NotionClient({
  auth: process.env.NOTION_API_KEY,
});

interface NotionItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  type: string | null;
  tags: string[];
  websiteUrl: string;
  /**
   * Optional hand-entered override for the handle the sync otherwise reads off
   * the designer's site. Null both when the property is empty and when the
   * database has no such column at all, so adding it in Notion is opt-in and
   * its absence changes nothing.
   */
  twitterHandle: string | null;
}

export async function fetchNotionData(): Promise<NotionItem[]> {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
    });
    console.log(response);

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map((page) => ({
        id: page.id,
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
        name:
          page.properties.name?.type === "title"
            ? (page.properties.name.title[0]?.plain_text ?? "")
            : "",
        type:
          page.properties.type?.type === "select"
            ? (page.properties.type.select?.name ?? null)
            : null,
        tags:
          page.properties.tags?.type === "multi_select"
            ? page.properties.tags.multi_select.map((tag) => tag.name)
            : [],
        websiteUrl:
          page.properties.url?.type === "url"
            ? (page.properties.url.url ?? "")
            : "",
        twitterHandle: readTwitterProperty(page),
      }));
  } catch (error) {
    console.error("Error fetching Notion data:", error);
    throw error;
  }
}

/**
 * A `twitter` property, however the owner chose to type it — a URL column for
 * anyone pasting profile links, a text one for anyone typing handles. Anything
 * else, or nothing, reads as null and leaves the scraped handle standing.
 */
function readTwitterProperty(page: PageObjectResponse): string | null {
  const property = page.properties.twitter;

  const raw =
    property?.type === "url"
      ? property.url
      : property?.type === "rich_text"
        ? (property.rich_text[0]?.plain_text ?? null)
        : null;

  return raw ? parseTwitterHandle(raw) : null;
}
