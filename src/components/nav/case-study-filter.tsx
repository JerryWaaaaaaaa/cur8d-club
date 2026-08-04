"use client";

import { ArrowCounterClockwise, CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useCaseStudyFilterParams } from "@/hooks/params-parsers/use-case-study-filter-params";
import { useMemo, useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { motion } from "motion/react";
import { SearchInput } from "./search-input";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";

interface CaseStudyFilterProps {
  typeOptions: string[];
  industryOptions: string[];
}

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );
}

/** "All X" until something is picked, then up to two values and a +n overflow. */
function buildLabel(selected: string[], emptyLabel: string) {
  if (selected.length === 0) return emptyLabel;

  const shown = selected.slice(0, 2).map(toTitleCase);
  const extra = selected.length - 2;

  return extra > 0 ? `${shown.join(", ")}, and ${extra}+` : shown.join(", ");
}

export function CaseStudyFilter({
  typeOptions,
  industryOptions,
}: CaseStudyFilterProps) {
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
      "flex h-9 items-center gap-2 rounded-full px-4 text-base font-normal transition-colors focus:outline-none",
      isOpen
        ? "bg-black text-white"
        : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
    );

  // An empty database means empty dropdowns — each one drops out on its own
  // rather than render a control that can't do anything. Search stays either
  // way; it has the same table to search whether or not the tags are filled in.
  return (
    <div className="flex items-center gap-2.5 pb-0 pt-0">
      <SearchInput
        value={searchDraft}
        onValueChange={setSearchDraft}
        placeholder="Search name, industry, keywords"
        className="w-64"
      />

      {typeOptions.length > 0 && (
        <DropdownMenu.Root open={typeOpen} onOpenChange={setTypeOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              className={triggerClasses(typeOpen)}
              style={{ maxWidth: 240 }}
            >
              <span className="max-w-[240px] truncate">
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
          </DropdownMenu.Trigger>
          <DropdownMenu.Content open={typeOpen}>
            {typeOptions.map((type) => (
              <DropdownMenu.Item
                key={type}
                onSelect={(e) => {
                  e.preventDefault();
                  toggle("types", type);
                }}
                selected={selectedTypes.includes(type)}
              >
                {toTitleCase(type)}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )}

      {industryOptions.length > 0 && (
        <DropdownMenu.Root open={industryOpen} onOpenChange={setIndustryOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              className={triggerClasses(industryOpen)}
              style={{ maxWidth: 240 }}
            >
              <span className="max-w-[240px] truncate">
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
          </DropdownMenu.Trigger>
          <DropdownMenu.Content open={industryOpen}>
            {industryOptions.map((industry) => (
              <DropdownMenu.Item
                key={industry}
                onSelect={(e) => {
                  e.preventDefault();
                  toggle("industries", industry);
                }}
                selected={selectedIndustries.includes(industry)}
              >
                {toTitleCase(industry)}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )}

      {/* Only takes up space once there's something to reset — the header
          column is narrow enough that the idle 36px matters. */}
      {hasAnySelection && (
        <button
          onClick={() =>
            setParams({ ...params, types: [], industries: [], q: null })
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
