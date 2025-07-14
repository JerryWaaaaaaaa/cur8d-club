import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { collectables } from "@/server/db/schema";
import {
  eq,
  and,
  sql,
  arrayOverlaps,
  asc,
} from "drizzle-orm";

const COLLECTABLE_PER_PAGE = 12;

const FILTER_QUERY_OBJECT = z.object({
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
      const { type, tags, cursor, limit } = input;

      const query = ctx.db
        .selectDistinct({
          id: collectables.id,
          name: collectables.name,
          type: collectables.type,
          tags: collectables.tags,
          createdAt: collectables.createdAt,
          websiteUrl: collectables.websiteUrl,
          ogImageUrl: collectables.ogImageUrl,
        })
        .from(collectables)
        .limit(limit + 1)
        .where(
          and(
            type ? eq(collectables.type, type) : sql`TRUE`,
            tags && tags.length > 0
              ? arrayOverlaps(collectables.tags, tags)
              : sql`TRUE`,
          ),
        )
        .offset(cursor)
        .orderBy(asc(collectables.name));

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
});
