"use client";

import {
  ArrowCounterClockwise,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCollectableFilterParams } from "@/hooks/params-parsers/use-collectable-filter-params";
import { useEffect, useMemo, useRef, useState } from "react";
import { MobileDropdown } from "@/components/ui/mobile-dropdown";
import { motion } from "motion/react";
import Link from "next/link";
import { SubmissionForm } from "@/components/submission-form";
import { useViewParams } from "@/hooks/params-parsers/use-view-params";
import { ViewToggle } from "./view-toggle";
import { Logo } from "./logo";
import { MobileCaseStudyFilter } from "./mobile-case-study-filter";
import {
  DEFAULT_SORT,
  SORT_OPTIONS,
  getSortLabel,
  getSortValueFromLabel,
} from "@/lib/sort-options";
import { SearchInput } from "./search-input";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useAccentHover } from "@/hooks/use-accent-hover";

interface MobileNavProps {
  tagOptions: string[];
  typeOptions: string[];
  caseStudyTypeOptions: string[];
  caseStudyIndustryOptions: string[];
}

export function MobileNav({
  tagOptions,
  typeOptions,
  caseStudyTypeOptions,
  caseStudyIndustryOptions,
}: MobileNavProps) {
  const [{ view }] = useViewParams();
  const [params, setParams] = useCollectableFilterParams();
  const {
    type: selectedType,
    tags: selectedTags,
    sort: selectedSort,
    q: search,
  } = params;
  const [submissionFormOpen, setSubmissionFormOpen] = useState(false);
  // One per link in the sheet's footnote, so the two never share a colour.
  const creditAccent = useAccentHover();
  const referralAccent = useAccentHover();

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
  const selectedTypeLabel = selectedType
    ? toTitleCase(selectedType)
    : "All Types";

  // Add state to track open status for each dropdown
  const [typeOpen, setTypeOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Collapsible filter sheet: when collapsed the sheet slides down off screen
  // and only the chevron handle stays visible. The offset is the measured
  // height of the stack, so it tracks the reset row appearing and the two
  // views having different numbers of filters.
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const [sheetContentHeight, setSheetContentHeight] = useState(0);

  useEffect(() => {
    const element = sheetContentRef.current;
    if (!element) return;

    const measure = () => setSheetContentHeight(element.offsetHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className="fixed left-0 right-0 top-0 z-50 bg-gradient-to-b from-white from-[13%] via-white via-[80%] to-transparent p-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo align="left" className="h-12 w-36" />
        </div>
      </div>

      {/* Bottom Sheet — every toggle and filter lives here */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white via-[35%] to-transparent px-5 pt-8"
        animate={{ y: sheetExpanded ? 0 : sheetContentHeight }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        {/* Handle — collapses the sheet off screen and brings it back */}
        <button
          onClick={() => setSheetExpanded((expanded) => !expanded)}
          aria-expanded={sheetExpanded}
          aria-label={sheetExpanded ? "Hide filters" : "Show filters"}
          className="mx-auto mb-2.5 flex h-9 w-16 items-center justify-center rounded-full bg-neutral-200 text-neutral-900 transition-colors hover:bg-neutral-300"
        >
          <motion.div
            animate={{ rotate: sheetExpanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <CaretUp weight="fill" className="h-5 w-5" />
          </motion.div>
        </button>

        {/* Stacked, full-width controls */}
        <div
          ref={sheetContentRef}
          className="flex w-full flex-col gap-2.5 pb-5"
        >
          {view === "case-study" ? (
            <MobileCaseStudyFilter
              typeOptions={caseStudyTypeOptions}
              industryOptions={caseStudyIndustryOptions}
            />
          ) : (
            <>
              <SearchInput
                value={searchDraft}
                onValueChange={setSearchDraft}
                className="h-auto w-full px-5 py-3"
              />

              {/* Type Dropdown */}
              <button
                onClick={() => setTypeOpen(true)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-full px-5 py-3 text-base font-normal transition-colors focus:outline-none",
                  typeOpen
                    ? "bg-neutral-300 text-neutral-900"
                    : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
                )}
              >
                <span className="truncate">{selectedTypeLabel}</span>
                <motion.div
                  animate={{ rotate: typeOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="flex-shrink-0"
                >
                  <CaretDown weight="fill" className="h-5 w-5" />
                </motion.div>
              </button>

              {/* Tag Dropdown (multi-select) */}
              <button
                onClick={() => setTagOpen(true)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-full px-5 py-3 text-base font-normal transition-colors focus:outline-none",
                  tagOpen
                    ? "bg-neutral-300 text-neutral-900"
                    : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
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

              {/* Sort Dropdown */}
              <button
                onClick={() => setSortOpen(true)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-full px-5 py-3 text-base font-normal transition-colors focus:outline-none",
                  sortOpen
                    ? "bg-neutral-300 text-neutral-900"
                    : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
                )}
              >
                <span className="truncate">{getSortLabel(selectedSort)}</span>
                <motion.div
                  animate={{ rotate: sortOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="flex-shrink-0"
                >
                  <CaretDown weight="fill" className="h-5 w-5" />
                </motion.div>
              </button>

              {/* Reset button */}
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
                  className="flex w-full items-center justify-between gap-2 rounded-full bg-neutral-200 px-5 py-3 text-base font-normal text-neutral-900 transition-colors hover:bg-neutral-300"
                  aria-label="Reset filters"
                >
                  <span className="truncate">Reset filters</span>
                  <motion.span
                    whileHover={{ rotate: -60 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex-shrink-0"
                    style={{ display: "inline-flex" }}
                  >
                    <ArrowCounterClockwise weight="fill" className="h-5 w-5" />
                  </motion.span>
                </button>
              )}
            </>
          )}

          {/* View Toggle */}
          <ViewToggle fullWidth />

          {/* Info text — used to live behind an Info button and a modal */}
          <div className="flex flex-col items-center gap-0.5 px-5 pt-1.5 text-center text-base text-neutral-900">
            <p>
              Made by{" "}
              <Link
                href="https://x.com/notjerrywang"
                target="_blank"
                rel="noopener noreferrer"
                {...creditAccent}
              >
                ↳ @Jerry
              </Link>
            </p>
            <p>
              Have someone in mind?{" "}
              <button
                onClick={() => setSubmissionFormOpen(true)}
                {...referralAccent}
              >
                ↳ Submit a referral
              </button>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mobile Dropdowns */}
      <MobileDropdown
        open={typeOpen}
        onOpenChange={setTypeOpen}
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
        options={tagOptions}
        selectedOptions={selectedTags || []}
        onOptionSelect={(tag) => {
          const isSelected = selectedTags?.includes(tag);
          if (isSelected) {
            void setParams({
              ...params,
              tags: selectedTags.filter((t) => t !== tag),
            });
          } else {
            void setParams({ ...params, tags: [...(selectedTags || []), tag] });
          }
        }}
        multiSelect={true}
      />

      <MobileDropdown
        open={sortOpen}
        onOpenChange={setSortOpen}
        options={SORT_OPTIONS.map((option) => option.label)}
        selectedOptions={[getSortLabel(selectedSort)]}
        onOptionSelect={(label) => {
          const sort = getSortValueFromLabel(label);
          if (sort) {
            void setParams({ ...params, sort });
          }
        }}
        multiSelect={false}
      />

      {/* Submission Form */}
      <SubmissionForm
        open={submissionFormOpen}
        onOpenChange={setSubmissionFormOpen}
      />
    </>
  );
}
