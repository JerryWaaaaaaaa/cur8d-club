import { Client as NotionClient } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

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
      }));
  } catch (error) {
    console.error("Error fetching Notion data:", error);
    throw error;
  }
}
