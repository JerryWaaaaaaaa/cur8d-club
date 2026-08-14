"use client";

import { ArrowCounterClockwise, CaretDown } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  SKILL_SET_DEFAULT_SORT,
  SKILL_SET_SORT_OPTIONS,
  getSkillSetSortLabel,
} from "@/lib/sort-options";
import {
  hasAnySkillSetFilterApplied,
  useSkillSetFilterParams,
  useSkillSetSelection,
} from "@/hooks/params-parsers/use-skill-set-filter-params";

interface SkillSetFilterProps {
  useCaseOptions: string[];
}

export function SkillSetFilter({ useCaseOptions }: SkillSetFilterProps) {
  const [params, setParams] = useSkillSetFilterParams();
  const [{ set }] = useSkillSetSelection();
  const { useCase: selectedUseCase, sort: selectedSort } = params;

  const [useCaseOpen, setUseCaseOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const hasAnySelection = useMemo(
    () => hasAnySkillSetFilterApplied(params),
    [params],
  );

  const triggerClasses = (isOpen: boolean) =>
    cn(
      "flex h-9 items-center gap-2 rounded-full px-4 text-base font-normal transition-colors focus:outline-none",
      isOpen
        ? "bg-black text-white"
        : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
    );

  // Inside a set there is one set to look at, so narrowing the list behind it
  // would only change what you return to. The search box stays, since it is
  // the way back out to everything.
  if (set !== "") return null;

  return (
    <div className="flex items-center gap-2.5">
      {useCaseOptions.length > 0 && (
        <DropdownMenu.Root open={useCaseOpen} onOpenChange={setUseCaseOpen}>
          <DropdownMenu.Trigger asChild>
            <button className={triggerClasses(useCaseOpen)}>
              <span className="max-w-[240px] truncate">
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
          </DropdownMenu.Trigger>
          <DropdownMenu.Content open={useCaseOpen}>
            {useCaseOptions.map((useCase) => (
              <DropdownMenu.Item
                key={useCase}
                onSelect={() =>
                  void setParams({
                    ...params,
                    // Picking the selected one again clears it, which is the
                    // only way back to "All Types" without the reset button.
                    useCase: selectedUseCase === useCase ? "" : useCase,
                  })
                }
                selected={selectedUseCase === useCase}
              >
                {useCase}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )}

      <DropdownMenu.Root open={sortOpen} onOpenChange={setSortOpen}>
        <DropdownMenu.Trigger asChild>
          <button className={triggerClasses(sortOpen)}>
            {getSkillSetSortLabel(selectedSort)}
            <motion.div
              animate={{ rotate: sortOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <CaretDown weight="fill" className="h-5 w-5" />
            </motion.div>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content open={sortOpen}>
          {SKILL_SET_SORT_OPTIONS.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              onSelect={() => void setParams({ ...params, sort: option.value })}
              selected={selectedSort === option.value}
            >
              {option.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

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
