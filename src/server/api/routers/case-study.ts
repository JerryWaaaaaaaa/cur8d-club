import { z } from "zod";
import { unstable_cache } from "next/cache";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { caseStudies } from "@/server/db/schema";
import { and, arrayOverlaps, eq, sql } from "drizzle-orm";
import { CASE_STUDY_DEFAULT_SORT, SORT_VALUES } from "@/lib/sort-options";
import { getOrderBy } from "@/server/api/sort-order";
import { parseSearchTerms, toLikePattern } from "@/lib/search";
import {
  FILTER_OPTIONS_REVALIDATE_SECONDS,
  FILTER_OPTIONS_TAG,
} from "@/lib/cache-tags";

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
  sort: z.enum(SORT_VALUES).default(CASE_STUDY_DEFAULT_SORT),
  q: z.string().optional(),
});

const FILTER_QUERY_OBJECT_WITH_PAGINATION = FILTER_QUERY_OBJECT.extend({
  cursor: z.number().default(0),
  limit: z.number().default(CASE_STUDY_PER_PAGE),
});

/**
 * The project view's two dropdowns. Cached for the same reason as the designer
 * ones, and against the same tag: a whole-table scan whose answer only moves
 * when a sync runs has no business re-running on every view switch. See
 * `collectable.ts` for why these read the `db` singleton rather than `ctx.db`.
 */
const getUniqueTypes = unstable_cache(
  async () => {
    const rows = await db.query.caseStudies.findMany({
      columns: { types: true },
    });

    return [...new Set(rows.flatMap((row) => row.types ?? []))].filter(
      (type) => type !== "",
    );
  },
  ["case-study-unique-types"],
  {
    tags: [FILTER_OPTIONS_TAG],
    revalidate: FILTER_OPTIONS_REVALIDATE_SECONDS,
  },
);

const getUniqueIndustries = unstable_cache(
  async () => {
    const rows = await db.query.caseStudies.findMany({
      columns: { industries: true },
    });

    return [...new Set(rows.flatMap((row) => row.industries ?? []))].filter(
      (industry) => industry !== "",
    );
  },
  ["case-study-unique-industries"],
  {
    tags: [FILTER_OPTIONS_TAG],
    revalidate: FILTER_OPTIONS_REVALIDATE_SECONDS,
  },
);

export const caseStudyRouter = createTRPCRouter({
  getInfiniteScroll: publicProcedure
    .input(FILTER_QUERY_OBJECT_WITH_PAGINATION)
    .query(async ({ ctx, input }) => {
      const { types, industries, q, cursor, limit, sort } = input;

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
        .orderBy(...getOrderBy(caseStudies, sort));

      return {
        items: items.slice(0, limit),
        nextCursor: items.length > limit ? cursor + limit : undefined,
      };
    }),

  getUniqueTypes: publicProcedure.query(() => getUniqueTypes()),

  getUniqueIndustries: publicProcedure.query(() => getUniqueIndustries()),
});
