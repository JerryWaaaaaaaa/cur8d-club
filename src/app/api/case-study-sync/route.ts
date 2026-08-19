import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import {
  fetchCaseStudyData,
  type NotionCaseStudy,
} from "@/lib/case-study-sync";
import { generateSummary } from "@/lib/ai-summary";
import { mirrorToBlob } from "@/lib/blob-storage";
import { fetchScreenshotUrl } from "@/lib/screenshot";
import { db } from "@/server/db";
import { FILTER_OPTIONS_TAG } from "@/lib/cache-tags";
import { caseStudies } from "@/server/db/schema";

export const maxDuration = 60;

type DbCaseStudy = typeof caseStudies.$inferSelect;

/** Drops tags that no longer exist as options in Notion. */
async function cleanupOrphanedIndustries(notionItems: NotionCaseStudy[]) {
  const validIndustries = new Set(
    notionItems.flatMap((item) => item.industries),
  );
  const dbItems = await db.query.caseStudies.findMany();

  const stale = dbItems.filter((item) =>
    item.industries?.some((industry) => !validIndustries.has(industry)),
  );

  await Promise.all(
    stale.map((item) =>
      db
        .update(caseStudies)
        .set({
          industries:
            item.industries?.filter((industry) =>
              validIndustries.has(industry),
            ) ?? [],
        })
        .where(eq(caseStudies.id, item.id)),
    ),
  );

  return stale.length;
}

/**
 * Resolves the media for one row and writes it back.
 *
 * Video wins when Notion has one: the file is mirrored into Blob so playback
 * doesn't depend on an expiring Notion URL. Website entries fall back to a
 * screenshot. Either way the summary comes last, since it can reuse the
 * captured source text.
 */
async function enrichCaseStudy(item: NotionCaseStudy) {
  const [videoUrl, posterUrl] = await Promise.all([
    item.videoUrl
      ? mirrorToBlob(item.videoUrl, `case-studies/${item.id}/video.mp4`)
      : Promise.resolve(null),
    item.posterUrl
      ? mirrorToBlob(item.posterUrl, `case-studies/${item.id}/poster.jpg`)
      : Promise.resolve(null),
  ]);

  const isVideo = videoUrl !== null;

  const coverImageUrl =
    !isVideo && item.websiteUrl
      ? (await fetchScreenshotUrl(item.websiteUrl)).url
      : null;

  const aiSummary = await generateSummary({
    name: item.name,
    url: item.websiteUrl,
    sourceText: item.sourceText,
    types: item.types,
    industries: item.industries,
  });

  await db
    .update(caseStudies)
    .set({
      mediaType: isVideo ? "video" : "website",
      videoUrl,
      posterUrl,
      ...(coverImageUrl
        ? { coverImageUrl, coverImageLastFetchedAt: new Date() }
        : {}),
      ...(aiSummary ? { aiSummary, aiSummaryGeneratedAt: new Date() } : {}),
    })
    .where(eq(caseStudies.id, item.id));
}

/** True when anything the enrichment step depends on has changed. */
function needsEnrichment(item: NotionCaseStudy, dbItem: DbCaseStudy) {
  return (
    dbItem.websiteUrl !== item.websiteUrl ||
    dbItem.sourceText !== item.sourceText ||
    // Notion holds the upstream URL; the DB holds the mirrored Blob URL, so
    // compare on presence rather than equality.
    (item.videoUrl !== null) !== (dbItem.videoUrl !== null) ||
    (item.posterUrl !== null) !== (dbItem.posterUrl !== null) ||
    dbItem.aiSummary === null
  );
}

export async function GET() {
  // The daily cron runs whether or not case studies have been set up yet, so
  // treat missing credentials as "nothing to do" rather than an error.
  if (
    !process.env.NOTION_CASE_STUDY_DATABASE_ID ||
    !process.env.NOTION_API_KEY
  ) {
    return NextResponse.json({
      skipped: "case study sync is not configured",
      missing: [
        !process.env.NOTION_CASE_STUDY_DATABASE_ID &&
          "NOTION_CASE_STUDY_DATABASE_ID",
        !process.env.NOTION_API_KEY && "NOTION_API_KEY",
      ].filter(Boolean),
    });
  }

  const trueItems = await fetchCaseStudyData();
  const dbItems = await db.query.caseStudies.findMany();

  const newItems = trueItems.filter(
    (item) => !dbItems.some((dbItem) => dbItem.id === item.id),
  );
  const existingItems = trueItems.filter((item) =>
    dbItems.some((dbItem) => dbItem.id === item.id),
  );
  const deletedItems = dbItems.filter(
    (dbItem) => !trueItems.some((item) => item.id === dbItem.id),
  );

  const writes: Promise<unknown>[] = [];

  if (newItems.length > 0) {
    writes.push(
      db.insert(caseStudies).values(
        newItems.map((item) => ({
          id: item.id,
          name: item.name,
          websiteUrl: item.websiteUrl,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          types: item.types,
          industries: item.industries,
          infoRole: item.infoRole,
          infoTeam: item.infoTeam,
          sourceText: item.sourceText,
        })),
      ),
    );
  }

  writes.push(
    ...existingItems.map((item) =>
      db
        .update(caseStudies)
        .set({
          name: item.name,
          websiteUrl: item.websiteUrl,
          updatedAt: new Date(item.updatedAt),
          types: item.types,
          industries: item.industries,
          infoRole: item.infoRole,
          infoTeam: item.infoTeam,
          sourceText: item.sourceText,
        })
        .where(eq(caseStudies.id, item.id)),
    ),
  );

  if (deletedItems.length > 0) {
    writes.push(
      db.delete(caseStudies).where(
        inArray(
          caseStudies.id,
          deletedItems.map((item) => item.id),
        ),
      ),
    );
  }

  await Promise.all(writes);

  const cleanedUp = await cleanupOrphanedIndustries(trueItems);

  // Only re-derive media and summaries where the inputs actually moved —
  // screenshots and model calls are the expensive part of this route.
  const staleItems = existingItems.filter((item) => {
    const dbItem = dbItems.find((row) => row.id === item.id);
    return dbItem ? needsEnrichment(item, dbItem) : false;
  });

  const itemsToEnrich = [...newItems, ...staleItems];
  await Promise.all(itemsToEnrich.map(enrichCaseStudy));

  // Same as the designer sync: the type and industry dropdowns are cached, so a
  // run that changed the set of values has to drop them.
  revalidateTag(FILTER_OPTIONS_TAG);

  return NextResponse.json({
    newItems: newItems.length,
    updatedItems: existingItems.length,
    deletedItems: deletedItems.length,
    cleanedUpIndustries: cleanedUp,
    enrichedItems: itemsToEnrich.length,
  });
}
