"use client";

import { cn } from "@/lib/utils";
import {
  useViewParams,
  type View,
} from "@/hooks/params-parsers/use-view-params";

const OPTIONS: { value: View; label: string }[] = [
  { value: "designer", label: "Designers" },
  { value: "case-study", label: "Case Studies" },
];

export function ViewToggle({ className }: { className?: string }) {
  const [{ view }, setViewParams] = useViewParams();

  return (
    <div
      role="tablist"
      aria-label="Browse mode"
      className={cn(
        // h-9 matches the filter pills (py-2 + text-sm) so the row lines up.
        "inline-flex h-9 flex-shrink-0 items-center gap-0.5 rounded-full bg-neutral-200/70 p-0.5",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const isActive = view === option.value;

        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => setViewParams({ view: option.value })}
            className={cn(
              "flex h-8 items-center whitespace-nowrap rounded-full px-3 text-sm transition-colors duration-200",
              isActive
                ? "bg-foreground text-background"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
