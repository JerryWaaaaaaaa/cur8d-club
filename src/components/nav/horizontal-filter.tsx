"use client";

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

  // Responsive expertise label: show up to 2, then '+x more'
  let selectedTagsLabel = "All Expertise";
  if (selectedTags && selectedTags.length > 0) {
    const shown = selectedTags.slice(0, 3).map(toTitleCase);
    const extra = selectedTags.length - 3;
    if (extra > 0) {
      selectedTagsLabel = `${shown.join(", ")}, and ${extra}+`;
    } else {
      selectedTagsLabel = shown.join(", ");
    }
  }
  const selectedTypeLabel = selectedType ? toTitleCase(selectedType) : "All Types";

  // Add state to track open status for each dropdown
  const [typeOpen, setTypeOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 pb-0 pt-0">
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
              animate={{ rotate: typeOpen ? 360 : 270 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <CaretDown weight="fill" className="h-4 w-4" />
            </motion.div>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content open={typeOpen}>
          {typeOptions.map((type) => (
            <DropdownMenu.Item
              key={type}
              onSelect={() => void setParams({ ...params, type: selectedType === type ? null : type })}
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
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-normal transition-colors focus:outline-none whitespace-nowrap max-w-xs overflow-hidden text-ellipsis",
              tagOpen
                ? "bg-black text-white"
                : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
            )}
            style={{ maxWidth: 260 }}
          >
            {selectedTagsLabel}
            <motion.div
              animate={{ rotate: tagOpen ? 360 : 270 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <CaretDown weight="fill" className="h-4 w-4" />
            </motion.div>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content open={tagOpen}>
          {tagOptions.map((tag) => {
            const isSelected = selectedTags?.includes(tag);
            return (
              <DropdownMenu.Item
                key={tag}
                onSelect={e => {
                  e.preventDefault(); // Prevent menu from closing
                  if (isSelected) {
                    void setParams({ ...params, tags: selectedTags.filter((t) => t !== tag) });
                  } else {
                    void setParams({ ...params, tags: [...(selectedTags || []), tag] });
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
          "flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-neutral-900 transition-all hover:bg-neutral-300",
          !hasAnySelection && "pointer-events-none opacity-0"
        )}
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
    </div>
  );
}
