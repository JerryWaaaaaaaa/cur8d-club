"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useViewParams,
  type View,
} from "@/hooks/params-parsers/use-view-params";

const OPTIONS: { value: View; label: string }[] = [
  { value: "designer", label: "Designers" },
  { value: "case-study", label: "Projects" },
];

interface ViewToggleProps {
  className?: string;
  /** Stretch to the container width, splitting it evenly between the tabs.
   *  Used by the mobile filter sheet, where every control is full width. */
  fullWidth?: boolean;
}

export function ViewToggle({ className, fullWidth = false }: ViewToggleProps) {
  const [{ view }, setViewParams] = useViewParams();
  const shouldReduceMotion = useReducedMotion();
  // The desktop and mobile navs both mount a toggle, so the shared layout id
  // has to be scoped per instance or the chip would fly between them.
  const chipLayoutId = useId();

  return (
    <div
      role="tablist"
      aria-label="Browse mode"
      className={cn(
        // h-9 matches the filter pills (py-2 + text-sm) so the row lines up.
        "inline-flex h-9 flex-shrink-0 items-center gap-0.5 rounded-full bg-neutral-200/70 p-0.5",
        // h-12 matches the stacked filter pills (py-3 + text-base).
        fullWidth && "flex h-12 w-full",
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
              "relative flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-base transition-colors",
              fullWidth && "h-full flex-1 justify-center",
              isActive
                ? // Hold the label dark until the chip is most of the way here,
                  // otherwise it washes out against the light track mid-slide.
                  "text-background delay-100 duration-150"
                : // The chip clears this label early in the slide, so catch up
                  // quickly rather than fading through washed-out mid-greys.
                  "text-neutral-600 duration-150 hover:text-neutral-900",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={chipLayoutId}
                aria-hidden
                className="absolute inset-0 rounded-full bg-foreground"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
                }
              />
            )}
            {/* z-10 keeps every label above the chip: the chip lives inside the
                active tab, so without it the chip paints over the label of the
                tab it is sliding away from. */}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
