import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchNotionData } from "@/lib/notion-sync";
import { generateDesignerProfile } from "@/lib/ai-summary";
import { fetchSiteMeta } from "@/lib/site-meta";
import { fetchScreenshotUrl } from "@/lib/screenshot";
import { fetchAvatarUrl } from "@/lib/twitter-avatar";
import { db } from "@/server/db";
import { FILTER_OPTIONS_TAG } from "@/lib/cache-tags";
import { collectables } from "@/server/db/schema";
import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

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

// The meta pass reads the site itself, so it is cheaper per row than a profile
// — but it used to run against every stale row at once under the same 60s
// ceiling, which only held because most of those fetches failed fast. Now that
// it also looks for a handle it gets a budget of its own, on the same terms.
const META_BACKFILL_PER_RUN = 40;
const META_BACKFILL_MAX = 200;
const META_RETRY_DAYS = 30;

// Capture is the expensive one: a third-party render, rate-limited to a few
// dozen a day unless SCREENSHOT_API_KEY is set. A small slice per run is the
// point rather than a limitation — `?screenshots=` sweeps harder by hand.
const SCREENSHOT_BACKFILL_PER_RUN = 20;
const SCREENSHOT_BACKFILL_MAX = 100;
const SCREENSHOT_RETRY_DAYS = 30;

// Only rows that already found a handle reach this pass, so the eligible set is
// small and each row is one redirect plus a copy into Blob.
const AVATAR_BACKFILL_PER_RUN = 40;
const AVATAR_BACKFILL_MAX = 200;
const AVATAR_RETRY_DAYS = 30;

/** `?name=N`, clamped, or the standing per-run slice. */
function budgetFrom(
  params: URLSearchParams,
  name: string,
  fallback: number,
  ceiling: number,
): number {
  const requested = Number(params.get(name) ?? "");
  return Number.isFinite(requested) && requested > 0
    ? Math.min(Math.trunc(requested), ceiling)
    : fallback;
}

/** Column is null, or was last written longer ago than the retry window. */
function staleOrMissing(column: AnyPgColumn, days: number) {
  return or(
    isNull(column),
    sql`${column} < NOW() - INTERVAL '${sql.raw(`${days} days`)}'`,
  );
}

/**
 * Rows whose site is worth reading again: either it has never given up an OG
 * image or a handle, or whatever it gave has gone stale.
 *
 * The cooldown is what makes the handle condition safe. Most designers never
 * link a profile anywhere, so `twitterHandle IS NULL` on its own would leave
 * the majority of the directory permanently eligible and the queue would never
 * drain past them — the same trap `incompleteProfiles` is fenced against.
 */
function sitesToRead() {
  return and(
    or(isNull(collectables.ogImageUrl), isNull(collectables.twitterHandle)),
    staleOrMissing(collectables.ogImageLastFetchedAt, META_RETRY_DAYS),
  );
}

function screenshotsToTake() {
  return and(
    isNull(collectables.screenshotUrl),
    staleOrMissing(collectables.screenshotLastFetchedAt, SCREENSHOT_RETRY_DAYS),
  );
}

