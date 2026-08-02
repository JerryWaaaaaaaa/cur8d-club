import { NextResponse } from "next/server";
import { fetchNotionData } from "@/lib/notion-sync";
import { generateDesignerDescription } from "@/lib/ai-summary";
import { db } from "@/server/db";
import { collectables } from "@/server/db/schema";
import { eq, inArray, isNull, or, sql } from "drizzle-orm";
import * as cheerio from "cheerio";

export const maxDuration = 60;

// Rows without a description are worked through a slice at a time. Every one
// costs a page fetch plus a model call, and the daily cron will pick up
// whatever is left over on its next run.
const DESCRIPTION_BACKFILL_PER_RUN = 20;

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
      item.tags?.some(tag => !validTags.has(tag))
    );
    
    if (itemsWithOrphanedTags.length > 0) {
      console.log(`Found ${itemsWithOrphanedTags.length} items with orphaned tags:`);
      itemsWithOrphanedTags.forEach(item => {
        const orphanedTags = item.tags?.filter(tag => !validTags.has(tag)) ?? [];
        console.log(`  - ${item.name}: removing tags [${orphanedTags.join(', ')}]`);
      });
    }
    
    const cleanupPromises = itemsWithOrphanedTags.map(item => 
      db
        .update(collectables)
        .set({
          tags: item.tags?.filter(tag => validTags.has(tag)) ?? []
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
  const updatePromises = updatedItems.map((item) => {
    const dbItem = dbItems.find((dbItem) => dbItem.id === item.id);
    const urlAltered = dbItem?.websiteUrl !== item.websiteUrl;

    return db
      .update(collectables)
      .set({
        name: item.name,
        websiteUrl: item.websiteUrl,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        type: item.type,
        tags: item.tags,
        // A moved URL invalidates the description with it — dropping it here
        // means a failed regeneration leaves the card blank rather than
        // describing a page this entry no longer points at.
        ...(urlAltered
          ? {
              isReported: false,
              isBroken: false,
              aiDescription: null,
              aiDescriptionGeneratedAt: null,
            }
          : {}),
      })
      .where(eq(collectables.id, item.id));
  });

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

  // Describe rows whose URL is new or has moved — the old description belongs
  // to a page this entry no longer points at — then spend what is left of the
  // per-run budget backfilling rows that have never had one.
  const itemsToDescribe: DescribableItem[] = [
    ...urlAlteredItems,
    ...newItems,
  ].map((item) => ({
    id: item.id,
    name: item.name,
    websiteUrl: item.websiteUrl,
    type: item.type,
    tags: item.tags,
  }));

  const describedIds = new Set(itemsToDescribe.map((item) => item.id));
  const backfillBudget = DESCRIPTION_BACKFILL_PER_RUN - itemsToDescribe.length;

  if (backfillBudget > 0) {
    const missingDescription = await db.query.collectables.findMany({
      where: isNull(collectables.aiDescription),
      limit: backfillBudget + describedIds.size,
    });

    itemsToDescribe.push(
      ...missingDescription
        .filter((item) => !describedIds.has(item.id))
        .slice(0, backfillBudget),
    );
  }

  console.log("Generating descriptions for", itemsToDescribe.length, "items");
  await Promise.all(itemsToDescribe.map(generateDescriptionAndUpdateDb));
  console.log("Finished generating descriptions at", new Date().toISOString());

  return NextResponse.json({
    newItems: newItems.length,
    updatedItems: updatedItems.length,
    deletedItems: deletedItems.length,
    itemsWithNullishOgImageUrl: itemsWithNullishOgImageUrl.length,
    itemsToFetchOpenGraph: itemsToFetchOpenGraph.length,
    describedItems: itemsToDescribe.length,
  });
}

/**
 * The fields a description needs, common to a freshly fetched Notion row and a
 * row already in the database. Notion always gives an array of tags; the column
 * is nullable, so the shared type takes the wider of the two.
 */
interface DescribableItem {
  id: string;
  name: string;
  websiteUrl: string;
  type: string | null;
  tags: string[] | null;
}

async function generateDescriptionAndUpdateDb(item: DescribableItem) {
  const description = await generateDesignerDescription({
    name: item.name,
    url: item.websiteUrl,
    type: item.type,
    tags: item.tags ?? [],
  });

  if (description) {
    await db
      .update(collectables)
      .set({
        aiDescription: description,
        aiDescriptionGeneratedAt: new Date(),
      })
      .where(eq(collectables.id, item.id));
  }
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
