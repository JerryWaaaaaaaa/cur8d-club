"use client";

import { useEffect, useRef, useState } from "react";
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

/** Where the chip has to sit to cover the active tab, in track coordinates. */
interface ChipBox {
  x: number;
  width: number;
  top: number;
  height: number;
}

export function ViewToggle({ className, fullWidth = false }: ViewToggleProps) {
  const [{ view }, setViewParams] = useViewParams();
  const shouldReduceMotion = useReducedMotion();

  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<View, HTMLButtonElement>());
  const [chip, setChip] = useState<ChipBox | null>(null);

  // Built once: a ref callback that changed identity between renders would have
  // React detach and reattach every tab, emptying the map on each pass.
  const tabRefCallbacks = useRef(
    new Map(
      OPTIONS.map(({ value }) => [
        value,
        (element: HTMLButtonElement | null) => {
          if (element) tabRefs.current.set(value, element);
          else tabRefs.current.delete(value);
        },
      ]),
    ),
  ).current;

  // The chip is placed from the active tab's own box rather than animated
  // between two mounted elements. A shared layout animation (`layoutId`) would
  // interpolate the measured document-space boxes instead, and this toggle
  // sits in a sticky header on desktop and a fixed sheet on mobile: switching
  // the view is a server round trip that swaps the whole grid, so the document
  // scrolls between the two measurements and the chip is dragged along an axis
  // it never actually moved on. Measuring against the track sidesteps that —
  // the chip can only ever travel horizontally, because that is the only axis
  // the two tabs differ on.
  useEffect(() => {
    const track = trackRef.current;
    const activeTab = tabRefs.current.get(view);
    if (!track || !activeTab) return;

    // Measured off the rects rather than offsetLeft/offsetWidth, which round to
    // whole pixels: the mobile sheet splits the track evenly between the tabs,
    // so their edges land on fractions and a rounded chip sits half a pixel
    // proud of the tab it is covering. clientLeft/clientTop are the track's
    // border, taking the origin from its border edge to its padding edge —
    // where the absolutely positioned chip resolves left/top from.
    const measure = () => {
      const trackBox = track.getBoundingClientRect();
      const tabBox = activeTab.getBoundingClientRect();

      setChip({
        x: tabBox.left - trackBox.left - track.clientLeft,
        width: tabBox.width,
        top: tabBox.top - trackBox.top - track.clientTop,
        height: tabBox.height,
      });
    };

    measure();

    // Labels reflow when the font finishes loading and the tabs are split
    // evenly in the mobile sheet, so both the track and the tabs are watched.
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    for (const tab of tabRefs.current.values()) observer.observe(tab);
    return () => observer.disconnect();
  }, [view, fullWidth]);

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label="Browse mode"
      className={cn(
        // h-9 matches the filter pills (py-2 + text-sm) so the row lines up.
        "relative inline-flex h-9 flex-shrink-0 items-center gap-0.5 rounded-full bg-neutral-200/70 p-0.5",
        // h-12 matches the stacked filter pills (py-3 + text-base).
        fullWidth && "flex h-12 w-full",
        className,
      )}
    >
      {chip && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 rounded-full bg-foreground"
          // The first frame after measuring has to land on the active tab, not
          // slide in from the left edge of the track.
          initial={false}
          animate={{ x: chip.x, width: chip.width }}
          style={{ top: chip.top, height: chip.height }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
          }
        />
      )}

      {OPTIONS.map((option) => {
        const isActive = view === option.value;

        return (
          <button
            key={option.value}
            ref={tabRefCallbacks.get(option.value)}
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
            {/* Until the tabs have been measured — the server render, and the
                first client paint — the active tab draws the chip itself, so
                the toggle is never served without its indicator. The handover
                is pixel-identical: both cover exactly this button's box. */}
            {isActive && !chip && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-foreground"
              />
            )}
            {/* z-10 keeps every label above the chip, which is painted by the
                track behind the whole row of tabs. */}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
