import { z } from "zod";
import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { skillSets, skills } from "@/server/db/schema";
import {
  SKILL_SET_DEFAULT_SORT,
  SKILL_SET_SORT_VALUES,
  type SkillSetSortValue,
} from "@/lib/sort-options";
import { getOrderBy } from "@/server/api/sort-order";
import { parseSearchTerms, toLikePattern } from "@/lib/search";

/** Everything the card and the detail view need off a member skill. */
const MEMBER_COLUMNS = {
  id: skills.id,
  name: skills.name,
  description: skills.description,
  sourceRepo: skills.sourceRepo,
  skillKey: skills.skillKey,
  installCommand: skills.installCommand,
  sourceUrl: skills.sourceUrl,
  kind: skills.kind,
  author: skills.author,
  authorAvatarUrl: skills.authorAvatarUrl,
};

const SET_COLUMNS = {
  id: skillSets.id,
  name: skillSets.name,
  slug: skillSets.slug,
  description: skillSets.description,
  useCase: skillSets.useCase,
  skillIds: skillSets.skillIds,
  promptIntro: skillSets.promptIntro,
  sortOrder: skillSets.sortOrder,
  submitterHandle: skillSets.submitterHandle,
  submitterProvider: skillSets.submitterProvider,
  submitterAvatarUrl: skillSets.submitterAvatarUrl,
  createdAt: skillSets.createdAt,
};

/**
 * Free-text search over a set and the skills inside it, so a query naming a
 * skill — "playwright", "typeset" — finds the sets carrying it. That is the one
 * thing a flat index of every skill would have been good for, and it costs a
 * subquery rather than a second view.
 *
 * The `EXISTS` is correlated rather than a denormalised haystack column: at
 * twenty sets the cost is nothing, and a stored copy of every member's name
 * would be one more thing to rebuild whenever a skill is renamed.
 */
function matchesSearch(terms: string[]) {
  if (terms.length === 0) return sql`TRUE`;

  const setText = sql`concat_ws(' ', ${skillSets.name}, ${skillSets.description}, ${skillSets.useCase})`;

  return and(
    ...terms.map((term) => {
      const pattern = toLikePattern(term);

      return sql`(${setText} ILIKE ${pattern} OR EXISTS (
        SELECT 1 FROM ${skills}
        WHERE ${skills.id} = ANY(${skillSets.skillIds})
          AND concat_ws(' ', ${skills.name}, ${skills.sourceRepo}) ILIKE ${pattern}
      ))`;
    }),
  );
}

function orderFor(sort: SkillSetSortValue): SQL[] {
  // The curator's order, which the other two views have no equivalent of.
  if (sort === "curated") {
    return [sql`${skillSets.sortOrder} ASC NULLS LAST`, asc(skillSets.name)];
  }

  return getOrderBy(skillSets, sort);
}

type SetRow = { skillIds: string[] | null };
type MemberRow = { id: string };

/**
 * Attach each set's members, in the order the set lists them.
 *
 * One query for every set on the page rather than one per set, and the lookup
 * is by id afterwards. An id that no longer resolves simply drops out: nothing
 * constrains `skillIds` to skills that still exist, and a set quietly losing a
 * deleted member is the behaviour we want over an error or a hole in the list.
 */
function withMembers<S extends SetRow, M extends MemberRow>(
  sets: S[],
  members: M[],
) {
  const byId = new Map(members.map((member) => [member.id, member]));

  return sets.map((set) => ({
    ...set,
    skills: (set.skillIds ?? [])
      .map((id) => byId.get(id))
      .filter((member): member is M => member !== undefined),
  }));
}

const FILTER_QUERY_OBJECT = z.object({
  useCase: z.string().optional(),
  sort: z.enum(SKILL_SET_SORT_VALUES).default(SKILL_SET_DEFAULT_SORT),
  q: z.string().optional(),
});

export const skillSetRouter = createTRPCRouter({
  /**
   * The whole index. There are twenty sets, so this is deliberately not
   * paginated the way the designer and project grids are — the cursor
   * machinery would be more code than the rows it fetches.
   */
  getAll: publicProcedure
    .input(FILTER_QUERY_OBJECT)
    .query(async ({ ctx, input }) => {
      const { useCase, sort, q } = input;

      const sets = await ctx.db
        .select(SET_COLUMNS)
        .from(skillSets)
        .where(
          and(
            eq(skillSets.isBroken, false),
            useCase ? eq(skillSets.useCase, useCase) : sql`TRUE`,
            matchesSearch(parseSearchTerms(q)),
          ),
        )
        .orderBy(...orderFor(sort));

      const memberIds = [...new Set(sets.flatMap((set) => set.skillIds ?? []))];
      const members =
        memberIds.length === 0
          ? []
          : await ctx.db
              .select(MEMBER_COLUMNS)
              .from(skills)
              .where(inArray(skills.id, memberIds));

      return withMembers(sets, members);
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [set] = await ctx.db
        .select(SET_COLUMNS)
        .from(skillSets)
        .where(
          and(eq(skillSets.slug, input.slug), eq(skillSets.isBroken, false)),
        )
        .limit(1);

      if (!set) return null;

      const memberIds = set.skillIds ?? [];
      const members =
        memberIds.length === 0
          ? []
          : await ctx.db
              .select(MEMBER_COLUMNS)
              .from(skills)
              .where(inArray(skills.id, memberIds));

      return withMembers([set], members)[0] ?? null;
    }),

  getUniqueUseCases: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ useCase: skillSets.useCase })
      .from(skillSets)
      .where(eq(skillSets.isBroken, false));

    return [...new Set(rows.map((row) => row.useCase))].filter(
      (useCase): useCase is string => !!useCase,
    );
  }),
});
