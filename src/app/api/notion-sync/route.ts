import { NextResponse } from "next/server";
import { fetchNotionData } from "@/lib/notion-sync";
import { generateDesignerProfile } from "@/lib/ai-summary";
import { db } from "@/server/db";
import { collectables } from "@/server/db/schema";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import * as cheerio from "cheerio";

export const maxDuration = 60;

// Rows with something still missing are worked through a slice at a time. Every
// one costs a page fetch plus a model call, and the daily cron picks up what is
// left over on its next run. `?profiles=` raises the slice for a run kicked off
// by hand, which is how a directory gets swept in one go rather than over a
// fortnight of crons.
//
// The ceiling exists because the whole slice is fetched and called in parallel
// under a 60s function: batching it instead would be gentler but could not
// finish, and a row whose call is rate-limited is left unstamped to come round
// again rather than being recorded as looked at.
const PROFILE_BACKFILL_PER_RUN = 20;
const PROFILE_BACKFILL_MAX = 100;

// How long a row that came back incomplete is left alone before being read
// again. Something missing is not the same as something absent — a site that
// says nothing about where its owner works today may say so next month — but
// the two are indistinguishable from here, so incomplete rows come round on a
// cooldown instead of consuming every run's budget in perpetuity. A row with
// all four fields is never read again.
const PROFILE_RETRY_DAYS = 30;

/** Rows with something still missing, whatever their last reading said. */
function incompleteProfiles() {
  return or(
    isNull(collectables.aiDescription),
    isNull(collectables.location),
    isNull(collectables.company),
    isNull(collectables.title),
  );
}

/**
 * Rows worth spending a fetch and a call on now: something is still missing,
 * and either they have never been read or their last reading has gone stale.
 *
 * `ignoreCooldown` is what `?refresh=1` sets. Every row is inside the window
 * for a month after a sweep, so without it an improvement to what the model is
 * asked for could not reach a single row until the window ran out.
 */
function profilesToRead(ignoreCooldown: boolean) {
  if (ignoreCooldown) return incompleteProfiles();

  return and(
    incompleteProfiles(),
    or(
      isNull(collectables.profileGeneratedAt),
      sql`${collectables.profileGeneratedAt} < NOW() - INTERVAL '${sql.raw(
        `${PROFILE_RETRY_DAYS} days`,
      )}'`,
    ),
  );
}

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

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requested = Number(params.get("profiles") ?? "");
  const profileBudget =
    Number.isFinite(requested) && requested > 0
      ? Math.min(Math.trunc(requested), PROFILE_BACKFILL_MAX)
      : PROFILE_BACKFILL_PER_RUN;
  const ignoreCooldown = params.get("refresh") === "1";

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
        // A moved URL clears the link flags, since the complaint was about an
        // address this entry no longer uses. The profile is left standing: the
        // row is read again below whatever else happens this run, and anything
        // the new page gives overwrites it field by field. Blanking it here
        // instead would trade a description that is usually still true — most
        // moved URLs are the same designer on a new host — for an empty card
        // whenever the new page cannot be read.
        ...(urlAltered ? { isReported: false, isBroken: false } : {}),
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

  // Read rows whose URL is new or has moved — the old profile belongs to a page
  // this entry no longer points at — then spend what is left of the per-run
  // budget backfilling rows that have never been read.
  const itemsToProfile: DescribableItem[] = [
    ...urlAlteredItems,
    ...newItems,
  ].map((item) => ({
    id: item.id,
    name: item.name,
    websiteUrl: item.websiteUrl,
    type: item.type,
    tags: item.tags,
  }));

  const profiledIds = new Set(itemsToProfile.map((item) => item.id));
  const backfillBudget = profileBudget - itemsToProfile.length;

  if (backfillBudget > 0) {
    const missingProfile = await db.query.collectables.findMany({
      where: profilesToRead(ignoreCooldown),
      // Never-read rows first, then the longest-unread. Without an ordering
      // Postgres is free to hand back the same rows every run, and the backfill
      // stalls short of the rows behind them.
      orderBy: [sql`${collectables.profileGeneratedAt} ASC NULLS FIRST`],
      limit: backfillBudget + profiledIds.size,
    });

    itemsToProfile.push(
      ...missingProfile
        .filter((item) => !profiledIds.has(item.id))
        .slice(0, backfillBudget),
    );
  }

  console.log("Generating profiles for", itemsToProfile.length, "items");
  const profileResults = await Promise.all(
    itemsToProfile.map(generateProfileAndUpdateDb),
  );
  console.log("Finished generating profiles at", new Date().toISOString());

  // Where the directory stands once this run has written its rows. `eligible`
  // is what another run would pick up right now and `incomplete` is what is
  // actually missing — they differ by the cooldown, and reporting only the
  // first would read as finished when it means everything was read recently.
  // `unreadable` is the part no further reading can fix.
  const [standing] = await db
    .select({
      eligible: sql<number>`count(*) FILTER (WHERE ${profilesToRead(false)})::int`,
      incomplete: sql<number>`count(*) FILTER (WHERE ${incompleteProfiles()})::int`,
      unreadable: sql<number>`count(*) FILTER (WHERE ${collectables.profilePageRead} = false)::int`,
    })
    .from(collectables);

  return NextResponse.json({
    newItems: newItems.length,
    updatedItems: updatedItems.length,
    deletedItems: deletedItems.length,
    itemsWithNullishOgImageUrl: itemsWithNullishOgImageUrl.length,
    itemsToFetchOpenGraph: itemsToFetchOpenGraph.length,
    profilesRead: profileResults.filter(Boolean).length,
    profilesFailed: profileResults.filter((read) => !read).length,
    profilesEligible: standing?.eligible ?? 0,
    profilesIncomplete: standing?.incomplete ?? 0,
    profilesUnreadable: standing?.unreadable ?? 0,
  });
}

/**
 * The fields a profile needs, common to a freshly fetched Notion row and a row
 * already in the database. Notion always gives an array of tags; the column is
 * nullable, so the shared type takes the wider of the two.
 */
interface DescribableItem {
  id: string;
  name: string;
  websiteUrl: string;
  type: string | null;
  tags: string[] | null;
}

/**
 * Reads one row's site and writes back what it found. Answers whether the row
 * was actually read, which is what the run reports and what decides whether the
 * row waits out the retry window or comes back on the next run.
 */
async function generateProfileAndUpdateDb(
  item: DescribableItem,
): Promise<boolean> {
  const profile = await generateDesignerProfile({
    name: item.name,
    url: item.websiteUrl,
    type: item.type,
    tags: item.tags ?? [],
  });

  // An attempt that never got to look at the page leaves the row exactly as it
  // was, timestamp included. Stamping here would put a row that was merely
  // rate-limited into the retry window alongside the ones that genuinely have
  // nothing to give.
  if (!profile) return false;

  // The timestamps record the reading, not the result, so they are stamped even
  // when the page said nothing. That is what moves a site which cannot be
  // scraped out of the way of the rows behind it.
  //
  // Fields that came back empty are left alone rather than written as null: a
  // site that has since dropped its "currently at" line shouldn't blank out the
  // details a previous run read off it.
  await db
    .update(collectables)
    .set({
      ...(profile.description ? { aiDescription: profile.description } : {}),
      ...(profile.location ? { location: profile.location } : {}),
      ...(profile.company ? { company: profile.company } : {}),
      ...(profile.title ? { title: profile.title } : {}),
      aiDescriptionGeneratedAt: new Date(),
      profileGeneratedAt: new Date(),
      profilePageRead: profile.pageRead,
    })
    .where(eq(collectables.id, item.id));

  return true;
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
