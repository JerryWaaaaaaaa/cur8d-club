"use client";

import { ArrowCounterClockwise, CaretDown, CheckCircle, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCollectableFilterParams } from "@/hooks/params-parsers/use-collectable-filter-params";
import { useMemo, useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";

interface MobileNavProps {
  tagOptions: string[];
  typeOptions: string[];
}

export function MobileNav({ tagOptions, typeOptions }: MobileNavProps) {
  const [params, setParams] = useCollectableFilterParams();
  const { type: selectedType, tags: selectedTags } = params;

  const hasAnySelection = useMemo(() => {
    return selectedType || (selectedTags && selectedTags.length > 0);
  }, [selectedType, selectedTags]);

  // Helper for showing selected tags as comma-separated
  function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  }

  // Improved expertise label: show first item + count for overflow
  let selectedTagsLabel = "All Expertise";
  if (selectedTags && selectedTags.length > 0) {
    if (selectedTags.length === 1) {
      selectedTagsLabel = toTitleCase(selectedTags[0] || "");
    } else {
      const firstTag = toTitleCase(selectedTags[0] || "");
      const extraCount = selectedTags.length - 1;
      selectedTagsLabel = `${firstTag}, +${extraCount}`;
    }
  }
  const selectedTypeLabel = selectedType ? toTitleCase(selectedType) : "All Types";

  // Add state to track open status for each dropdown
  const [typeOpen, setTypeOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-white from-[13%] via-white via-[80%] to-transparent p-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="relative h-12 w-36">
            <Image
              src="/site-assets/logo.svg"
              alt="cur8d.club"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
          
          {/* Info Button */}
          <button
            onClick={() => setInfoOpen(true)}
            className="flex items-center gap-2 rounded-full bg-neutral-200 px-4 py-2 text-base font-normal text-neutral-900 transition-colors hover:bg-neutral-300"
          >
            Info
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white via-[35%] to-transparent p-5">
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
          <div className="flex items-center gap-2.5 justify-center">
            {/* Type Dropdown */}
            <DropdownMenu.Root open={typeOpen} onOpenChange={setTypeOpen}>
              <DropdownMenu.Trigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-base font-normal transition-colors focus:outline-none",
                    typeOpen
                      ? "bg-neutral-300 text-neutral-900"
                      : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
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
              <DropdownMenu.Content open={typeOpen} className="min-w-[200px]">
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
                    "flex items-center gap-2 rounded-full px-4 py-2 text-base font-normal transition-colors focus:outline-none whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis",
                    tagOpen
                      ? "bg-neutral-300 text-neutral-900"
                      : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
                  )}
                >
                  <span className="truncate">{selectedTagsLabel}</span>
                  <motion.div
                    animate={{ rotate: tagOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex-shrink-0"
                  >
                    <CaretDown weight="fill" className="h-5 w-5" />
                  </motion.div>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content open={tagOpen} className="min-w-[200px]">
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

            {/* Reset button */}
            {hasAnySelection && (
              <button
                onClick={() => setParams({ ...params, type: null, tags: [] })}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-neutral-900 transition-all hover:bg-neutral-300 p-2"
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
        </div>
      </div>

      {/* Info Overlay */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            onClick={() => setInfoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative mx-4 max-w-sm rounded-3xl bg-white p-8 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setInfoOpen(false)}
                className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-900 transition-colors hover:bg-neutral-300"
              >
                <X weight="fill" className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="flex flex-col items-center gap-5 text-center">
                {/* Logo */}
                <div className="relative h-12 w-36">
                  <Image
                    src="/site-assets/logo.svg"
                    alt="cur8d.club"
                    fill
                    priority
                    className="object-contain object-center"
                  />
                </div>

                {/* Info text */}
                <div className="flex flex-col items-center gap-2 text-base text-neutral-900">
                  <p>Discover inspiring designers every week.</p>
                  <p>
                    Curated by{" "}
                    <Link
                      href="https://x.com/notjerrywang"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      ↳ @Jerry
                    </Link>
                  </p>
                  <p>
                    Have someone in mind?{" "}
                    <Link
                      href="https://form.typeform.com/to/T4Xb0N7L"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      ↳ Submit a referral
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 