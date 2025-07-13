"use client";

import { Button } from "@/components/ui/button";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCollectableFilterParams } from "@/hooks/params-parsers/use-collectable-filter-params";
import { useMemo, useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { CaretDown } from "@phosphor-icons/react";
import { motion } from "motion/react";

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
    return selectedType || (selectedTags && selectedTags.length > 0);
  }, [selectedType, selectedTags]);

  // Helper for showing selected tags as comma-separated
  function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  }
  const selectedTagsLabel = selectedTags && selectedTags.length > 0 ? selectedTags.map(toTitleCase).join(", ") : "All Expertise";
  const selectedTypeLabel = selectedType ? toTitleCase(selectedType) : "All Types";

  // Add state to track open status for each dropdown
  const [typeOpen, setTypeOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 pb-4">
      {/* Type Dropdown */}
      <DropdownMenu.Root open={typeOpen} onOpenChange={setTypeOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-normal transition-colors focus:outline-none",
              typeOpen
                ? "bg-black text-white"
                : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
            )}
          >
            {selectedTypeLabel}
            <motion.div
              animate={{ rotate: typeOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <CaretDown weight="fill" className="h-4 w-4" />
            </motion.div>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {typeOptions.map((type) => (
            <DropdownMenu.Item
              key={type}
              onSelect={() => setParams({ ...params, type: selectedType === type ? null : type })}
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
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-normal transition-colors focus:outline-none",
              tagOpen
                ? "bg-black text-white"
                : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
            )}
          >
            {selectedTagsLabel}
            <motion.div
              animate={{ rotate: tagOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <CaretDown weight="fill" className="h-4 w-4" />
            </motion.div>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {tagOptions.map((tag) => {
            const isSelected = selectedTags?.includes(tag);
            return (
              <DropdownMenu.Item
                key={tag}
                onSelect={e => {
                  e.preventDefault(); // Prevent menu from closing
                  if (isSelected) {
                    setParams({ ...params, tags: selectedTags.filter((t) => t !== tag) });
                  } else {
                    setParams({ ...params, tags: [...(selectedTags || []), tag] });
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

      {/* Reset button (moved to right of expertise dropdown) */}
      <button
        onClick={() => setParams({ ...params, type: null, tags: [] })}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 transition-all hover:bg-neutral-300",
          !hasAnySelection && "pointer-events-none opacity-0"
        )}
        aria-label="Reset filters"
      >
        <ArrowCounterClockwise weight="fill" className="h-5 w-5" />
      </button>
    </div>
  );
}
