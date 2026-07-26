"use client";

import { ArrowCounterClockwise, CaretDown } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { MobileDropdown } from "@/components/ui/mobile-dropdown";
import { useCaseStudyFilterParams } from "@/hooks/params-parsers/use-case-study-filter-params";

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
  const { types: selectedTypes, industries: selectedIndustries } = params;

  const [typeOpen, setTypeOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);

  const hasAnySelection = useMemo(
    () => selectedTypes.length > 0 || selectedIndustries.length > 0,
    [selectedTypes, selectedIndustries],
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
      "flex max-w-[160px] items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-4 py-2 text-base font-normal transition-colors focus:outline-none",
      isOpen
        ? "bg-neutral-300 text-neutral-900"
        : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
    );

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white via-[35%] to-transparent p-5">
        <div className="flex w-full flex-wrap items-center justify-center gap-2.5">
          <div className="flex items-center justify-center gap-2.5">
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

            {hasAnySelection && (
              <button
                onClick={() => setParams({ ...params, types: [], industries: [] })}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 p-2 text-neutral-900 transition-all hover:bg-neutral-300"
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
