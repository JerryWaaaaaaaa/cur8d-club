import { z } from "zod";
import { unstable_cache } from "next/cache";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { collectables } from "@/server/db/schema";
import { eq, and, sql, arrayOverlaps } from "drizzle-orm";
import { DEFAULT_SORT, SORT_VALUES } from "@/lib/sort-options";
import { getOrderBy } from "@/server/api/sort-order";
import { parseSearchTerms, toLikePattern } from "@/lib/search";
import {
  FILTER_OPTIONS_REVALIDATE_SECONDS,
  FILTER_OPTIONS_TAG,
} from "@/lib/cache-tags";

const COLLECTABLE_PER_PAGE = 12;

/**
 * Free-text search over name, expertise tags, role, and the AI blurb. The
 * columns are folded into one string per row — `concat_ws` drops the nulls and
 * `array_to_string` flattens the tag array — so a term matches wherever it
 * lands. Location is deliberately not searched.
 */
function matchesSearch(terms: string[]) {
  if (terms.length === 0) return sql`TRUE`;

  const haystack = sql`concat_ws(' ', ${collectables.name}, ${collectables.title}, ${collectables.company}, ${collectables.aiDescription}, array_to_string(${collectables.tags}, ' '))`;

  return and(
    ...terms.map((term) => sql`${haystack} ILIKE ${toLikePattern(term)}`),
  );
}

const FILTER_QUERY_OBJECT = z.object({
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  q: z.string().optional(),
  sort: z.enum(SORT_VALUES).default(DEFAULT_SORT),
});

const FILTER_QUERY_OBJECT_WITH_PAGINATION = FILTER_QUERY_OBJECT.extend({
  cursor: z.number().default(0),
  limit: z.number().default(COLLECTABLE_PER_PAGE),
});

/**
 * The two filter dropdowns on the designer view. Both scan the whole table to
 * collect its distinct values, and both were being re-run on every request —
 * including every view switch, which is a server round trip. The answer only
 * changes when a sync writes rows, so it is cached under a tag the sync routes
 * drop rather than recomputed per page view.
 *
 * These read the `db` singleton directly instead of `ctx.db`: it is the same
 * instance the context is built from, and a cache entry outlives the request
 * whose context it would otherwise have closed over.
 */
const getUniqueTags = unstable_cache(
  async () => {
    const allTags = await db.query.collectables.findMany({
      columns: {
        tags: true,
      },
    });

    const uniqueTags = [
      ...new Set(allTags.flatMap((collectable) => collectable.tags)),
    ].filter((tag) => tag !== "" && tag !== null);

    return uniqueTags as string[];
  },
  ["collectable-unique-tags"],
  {
    tags: [FILTER_OPTIONS_TAG],
    revalidate: FILTER_OPTIONS_REVALIDATE_SECONDS,
  },
);

const getUniqueTypes = unstable_cache(
  async () => {
    const allTypes = await db.query.collectables.findMany({
      columns: {
        type: true,
      },
    });

    const uniqueTypes = [
      ...new Set(allTypes.map((collectable) => collectable.type)),
    ].filter((type) => type !== "" && type !== null);

    return uniqueTypes as string[];
  },
  ["collectable-unique-types"],
  {
    tags: [FILTER_OPTIONS_TAG],
    revalidate: FILTER_OPTIONS_REVALIDATE_SECONDS,
  },
);

export const collectableRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getInfiniteScroll: publicProcedure
    .input(FILTER_QUERY_OBJECT_WITH_PAGINATION)
    .query(async ({ ctx, input }) => {
      const { type, tags, q, cursor, limit, sort } = input;

      const query = ctx.db
        .selectDistinct({
          id: collectables.id,
          name: collectables.name,
          type: collectables.type,
          tags: collectables.tags,
          createdAt: collectables.createdAt,
          websiteUrl: collectables.websiteUrl,
          screenshotUrl: collectables.screenshotUrl,
          ogImageUrl: collectables.ogImageUrl,
          avatarUrl: collectables.avatarUrl,
          twitterHandle: collectables.twitterHandle,
          aiDescription: collectables.aiDescription,
          location: collectables.location,
          company: collectables.company,
          title: collectables.title,
        })
        .from(collectables)
        .limit(limit + 1)
        .where(
          and(
            eq(collectables.isBroken, false),
            type ? eq(collectables.type, type) : sql`TRUE`,
            tags && tags.length > 0
              ? arrayOverlaps(collectables.tags, tags)
              : sql`TRUE`,
            matchesSearch(parseSearchTerms(q)),
          ),
        )
        .offset(cursor)
        .orderBy(...getOrderBy(collectables, sort));

      const items = await query;
      let nextCursor: number | undefined = undefined;

      if (items.length > limit) {
        nextCursor = cursor + limit;
      }

      return {
        items: items.slice(0, limit),
        nextCursor,
      };
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const allCollectables = await ctx.db.query.collectables.findMany({
      orderBy: (collectables, { desc }) => [desc(collectables.createdAt)],
    });

    return allCollectables;
  }),

  getUniqueTags: publicProcedure.query(() => getUniqueTags()),

  getUniqueTypes: publicProcedure.query(() => getUniqueTypes()),

  reportLink: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(collectables)
        .set({ isReported: true })
        .where(
          and(
            eq(collectables.id, input.id),
            eq(collectables.isReported, false),
          ),
        );

      return { success: true };
    }),
});
