import { NextResponse } from "next/server";
import { fetchNotionData } from "@/lib/notion-sync";
import { db } from "@/server/db";
import { collectables } from "@/server/db/schema";
import { eq, inArray, isNull, or, sql } from "drizzle-orm";
import * as cheerio from "cheerio";

async function cleanupOrphanedTags() {
  try {
    // Get all tags currently in use in Notion
    const notionItems = await fetchNotionData();
    const validTags = new Set(
      notionItems.flatMap(item => item.tags)
    );
    
    console.log(`Found ${validTags.size} valid tags in Notion:`, Array.from(validTags).sort());
    
    // Find all records with orphaned tags and update them
    const allDbItems = await db.query.collectables.findMany();
    
    const itemsWithOrphanedTags = allDbItems.filter(item => 
      item.tags && item.tags.some(tag => !validTags.has(tag))
    );
    
    if (itemsWithOrphanedTags.length > 0) {
      console.log(`Found ${itemsWithOrphanedTags.length} items with orphaned tags:`);
      itemsWithOrphanedTags.forEach(item => {
        const orphanedTags = item.tags?.filter(tag => !validTags.has(tag)) || [];
        console.log(`  - ${item.name}: removing tags [${orphanedTags.join(', ')}]`);
      });
    }
    
    const cleanupPromises = itemsWithOrphanedTags.map(item => 
      db
        .update(collectables)
        .set({
          tags: item.tags?.filter(tag => validTags.has(tag)) || []
        })
        .where(eq(collectables.id, item.id))
    );
      
    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises);
      console.log(`Successfully cleaned up ${cleanupPromises.length} records with orphaned tags`);
    } else {
      console.log("No orphaned tags found to clean up");
    }
  } catch (error) {
    console.error("Error during orphaned tags cleanup:", error);
  }
}

export async function GET() {
  const trueItems = await fetchNotionData();

  const dbItems = await db.query.collectables.findMany();

  const newItems = trueItems.filter(
    (item) => !dbItems.some((dbItem) => dbItem.id === item.id),
  );
  // Insert new items into db
  const dbPromises: Promise<unknown>[] = [];

  if (newItems.length > 0) {
    dbPromises.push(
      db.insert(collectables).values(
        newItems.map((item) => ({
          id: item.id,
          name: item.name,
          websiteUrl: item.websiteUrl,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          type: item.type,
          tags: item.tags,
        })),
      ),
    );
  }

  const updatedItems = trueItems.filter((item) =>
    dbItems.some((dbItem) => dbItem.id === item.id),
  );

  // Update existing items in db
  const updatePromises = updatedItems.map((item) =>
    db
      .update(collectables)
      .set({
        name: item.name,
        websiteUrl: item.websiteUrl,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        type: item.type,
        tags: item.tags,
      })
      .where(eq(collectables.id, item.id)),
  );

  dbPromises.push(...updatePromises);

  const deletedItems = dbItems.filter(
    (item) => !trueItems.some((newItem) => newItem.id === item.id),
  );

  // delete deletedItems from db
  if (deletedItems.length > 0) {
    dbPromises.push(
      db.delete(collectables).where(
        inArray(
          collectables.id,
          deletedItems.map((item) => item.id),
        ),
      ),
    );
  }

  console.log("Inserting", newItems.length, "items");
  console.log("Updating", updatedItems.length, "items");
  console.log("Deleting", deletedItems.length, "items");
  await Promise.all(dbPromises);
  console.log("Synced with Notion");

  // Clean up orphaned tags after main sync
  console.log("Starting orphaned tags cleanup...");
  await cleanupOrphanedTags();
  console.log("Finished orphaned tags cleanup");

  // Fetch OG image for altered row / new rows

  const urlAlteredItems = updatedItems.filter((item) => {
    const urlAltered =
      dbItems.find((dbItem) => dbItem.id === item.id)?.websiteUrl !==
      item.websiteUrl;
    return urlAltered;
  });

  const itemsToFetchOpenGraph = [...urlAlteredItems, ...newItems];

  const ogFetchPromises = itemsToFetchOpenGraph.map((item) =>
    fetchOpenGraphAndUpdateDb(item.id, item.websiteUrl),
  );
  console.log("Fetching OG images for", itemsToFetchOpenGraph.length, "items");
  console.log("Started fetching OG images at", new Date().toISOString());
  await Promise.all(ogFetchPromises);
  console.log("Fetched OG images for", itemsToFetchOpenGraph.length, "items");
  console.log("Finished fetching OG images at", new Date().toISOString());

  // Fetch for items with nullish ogImageUrl or outdated ogImageUrl (older than 30 days)
  const itemsWithNullishOgImageUrl = await db.query.collectables.findMany({
    where: or(
      isNull(collectables.ogImageUrl),
      sql`${collectables.ogImageLastFetchedAt} < NOW() - INTERVAL '30 days'`,
    ),
  });

  console.log(
    "Fetching OG images for",
    itemsWithNullishOgImageUrl.length,
    "items",
  );
  console.log("Started fetching OG images at", new Date().toISOString());
  const ogFetchPromisesForNullishOgImageUrl = itemsWithNullishOgImageUrl.map(
    (item) => fetchOpenGraphAndUpdateDb(item.id, item.websiteUrl),
  );
  await Promise.all(ogFetchPromisesForNullishOgImageUrl);
  console.log(
    "Fetched OG images for",
    itemsWithNullishOgImageUrl.length,
    "items",
  );
  console.log("Finished fetching OG images at", new Date().toISOString());

  return NextResponse.json({
    newItems: newItems.length,
    updatedItems: updatedItems.length,
    deletedItems: deletedItems.length,
    itemsWithNullishOgImageUrl: itemsWithNullishOgImageUrl.length,
    itemsToFetchOpenGraph: itemsToFetchOpenGraph.length,
  });
}

async function fetchOpenGraph(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    let ogImage = $('meta[property="og:image"]').attr("content");

    if (ogImage?.startsWith("/")) {
      const urlObj = new URL(url);
      const baseUrl = urlObj.origin;
      ogImage = `${baseUrl}${ogImage}`;
    }

    return ogImage ?? null;
  } catch (error) {
    console.error("Error fetching OpenGraph image for", url, error);
    return null;
  }
}

async function fetchOpenGraphAndUpdateDb(id: string, url: string) {
  const ogImage = await fetchOpenGraph(url);
  if (ogImage) {
    await db
      .update(collectables)
      .set({
        ogImageUrl: ogImage,
        ogImageLastFetchedAt: new Date(),
      })
      .where(eq(collectables.id, id));
  }
}
