import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { caseStudies } from "@/server/db/schema";
import { and, arrayOverlaps, desc, eq, sql } from "drizzle-orm";
import { parseSearchTerms, toLikePattern } from "@/lib/search";

const CASE_STUDY_PER_PAGE = 12;

/**
 * The case study half of the designer search: name, the two tag arrays, the
 * role/team credits, and the AI summary. `sourceText` is the raw scraped page
 * and is left out — searching it would match nearly every query.
 */
function matchesSearch(terms: string[]) {
  if (terms.length === 0) return sql`TRUE`;

  const haystack = sql`concat_ws(' ', ${caseStudies.name}, ${caseStudies.infoRole}, ${caseStudies.infoTeam}, ${caseStudies.aiSummary}, array_to_string(${caseStudies.types}, ' '), array_to_string(${caseStudies.industries}, ' '))`;

  return and(
    ...terms.map((term) => sql`${haystack} ILIKE ${toLikePattern(term)}`),
  );
}

const FILTER_QUERY_OBJECT = z.object({
  types: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  q: z.string().optional(),
});

const FILTER_QUERY_OBJECT_WITH_PAGINATION = FILTER_QUERY_OBJECT.extend({
  cursor: z.number().default(0),
  limit: z.number().default(CASE_STUDY_PER_PAGE),
});

export const caseStudyRouter = createTRPCRouter({
  getInfiniteScroll: publicProcedure
    .input(FILTER_QUERY_OBJECT_WITH_PAGINATION)
    .query(async ({ ctx, input }) => {
      const { types, industries, q, cursor, limit } = input;

      const items = await ctx.db
        .selectDistinct({
          id: caseStudies.id,
          name: caseStudies.name,
          websiteUrl: caseStudies.websiteUrl,
          mediaType: caseStudies.mediaType,
          videoUrl: caseStudies.videoUrl,
          posterUrl: caseStudies.posterUrl,
          coverImageUrl: caseStudies.coverImageUrl,
          types: caseStudies.types,
          industries: caseStudies.industries,
          infoRole: caseStudies.infoRole,
          infoTeam: caseStudies.infoTeam,
          aiSummary: caseStudies.aiSummary,
          createdAt: caseStudies.createdAt,
        })
        .from(caseStudies)
        .limit(limit + 1)
        .where(
          and(
            eq(caseStudies.isBroken, false),
            types && types.length > 0
              ? arrayOverlaps(caseStudies.types, types)
              : sql`TRUE`,
            industries && industries.length > 0
              ? arrayOverlaps(caseStudies.industries, industries)
              : sql`TRUE`,
            matchesSearch(parseSearchTerms(q)),
          ),
        )
        .offset(cursor)
        .orderBy(desc(caseStudies.createdAt));

      return {
        items: items.slice(0, limit),
        nextCursor: items.length > limit ? cursor + limit : undefined,
      };
    }),

  getUniqueTypes: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.caseStudies.findMany({
      columns: { types: true },
    });

    return [...new Set(rows.flatMap((row) => row.types ?? []))].filter(
      (type) => type !== "",
    );
  }),

  getUniqueIndustries: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.caseStudies.findMany({
      columns: { industries: true },
    });

    return [...new Set(rows.flatMap((row) => row.industries ?? []))].filter(
      (industry) => industry !== "",
    );
  }),
});
