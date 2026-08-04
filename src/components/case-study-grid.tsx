"use client";

import { api } from "@/trpc/react";
import type { api as serverApi } from "@/trpc/server";
import { useMemo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { motion } from "motion/react";

import {
  hasAnyCaseStudyFilterApplied,
  useCaseStudyFilterParams,
} from "@/hooks/params-parsers/use-case-study-filter-params";
import { CaseStudyCard } from "./case-study-card";
import BilliardBall from "./billiard-ball";

interface CaseStudyGridProps {
  initialData: Awaited<
    ReturnType<(typeof serverApi)["caseStudy"]["getInfiniteScroll"]>
  >;
  pageSize: number;
}

function CaseStudyGrid({ initialData, pageSize }: CaseStudyGridProps) {
  const [filterParams] = useCaseStudyFilterParams();

  const hasFilter = hasAnyCaseStudyFilterApplied(filterParams);

  const infiniteCaseStudies = api.caseStudy.getInfiniteScroll.useInfiniteQuery(
    {
      limit: pageSize,
      types: filterParams.types,
      industries: filterParams.industries,
      q: filterParams.q,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,

      initialData: hasFilter
        ? undefined
        : {
            pages: [initialData],
            pageParams: [undefined],
          },
    },
  );

  const allItems = useMemo(() => {
    return infiniteCaseStudies.data?.pages.flatMap((page) => page.items);
  }, [infiniteCaseStudies.data]);

  return (
    <>
      {infiniteCaseStudies.isLoading && (
        <div className="flex h-[calc(100vh-32rem)] items-center justify-center">
          <BilliardBall className="" spin />
        </div>
      )}

      {!infiniteCaseStudies.isLoading && allItems?.length > 0 && (
        <InfiniteScroll
          className="pb-24 md:pb-24"
          dataLength={infiniteCaseStudies.data?.pages.length ?? 0}
          next={infiniteCaseStudies.fetchNextPage}
          hasMore={infiniteCaseStudies.hasNextPage || false}
          scrollableTarget="scrollableDiv"
          style={{ overflow: "visible" }}
          loader={
            <div className="flex items-center justify-center">
              <BilliardBall className="mt-12" spin />
            </div>
          }
        >
          {/* One column looser than the designer grid at every breakpoint, so
              project previews read larger than a collectable. */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
            {allItems?.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (i % pageSize) * 0.1 }}
              >
                <CaseStudyCard caseStudy={item} />
              </motion.div>
            ))}
          </div>
        </InfiniteScroll>
      )}

      {!infiniteCaseStudies.isLoading && allItems?.length === 0 && (
        <div className="flex h-[calc(100vh-32rem)] flex-col items-center justify-center gap-4">
          <BilliardBall className="" ballType="8-ball" />
          {/* An empty table and a search that matched nothing are different
              things to be told. */}
          <p className="text-2xl">
            {hasFilter ? "No results found" : "No projects yet"}
          </p>
        </div>
      )}
    </>
  );
}

export default CaseStudyGrid;
