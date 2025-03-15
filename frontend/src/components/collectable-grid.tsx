"use client";

import { api } from "@/trpc/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { api as serverApi } from "@/trpc/server";
import { Suspense, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

import {
  hasAnyFilterApplied,
  useCollectableFilterParams,
} from "@/hooks/params-parsers/use-collectable-filter-params";
import { CollectableCard } from "./collectable-card";
import LoadingBall from "./loading-ball";
interface CollectableGridProps {
  initialData: Awaited<
    ReturnType<(typeof serverApi)["collectable"]["getInfiniteScroll"]>
  >;
  pageSize: number;
}

function CollectableGrid({ initialData, pageSize }: CollectableGridProps) {
  const [filterParams, setFilterParams] = useCollectableFilterParams();

  const hasFilter = hasAnyFilterApplied(filterParams);

  const infiniteCollectables =
    api.collectable.getInfiniteScroll.useInfiniteQuery(
      {
        limit: pageSize,
        type: filterParams.type,
        tags: filterParams.tags,
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

  return (
    <>
      {infiniteCollectables.isLoading && (
        <div className="flex h-[calc(100vh-36rem)] items-center justify-center">
          <LoadingBall className="mt-12" ballType="cue-ball" />
        </div>
      )}

      {infiniteCollectables.isFetched && (
        <InfiniteScroll
          className="pb-24"
          dataLength={infiniteCollectables.data?.pages.length ?? 0}
          next={infiniteCollectables.fetchNextPage}
          hasMore={infiniteCollectables.hasNextPage && false}
          scrollableTarget="scrollableDiv"
          style={{ overflow: "visible" }}
          loader={
            <div className="flex items-center justify-center">
              <LoadingBall className="mt-12" />
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {infiniteCollectables.data?.pages.map((page) =>
              page.items.map((item) => (
                <CollectableCard key={item.id} collectable={item} />
              )),
            )}
          </div>
        </InfiniteScroll>
      )}
    </>
  );
}

export default CollectableGrid;