function avatarsToFetch() {
  return and(
    isNotNull(collectables.twitterHandle),
    isNull(collectables.avatarUrl),
    staleOrMissing(collectables.avatarLastFetchedAt, AVATAR_RETRY_DAYS),
  );
}

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
    const validTags = new Set(notionItems.flatMap((item) => item.tags));

    console.log(
      `Found ${validTags.size} valid tags in Notion:`,
      Array.from(validTags).sort(),
    );

    // Find all records with orphaned tags and update them
    const allDbItems = await db.query.collectables.findMany();

    const itemsWithOrphanedTags = allDbItems.filter((item) =>
      item.tags?.some((tag) => !validTags.has(tag)),
    );

    if (itemsWithOrphanedTags.length > 0) {
      console.log(
        `Found ${itemsWithOrphanedTags.length} items with orphaned tags:`,
      );
      itemsWithOrphanedTags.forEach((item) => {
        const orphanedTags =
          item.tags?.filter((tag) => !validTags.has(tag)) ?? [];
        console.log(
          `  - ${item.name}: removing tags [${orphanedTags.join(", ")}]`,
        );
      });
    }

    const cleanupPromises = itemsWithOrphanedTags.map((item) =>
      db
        .update(collectables)
        .set({
          tags: item.tags?.filter((tag) => validTags.has(tag)) ?? [],
        })
        .where(eq(collectables.id, item.id)),
    );

    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises);
      console.log(
        `Successfully cleaned up ${cleanupPromises.length} records with orphaned tags`,
      );
    } else {
      console.log("No orphaned tags found to clean up");
    }
  } catch (error) {
    console.error("Error during orphaned tags cleanup:", error);
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const profileBudget = budgetFrom(
    params,
    "profiles",
    PROFILE_BACKFILL_PER_RUN,
    PROFILE_BACKFILL_MAX,
  );
  const metaBudget = budgetFrom(
    params,
    "meta",
    META_BACKFILL_PER_RUN,
    META_BACKFILL_MAX,
  );
  const screenshotBudget = budgetFrom(
    params,
    "screenshots",
    SCREENSHOT_BACKFILL_PER_RUN,
    SCREENSHOT_BACKFILL_MAX,
  );
  const avatarBudget = budgetFrom(
    params,
    "avatars",
    AVATAR_BACKFILL_PER_RUN,
    AVATAR_BACKFILL_MAX,
  );
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
          twitterHandle: item.twitterHandle,
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
        //
        // The pictures go, though, unlike the profile: a screenshot is a
        // portrait of one specific page rather than of the designer, and
        // showing the old site under the new link is a plain error rather than
        // a stale detail. The handle and its avatar follow, since both were
        // read off that same page.
        ...(urlAltered
          ? {
              isReported: false,
              isBroken: false,
              screenshotUrl: null,
              screenshotLastFetchedAt: null,
              twitterHandle: null,
              avatarUrl: null,
              avatarLastFetchedAt: null,
            }
          : {}),
        // Notion is the owner's override and outranks anything scraped, but
        // only when they actually filled it in — an empty cell must not wipe a
        // handle the sync found on its own.
        ...(item.twitterHandle ? { twitterHandle: item.twitterHandle } : {}),
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

  const urlAlteredItems = updatedItems.filter((item) => {
    const urlAltered =
      dbItems.find((dbItem) => dbItem.id === item.id)?.websiteUrl !==
      item.websiteUrl;
    return urlAltered;
  });

  // Rows pointing somewhere new go first, then the backfill fills what is left
  // of the slice. Every pass below takes the same shape.
  const priorityItems = [...urlAlteredItems, ...newItems].map((item) => ({
    id: item.id,
    websiteUrl: item.websiteUrl,
  }));

  const itemsToReadSite = await withBackfill(
    priorityItems,
    metaBudget,
    sitesToRead(),
    collectables.ogImageLastFetchedAt,
    (row) => ({ id: row.id, websiteUrl: row.websiteUrl }),
  );

  console.log("Reading site meta for", itemsToReadSite.length, "items");
  await Promise.all(itemsToReadSite.map(readSiteMetaAndUpdateDb));
  console.log("Finished reading site meta at", new Date().toISOString());

  // Runs after the meta pass rather than beside it: a row that just gave up a
  // handle has a null avatar stamp, which sorts to the front here, so a new
  // designer gets their face on the same run that finds it.
  const itemsToAvatar = await withBackfill(
    [],
    avatarBudget,
    avatarsToFetch(),
    collectables.avatarLastFetchedAt,
    (row) => ({ id: row.id, twitterHandle: row.twitterHandle }),
  );

  console.log("Fetching avatars for", itemsToAvatar.length, "items");
  const avatarResults = await Promise.all(
    itemsToAvatar.map(fetchAvatarAndUpdateDb),
  );
  console.log("Finished fetching avatars at", new Date().toISOString());

  const itemsToScreenshot = await withBackfill(
    priorityItems,
    screenshotBudget,
    screenshotsToTake(),
    collectables.screenshotLastFetchedAt,
    (row) => ({ id: row.id, websiteUrl: row.websiteUrl }),
  );

  console.log("Capturing screenshots for", itemsToScreenshot.length, "items");
  const screenshotResults = await Promise.all(
    itemsToScreenshot.map(captureScreenshotAndUpdateDb),
  );
  console.log("Finished capturing screenshots at", new Date().toISOString());

  // Read rows whose URL is new or has moved — the old profile belongs to a page
  // this entry no longer points at — then spend what is left of the per-run
  // budget backfilling rows that have never been read.
  const itemsToProfile = await withBackfill<DescribableItem>(
    [...urlAlteredItems, ...newItems].map((item) => ({
      id: item.id,
      name: item.name,
      websiteUrl: item.websiteUrl,
      type: item.type,
      tags: item.tags,
    })),
    profileBudget,
    profilesToRead(ignoreCooldown),
    collectables.profileGeneratedAt,
    (row) => ({
      id: row.id,
      name: row.name,
      websiteUrl: row.websiteUrl,
      type: row.type,
      tags: row.tags,
    }),
  );

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
  //
  // The cover counts are read the same way. `withScreenshot` against
  // `withoutCover` is the one that says whether the grid actually looks the way
  // this feature intends: the second is rows still falling through to an
  // initials tile.
  const [standing] = await db
    .select({
      eligible: sql<number>`count(*) FILTER (WHERE ${profilesToRead(false)})::int`,
      incomplete: sql<number>`count(*) FILTER (WHERE ${incompleteProfiles()})::int`,
      unreadable: sql<number>`count(*) FILTER (WHERE ${collectables.profilePageRead} = false)::int`,
      screenshotsEligible: sql<number>`count(*) FILTER (WHERE ${screenshotsToTake()})::int`,
      withScreenshot: sql<number>`count(*) FILTER (WHERE ${collectables.screenshotUrl} IS NOT NULL)::int`,
      withoutCover: sql<number>`count(*) FILTER (WHERE ${collectables.screenshotUrl} IS NULL AND ${collectables.ogImageUrl} IS NULL)::int`,
      withHandle: sql<number>`count(*) FILTER (WHERE ${collectables.twitterHandle} IS NOT NULL)::int`,
      withAvatar: sql<number>`count(*) FILTER (WHERE ${collectables.avatarUrl} IS NOT NULL)::int`,
    })
    .from(collectables);

  // The expertise and type dropdowns are cached across requests, so a run that
  // added or retired a value has to drop them or the new one stays invisible.
  revalidateTag(FILTER_OPTIONS_TAG);

  return NextResponse.json({
    newItems: newItems.length,
    updatedItems: updatedItems.length,
    deletedItems: deletedItems.length,
    sitesRead: itemsToReadSite.length,
    screenshotsAttempted: itemsToScreenshot.length,
    screenshotsCaptured: screenshotResults.filter(Boolean).length,
    avatarsAttempted: itemsToAvatar.length,
    avatarsFetched: avatarResults.filter(Boolean).length,
    profilesRead: profileResults.filter(Boolean).length,
    profilesFailed: profileResults.filter((read) => !read).length,
    profilesEligible: standing?.eligible ?? 0,
    profilesIncomplete: standing?.incomplete ?? 0,
    profilesUnreadable: standing?.unreadable ?? 0,
    screenshotsEligible: standing?.screenshotsEligible ?? 0,
    withScreenshot: standing?.withScreenshot ?? 0,
    withoutCover: standing?.withoutCover ?? 0,
    withHandle: standing?.withHandle ?? 0,
    withAvatar: standing?.withAvatar ?? 0,
  });
}

