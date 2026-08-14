"use client";

import { ArrowCounterClockwise, CaretDown } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { MobileDropdown } from "@/components/ui/mobile-dropdown";
import {
  hasAnySkillSetFilterApplied,
  useSkillSetFilterParams,
  useSkillSetSelection,
} from "@/hooks/params-parsers/use-skill-set-filter-params";
import {
  SKILL_SET_DEFAULT_SORT,
  SKILL_SET_SORT_OPTIONS,
  getSkillSetSortLabel,
  getSkillSetSortValueFromLabel,
} from "@/lib/sort-options";
import { SearchInput } from "./search-input";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";

interface MobileSkillSetFilterProps {
  useCaseOptions: string[];
}

export function MobileSkillSetFilter({
  useCaseOptions,
}: MobileSkillSetFilterProps) {
  const [params, setParams] = useSkillSetFilterParams();
  const [{ set }, setSelection] = useSkillSetSelection();
  const { useCase: selectedUseCase, sort: selectedSort, q: search } = params;

  const [useCaseOpen, setUseCaseOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Shallow, so the query re-runs the grid's client query without a server
  // round trip for every keystroke.
  const [searchDraft, setSearchDraft] = useDebouncedSearch(
    search,
    (q) => void setParams({ q }, { shallow: true }),
  );

  const hasAnySelection = useMemo(
    () => hasAnySkillSetFilterApplied(params),
    [params],
  );

  const triggerClasses = (isOpen: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-2 rounded-full px-5 py-3 text-base font-normal transition-colors focus:outline-none",
      isOpen
        ? "bg-neutral-300 text-neutral-900"
        : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
    );

  // Inside a set the sheet carries the way back out instead of the filters,
  // which would only narrow the list you would be returning to. On desktop
  // that back button sits above the list; here every control lives in the
  // sheet, so it belongs in the sheet too.
  if (set !== "") {
    return (
      <button
        onClick={() => void setSelection({ set: null })}
        className="flex w-full items-center justify-between gap-2 rounded-full bg-neutral-200 px-5 py-3 text-base font-normal text-neutral-900 transition-colors hover:bg-neutral-300"
      >
        <span className="truncate">All sets</span>
      </button>
    );
  }

  return (
    <>
      <SearchInput
        value={searchDraft}
        onValueChange={setSearchDraft}
        placeholder="Search sets, skills, repos"
        className="h-auto w-full px-5 py-3"
      />

      {useCaseOptions.length > 0 && (
        <button
          onClick={() => setUseCaseOpen(true)}
          className={triggerClasses(useCaseOpen)}
        >
          <span className="truncate">
            {selectedUseCase === "" ? "All Types" : selectedUseCase}
          </span>
          <motion.div
            animate={{ rotate: useCaseOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-shrink-0"
          >
            <CaretDown weight="fill" className="h-5 w-5" />
          </motion.div>
        </button>
      )}

      <button
        onClick={() => setSortOpen(true)}
        className={triggerClasses(sortOpen)}
      >
        <span className="truncate">{getSkillSetSortLabel(selectedSort)}</span>
        <motion.div
          animate={{ rotate: sortOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex-shrink-0"
        >
          <CaretDown weight="fill" className="h-5 w-5" />
        </motion.div>
      </button>

      {hasAnySelection && (
        <button
          onClick={() =>
            setParams({
              ...params,
              useCase: "",
              sort: SKILL_SET_DEFAULT_SORT,
              q: null,
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

      <MobileDropdown
        open={useCaseOpen}
        onOpenChange={setUseCaseOpen}
        options={useCaseOptions}
        selectedOptions={selectedUseCase === "" ? [] : [selectedUseCase]}
        onOptionSelect={(useCase) =>
          void setParams({
            ...params,
            useCase: selectedUseCase === useCase ? "" : useCase,
          })
        }
        multiSelect={false}
      />

      <MobileDropdown
        open={sortOpen}
        onOpenChange={setSortOpen}
        options={SKILL_SET_SORT_OPTIONS.map((option) => option.label)}
        selectedOptions={[getSkillSetSortLabel(selectedSort)]}
        onOptionSelect={(label) => {
          const sort = getSkillSetSortValueFromLabel(label);
          if (sort) {
            void setParams({ ...params, sort });
          }
        }}
        multiSelect={false}
      />
    </>
  );
}
