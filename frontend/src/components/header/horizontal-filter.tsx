"use client";

import { Button } from "@/components/ui/button";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCollectableFilterParams } from "@/hooks/params-parsers/use-collectable-filter-params";
import { useMemo } from "react";
interface HorizontalFilterProps {
  tagOptions: string[];
  typeOptions: string[];
}

export function HorizontalFilter({
  tagOptions,
  typeOptions,
}: HorizontalFilterProps) {
  const [params, setParams] = useCollectableFilterParams();
  const { type: selectedType, tags: selectedTags } = params;

  const hasAnySelection = useMemo(() => {
    return selectedType ?? (selectedTags && selectedTags.length > 0);
  }, [selectedType, selectedTags]);

  return (
    <div className="scrollbar-hide -mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-3.5 overflow-x-auto pb-4">
      {/* All button */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          onClick={() => {
            void setParams({
              ...params,
              type: null,
              tags: [],
            });
          }}
          className={cn(
            "h-9 rounded-full border-0 px-4 text-sm font-normal",
            !hasAnySelection
              ? "bg-black text-white hover:bg-black/80 hover:text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300",
          )}
        >
          All
        </Button>

        {/* Reset button */}
        {hasAnySelection && (
          <Button
            variant="outline"
            onClick={() => {
              void setParams({
                ...params,
                type: null,
                tags: [],
              });
            }}
            className="group -ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-gray-200 px-2 text-sm font-normal text-gray-600 hover:bg-gray-300"
          >
            <ArrowCounterClockwise
              weight="bold"
              className="h-4 w-4 origin-center transform transition-all duration-300 ease-out group-hover:-rotate-[60deg]"
            />
            <span className="sr-only">Reset filters</span>
          </Button>
        )}
      </div>

      <div className="h-full w-px shrink-0 bg-gray-200" />

      {/* Type buttons */}
      <div className="flex items-center gap-1">
        {typeOptions.map((type) => (
          <Button
            key={type}
            variant="outline"
            className={cn(
              "-ml-1 h-9 rounded-full border-0 px-4 text-sm font-normal first:-ml-0",
              selectedType === type
                ? "bg-black text-white hover:bg-black/80 hover:text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300",
            )}
            onClick={() => {
              if (selectedType === type) {
                void setParams({
                  ...params,
                  type: null,
                });
              } else {
                void setParams({
                  ...params,
                  type,
                });
              }
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      <div className="h-full w-px shrink-0 bg-gray-200" />

      {/* Tag buttons */}
      <div className="flex items-center gap-1">
        {tagOptions.map((tag) => (
          <Button
            key={tag}
            variant="outline"
            className={cn(
              "-ml-1 h-9 rounded-full border-0 px-4 text-sm font-normal first:-ml-0",
              selectedTags?.includes(tag)
                ? "bg-black text-white hover:bg-black/80 hover:text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300",
            )}
            onClick={() => {
              if (selectedTags?.includes(tag)) {
                void setParams({
                  ...params,
                  tags: params.tags?.filter((t) => t !== tag),
                });
              } else {
                void setParams({
                  ...params,
                  tags: [tag],
                });
              }
            }}
          >
            {tag}
          </Button>
        ))}
      </div>
    </div>
  );
}