/**
 * The per-run slice for one pass: rows the sync already knows it must touch,
 * topped up with the longest-neglected rows matching `where` until the budget
 * is spent.
 *
 * `orderColumn` is what stops the top-up handing back the same rows every run.
 * Without an ordering Postgres is free to, and the backfill stalls short of the
 * rows behind them.
 */
async function withBackfill<T extends { id: string }>(
  priority: T[],
  budget: number,
  where: SQL | undefined,
  orderColumn: AnyPgColumn,
  shape: (row: typeof collectables.$inferSelect) => T,
): Promise<T[]> {
  const remaining = budget - priority.length;
  if (remaining <= 0) return priority;

  const seen = new Set(priority.map((item) => item.id));

  // Over-fetched by the priority count, since those rows usually match `where`
  // too and would otherwise eat into the top-up.
  const rows = await db.query.collectables.findMany({
    where,
    orderBy: [sql`${orderColumn} ASC NULLS FIRST`],
    limit: remaining + seen.size,
  });

  return [
    ...priority,
    ...rows
      .filter((row) => !seen.has(row.id))
      .slice(0, remaining)
      .map(shape),
  ];
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

/**
 * Reads one row's site for the OG image and the designer's handle.
 *
 * The stamp records the reading rather than the result, so it lands even when
 * the page gave neither. Stamping only on success — which this pass used to do
 * — meant a site with no OG image was re-fetched on every run for as long as it
 * stayed in the directory, and the handle lookup would have doubled down on it.
 *
 * Neither field is written as null when it comes back empty: a page that has
 * dropped its OG tag this month shouldn't blank the image a previous run read
 * off it, and a scraped handle shouldn't be cleared by a redesign that moved
 * the footer link. Only a moved URL clears them, up in the sync itself.
 */
async function readSiteMetaAndUpdateDb(item: {
  id: string;
  websiteUrl: string;
}) {
  const meta = await fetchSiteMeta(item.websiteUrl);

  await db
    .update(collectables)
    .set({
      ...(meta.ogImage ? { ogImageUrl: meta.ogImage } : {}),
      ...(meta.twitterHandle ? { twitterHandle: meta.twitterHandle } : {}),
      ogImageLastFetchedAt: new Date(),
    })
    .where(eq(collectables.id, item.id));
}

/**
 * Captures one row's site and records the attempt. Answers whether a cover was
 * actually taken, which is what the run reports.
 *
 * A rate-limited row is left unstamped so it comes round on the next run rather
 * than waiting out the retry window over a ceiling that had nothing to do with
 * it — the same bargain the profile pass strikes.
 */
async function captureScreenshotAndUpdateDb(item: {
  id: string;
  websiteUrl: string;
}): Promise<boolean> {
  const { url, retryable } = await fetchScreenshotUrl(item.websiteUrl);

  if (!url && retryable) return false;

  await db
    .update(collectables)
    .set({
      ...(url ? { screenshotUrl: url } : {}),
      screenshotLastFetchedAt: new Date(),
    })
    .where(eq(collectables.id, item.id));

  return url !== null;
}

/**
 * Mirrors one row's X avatar into Blob.
 *
 * Always stamped: unlike a screenshot, a miss here is nearly always a handle
 * that does not resolve to an account, and re-asking tomorrow will not change
 * that. The row comes back after the retry window in case the account appears.
 */
async function fetchAvatarAndUpdateDb(item: {
  id: string;
  twitterHandle: string | null;
}): Promise<boolean> {
  if (!item.twitterHandle) return false;

  const avatarUrl = await fetchAvatarUrl(item.twitterHandle, item.id);

  await db
    .update(collectables)
    .set({
      ...(avatarUrl ? { avatarUrl } : {}),
      avatarLastFetchedAt: new Date(),
    })
    .where(eq(collectables.id, item.id));

  return avatarUrl !== null;
}
