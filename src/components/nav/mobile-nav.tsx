"use client";

import { ArrowCounterClockwise, CaretDown, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCollectableFilterParams } from "@/hooks/params-parsers/use-collectable-filter-params";
import { useMemo, useState } from "react";
import { MobileDropdown } from "@/components/ui/mobile-dropdown";
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
      selectedTagsLabel = toTitleCase(selectedTags[0] ?? "");
    } else {
      const firstTag = toTitleCase(selectedTags[0] ?? "");
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
            <button
              onClick={() => setTypeOpen(true)}
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

            {/* Tag Dropdown (multi-select) */}
            <button
              onClick={() => setTagOpen(true)}
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

      {/* Mobile Dropdowns */}
      <MobileDropdown
        open={typeOpen}
        onOpenChange={setTypeOpen}
        title="Type"
        options={typeOptions}
        selectedOptions={selectedType ? [selectedType] : []}
        onOptionSelect={(type) => {
          const newType = selectedType === type ? null : type;
          void setParams({ ...params, type: newType });
        }}
        multiSelect={false}
      />

      <MobileDropdown
        open={tagOpen}
        onOpenChange={setTagOpen}
        title="Tags"
        options={tagOptions}
        selectedOptions={selectedTags || []}
        onOptionSelect={(tag) => {
          const isSelected = selectedTags?.includes(tag);
          if (isSelected) {
            void setParams({ ...params, tags: selectedTags.filter((t) => t !== tag) });
          } else {
            void setParams({ ...params, tags: [...(selectedTags || []), tag] });
          }
        }}
        multiSelect={true}
      />

      {/* Info Overlay */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/10 backdrop-blur-[96px]"
            onClick={() => setInfoOpen(false)}
          >
            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative w-full max-w-sm h-screen flex flex-col justify-end pt-3 px-2 pb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-2 h-full">
                {/* Content Container */}
                <div className="flex flex-col gap-5 flex-1 items-center justify-center">
                  {/* Logo */}
                  <div className="relative h-20 w-48">
                    <Image
                      src="/site-assets/logo.svg"
                      alt="cur8d.club"
                      fill
                      priority
                      className="object-contain object-center"
                    />
                  </div>

                  {/* Info text */}
                  <div className="flex flex-col items-center gap-0.5 text-base text-neutral-900 text-center">
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

                {/* Dismiss Button */}
                <motion.button
                  onClick={() => setInfoOpen(false)}
                  className="flex h-20 w-full items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-200 shrink-0"
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 