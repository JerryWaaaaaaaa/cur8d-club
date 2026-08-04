"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCollectableFilterParams } from "@/hooks/params-parsers/use-collectable-filter-params";
import { useMemo, useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { CaretDown } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { DEFAULT_SORT, SORT_OPTIONS, getSortLabel } from "@/lib/sort-options";
import { SearchInput } from "./search-input";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";

interface HorizontalFilterProps {
  tagOptions: string[];
  typeOptions: string[];
}

export function HorizontalFilter({
  tagOptions,
  typeOptions,
}: HorizontalFilterProps) {
  const [params, setParams] = useCollectableFilterParams();
  const {
    type: selectedType,
    tags: selectedTags,
    sort: selectedSort,
    q: search,
  } = params;

  // Shallow, so the query re-runs the grid's client query without a server
  // round trip for every keystroke.
  const [searchDraft, setSearchDraft] = useDebouncedSearch(
    search,
    (q) => void setParams({ q }, { shallow: true }),
  );

  const hasAnySelection = useMemo(() => {
    return (
      selectedType ||
      (selectedTags && selectedTags.length > 0) ||
      search !== "" ||
      selectedSort !== DEFAULT_SORT
    );
  }, [selectedType, selectedTags, search, selectedSort]);

  // Helper for showing selected tags as comma-separated
  function toTitleCase(str: string) {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
    );
  }

  // Responsive expertise label: show up to 2, then '+x more'
  let selectedTagsLabel = "All Expertise";
  if (selectedTags && selectedTags.length > 0) {
    const shown = selectedTags.slice(0, 2).map(toTitleCase);
    const extra = selectedTags.length - 2;
    if (extra > 0) {
      selectedTagsLabel = `${shown.join(", ")}, and ${extra}+`;
    } else {
      selectedTagsLabel = shown.join(", ");
    }
  }
  const selectedTypeLabel = selectedType
    ? toTitleCase(selectedType)
    : "All Types";

  // Add state to track open status for each dropdown
  const [typeOpen, setTypeOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Nothing to filter by — the dropdowns drop out rather than render controls
  // that can't do anything, but search still has a table to search.
  const hasFilterOptions = typeOptions.length > 0 || tagOptions.length > 0;

  return (
    <div className="flex items-center gap-2.5 pb-0 pt-0">
      <SearchInput
        value={searchDraft}
        onValueChange={setSearchDraft}
        className="w-64"
      />

      {hasFilterOptions && (
        <>
          {/* Type Dropdown */}
          <DropdownMenu.Root open={typeOpen} onOpenChange={setTypeOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-4 text-base font-normal transition-colors focus:outline-none",
                  typeOpen
                    ? "bg-black text-white"
                    : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
                )}
              >
                {selectedTypeLabel}
                <motion.div
                  animate={{ rotate: typeOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <CaretDown weight="fill" className="h-5 w-5" />
                </motion.div>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content open={typeOpen}>
              {typeOptions.map((type) => (
                <DropdownMenu.Item
                  key={type}
                  onSelect={() =>
                    void setParams({
                      ...params,
                      type: selectedType === type ? null : type,
                    })
                  }
                  selected={selectedType === type}
                >
                  {toTitleCase(type)}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          {/* Tag Dropdown (multi-select) */}
          <DropdownMenu.Root open={tagOpen} onOpenChange={setTagOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-4 text-base font-normal transition-colors focus:outline-none",
                  tagOpen
                    ? "bg-black text-white"
                    : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
                )}
                style={{ maxWidth: 240 }}
              >
                <span className="max-w-[240px] truncate">
                  {selectedTagsLabel}
                </span>
                <motion.div
                  animate={{ rotate: tagOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="flex-shrink-0"
                >
                  <CaretDown weight="fill" className="h-5 w-5" />
                </motion.div>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content open={tagOpen}>
              {tagOptions.map((tag) => {
                const isSelected = selectedTags?.includes(tag);
                return (
                  <DropdownMenu.Item
                    key={tag}
                    onSelect={(e) => {
                      e.preventDefault(); // Prevent menu from closing
                      if (isSelected) {
                        void setParams({
                          ...params,
                          tags: selectedTags.filter((t) => t !== tag),
                        });
                      } else {
                        void setParams({
                          ...params,
                          tags: [...(selectedTags || []), tag],
                        });
                      }
                    }}
                    selected={isSelected}
                  >
                    {toTitleCase(tag)}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          {/* Sort Dropdown */}
          <DropdownMenu.Root open={sortOpen} onOpenChange={setSortOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-4 text-base font-normal transition-colors focus:outline-none",
                  sortOpen
                    ? "bg-black text-white"
                    : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
                )}
              >
                {getSortLabel(selectedSort)}
                <motion.div
                  animate={{ rotate: sortOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <CaretDown weight="fill" className="h-5 w-5" />
                </motion.div>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content open={sortOpen}>
              {SORT_OPTIONS.map((option) => (
                <DropdownMenu.Item
                  key={option.value}
                  onSelect={() =>
                    void setParams({ ...params, sort: option.value })
                  }
                  selected={selectedSort === option.value}
                >
                  {option.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </>
      )}

      {/* Reset button — only occupies space once a filter is applied. */}
      {hasAnySelection && (
        <button
          onClick={() =>
            setParams({
              ...params,
              type: null,
              tags: [],
              q: null,
              sort: DEFAULT_SORT,
            })
          }
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-900 transition-all hover:bg-neutral-300"
          aria-label="Reset filters"
        >
          <motion.span
            whileHover={{ rotate: -60 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ display: "inline-flex" }}
          >
            <ArrowCounterClockwise weight="fill" className="h-5 w-5" />
          </motion.span>
        </button>
      )}
    </div>
  );
}
