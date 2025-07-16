import { NextResponse } from "next/server";
import { fetchNotionData } from "@/lib/notion-sync";
import { db } from "@/server/db";
import { collectables } from "@/server/db/schema";

export async function GET() {
  try {
    // Get tags from Notion
    const notionItems = await fetchNotionData();
    const notionTags = new Set(notionItems.flatMap(item => item.tags));
    
    // Get tags from database
    const dbItems = await db.query.collectables.findMany({
      columns: {
        id: true,
        name: true,
        tags: true,
      },
    });
    
    const dbTags = new Set(dbItems.flatMap(item => item.tags || []));
    
    // Find orphaned tags in database
    const orphanedTags = Array.from(dbTags).filter(tag => !notionTags.has(tag));
    
    // Find items with orphaned tags
    const itemsWithOrphanedTags = dbItems.filter(item => 
      item.tags && item.tags.some(tag => !notionTags.has(tag))
    );
    
    return NextResponse.json({
      notionTags: Array.from(notionTags).sort(),
      dbTags: Array.from(dbTags).sort(),
      orphanedTags: orphanedTags.sort(),
      itemsWithOrphanedTags: itemsWithOrphanedTags.map(item => ({
        id: item.id,
        name: item.name,
        tags: item.tags,
        orphanedTags: item.tags?.filter(tag => !notionTags.has(tag)) || []
      })),
      summary: {
        totalNotionTags: notionTags.size,
        totalDbTags: dbTags.size,
        orphanedTagsCount: orphanedTags.length,
        itemsWithOrphanedTagsCount: itemsWithOrphanedTags.length
      }
    });
  } catch (error) {
    console.error("Error in debug tags endpoint:", error);
    return NextResponse.json({ error: "Failed to fetch tag data" }, { status: 500 });
  }
} 