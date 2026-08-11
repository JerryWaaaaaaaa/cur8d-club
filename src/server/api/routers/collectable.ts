import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { collectables } from "@/server/db/schema";
import { eq, and, sql, arrayOverlaps } from "drizzle-orm";
import { DEFAULT_SORT, SORT_VALUES } from "@/lib/sort-options";
import { getOrderBy } from "@/server/api/sort-order";
import { parseSearchTerms, toLikePattern } from "@/lib/search";

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

  getUniqueTags: publicProcedure.query(async ({ ctx }) => {
    const allTags = await ctx.db.query.collectables.findMany({
      columns: {
        tags: true,
      },
    });

    const uniqueTags = allTags
      .flatMap((collectable) => collectable.tags)
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .filter((tag) => tag !== "" && tag !== null);

    return uniqueTags as string[];
  }),

  getUniqueTypes: publicProcedure.query(async ({ ctx }) => {
    const allTypes = await ctx.db.query.collectables.findMany({
      columns: {
        type: true,
      },
    });

    const uniqueTypes = allTypes
      .map((collectable) => collectable.type)
      .filter((type, index, self) => self.indexOf(type) === index)
      .filter((type) => type !== "" && type !== null);

    return uniqueTypes as string[];
  }),

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
