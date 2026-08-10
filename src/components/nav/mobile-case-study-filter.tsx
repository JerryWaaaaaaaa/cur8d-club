"use client";

import { ArrowCounterClockwise, CaretDown } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { MobileDropdown } from "@/components/ui/mobile-dropdown";
import { useCaseStudyFilterParams } from "@/hooks/params-parsers/use-case-study-filter-params";
import { SearchInput } from "./search-input";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";

interface MobileCaseStudyFilterProps {
  typeOptions: string[];
  industryOptions: string[];
}

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );
}

/** Tighter than the desktop label — one value plus a count, to fit the bar. */
function buildLabel(selected: string[], emptyLabel: string) {
  if (selected.length === 0) return emptyLabel;
  if (selected.length === 1) return toTitleCase(selected[0] ?? "");
  return `${toTitleCase(selected[0] ?? "")}, +${selected.length - 1}`;
}

export function MobileCaseStudyFilter({
  typeOptions,
  industryOptions,
}: MobileCaseStudyFilterProps) {
  const [params, setParams] = useCaseStudyFilterParams();
  const {
    types: selectedTypes,
    industries: selectedIndustries,
    q: search,
  } = params;

  const [typeOpen, setTypeOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);

  // Shallow, so the query re-runs the grid's client query without a server
  // round trip for every keystroke.
  const [searchDraft, setSearchDraft] = useDebouncedSearch(
    search,
    (q) => void setParams({ q }, { shallow: true }),
  );

  const hasAnySelection = useMemo(
    () =>
      selectedTypes.length > 0 ||
      selectedIndustries.length > 0 ||
      search !== "",
    [selectedTypes, selectedIndustries, search],
  );

  const toggle = (key: "types" | "industries", value: string) => {
    const current = params[key];
    void setParams({
      ...params,
      [key]: current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    });
  };

  const triggerClasses = (isOpen: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-2 rounded-full px-5 py-3 text-base font-normal transition-colors focus:outline-none",
      isOpen
        ? "bg-neutral-300 text-neutral-900"
        : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
    );

  // No options means no filters to show — the sheet still carries the view
  // toggle and Info, so only those controls drop out. Search stays either way;
  // it has the same table to search whether or not the tags are filled in.
  return (
    <>
      <SearchInput
        value={searchDraft}
        onValueChange={setSearchDraft}
        placeholder="Search name, industry, keywords"
        className="h-auto w-full px-5 py-3"
      />

      {typeOptions.length > 0 && (
        <button
          onClick={() => setTypeOpen(true)}
          className={triggerClasses(typeOpen)}
        >
          <span className="truncate">
            {buildLabel(selectedTypes, "All Types")}
          </span>
          <motion.div
            animate={{ rotate: typeOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-shrink-0"
          >
            <CaretDown weight="fill" className="h-5 w-5" />
          </motion.div>
        </button>
      )}

      {industryOptions.length > 0 && (
        <button
          onClick={() => setIndustryOpen(true)}
          className={triggerClasses(industryOpen)}
        >
          <span className="truncate">
            {buildLabel(selectedIndustries, "All Industries")}
          </span>
          <motion.div
            animate={{ rotate: industryOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-shrink-0"
          >
            <CaretDown weight="fill" className="h-5 w-5" />
          </motion.div>
        </button>
      )}

      {hasAnySelection && (
        <button
          onClick={() =>
            setParams({ ...params, types: [], industries: [], q: null })
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

      <MobileDropdown
        open={typeOpen}
        onOpenChange={setTypeOpen}
        options={typeOptions}
        selectedOptions={selectedTypes}
        onOptionSelect={(type) => toggle("types", type)}
        multiSelect={true}
      />

      <MobileDropdown
        open={industryOpen}
        onOpenChange={setIndustryOpen}
        options={industryOptions}
        selectedOptions={selectedIndustries}
        onOptionSelect={(industry) => toggle("industries", industry)}
        multiSelect={true}
      />
    </>
  );
}
