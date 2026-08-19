"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

import { api } from "@/trpc/react";
import type { api as serverApi } from "@/trpc/server";
import BilliardBall from "@/components/billiard-ball";
import { SkillSetCard } from "@/components/skill-set-card";
import { SkillSetDetail } from "@/components/skill-set-detail";
import { parseSearchTerms } from "@/lib/search";
import {
  hasAnySkillSetFilterApplied,
  useSkillSetFilterParams,
  useSkillSetSelection,
} from "@/hooks/params-parsers/use-skill-set-filter-params";

type SkillSets = Awaited<
  ReturnType<(typeof serverApi)["skillSet"]["getAll"]>
>;

export type SkillSet = SkillSets[number];

interface SkillSetGridProps {
  initialData: SkillSets;
}

/**
 * The skills tab.
 *
 * Not an infinite scroll, unlike the other two grids: there are twenty sets,
 * and the cursor machinery would be more code than the rows it fetches. If the
 * count ever gets past about fifty this should become
 * `getInfiniteScroll` like its neighbours.
 */
export function SkillSetGrid({ initialData }: SkillSetGridProps) {
  const [filterParams] = useSkillSetFilterParams();
  const [{ set: openSlug }] = useSkillSetSelection();
  const { useCase, sort, q } = filterParams;

  const hasFilter = hasAnySkillSetFilterApplied(filterParams);
  const terms = useMemo(() => parseSearchTerms(q), [q]);

  const { data, isLoading } = api.skillSet.getAll.useQuery(
    { useCase: useCase === "" ? undefined : useCase, sort, q },
    {
      refetchOnWindowFocus: false,
      // The server render only seeds the cache when it rendered the same
      // thing — an unfiltered list. Anything else and this would flash the
      // full set of cards before the filtered ones arrive.
      initialData: hasFilter ? undefined : initialData,
    },
  );

  // The open set comes out of the list already in hand, so opening one is
  // instant and needs no second request.
  const openSet = openSlug
    ? data?.find((skillSet) => skillSet.slug === openSlug)
    : undefined;

  if (openSlug) {
    if (!openSet) {
      return (
        <div className="flex h-[calc(100vh-32rem)] items-center justify-center">
          {isLoading ? (
            <BilliardBall spin />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <BilliardBall ballType="8-ball" />
              <p className="text-2xl">That set doesn&apos;t exist</p>
            </div>
          )}
        </div>
      );
    }

    return <SkillSetDetail skillSet={openSet} terms={terms} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-32rem)] items-center justify-center">
        <BilliardBall spin />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[calc(100vh-32rem)] flex-col items-center justify-center gap-4">
        <BilliardBall ballType="8-ball" />
        <p className="text-2xl">
          {hasFilter ? "No results found" : "No skill sets yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((skillSet, index) => (
        <motion.div
          key={skillSet.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: (index % 12) * 0.1 }}
        >
          <SkillSetCard skillSet={skillSet} terms={terms} />
        </motion.div>
      ))}
    </div>
  );
}

export default SkillSetGrid;
