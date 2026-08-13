"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Highlight } from "./highlight";

// A single blurred layer would start abruptly at whatever line it was masked
// to. These stack instead: each one blurs the result of the one beneath it,
// and their bands are offset so the blur accumulates gradually — untouched at
// the panel's top edge, fully frosted by the time the text begins.
const BLUR_LAYERS = [
  { blur: 1, stops: "transparent 0%, #000 10%, #000 19%, transparent 29%" },
  { blur: 2, stops: "transparent 10%, #000 19%, #000 29%, transparent 38%" },
  { blur: 4, stops: "transparent 19%, #000 29%, #000 38%, transparent 48%" },
  { blur: 8, stops: "transparent 29%, #000 38%, #000 100%" },
] as const;

// Lines dissolve as they scroll off the top rather than meeting the sharper
// artwork head on. The paragraph's top padding matches the band, so the first
// line is never inside it.
const TEXT_MASK = "linear-gradient(to bottom, transparent 0px, #000 32px)";

// The same treatment at the bottom, as the cue that the description carries on
// past the frame. Only applied while it actually does: reserving room for this
// band in the padding instead would be dead space to scroll through on every
// card, and enough of it to push descriptions that would otherwise fit into
// scrolling at all.
const TEXT_MASK_WITH_MORE =
  "linear-gradient(to bottom, transparent 0px, #000 32px, #000 calc(100% - 40px), transparent 100%)";

// A straight ramp into a flat 70% leaves a corner where the two meet: the
// brightness is continuous across it but its rate of change is not, and the
// eye turns that into a line of its own — right on top of the first line of
// text, since the tint reaches full strength exactly where the text starts.
// Easing it brings the ramp's slope to zero before it meets the flat part, so
// there is no corner left to catch. Same endpoints, so nothing below the fade
// changes: the text still sits on a full 70%.
const TINT = buildTint();

function buildTint() {
  const FADE_START = 65; // % up the panel, where the text begins
  const STEPS = 12;
  const stops = ["rgb(255 255 255 / 0.7) 0%"];

  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const eased = t * t * (3 - 2 * t); // smoothstep: flat at both ends
    const alpha = (0.7 * (1 - eased)).toFixed(4);
    const position = (FADE_START + (100 - FADE_START) * t).toFixed(2);
    stops.push(`rgb(255 255 255 / ${alpha}) ${position}%`);
  }

  return `linear-gradient(to top, ${stops.join(", ")})`;
}

interface DescriptionPanelProps {
  text: string;
  /** The active search terms, marked wherever they appear. */
  terms: string[];
  isHovered: boolean;
  /**
   * How much of the frame the panel covers, as the classes that set its
   * vertical extent — it is anchored to the bottom, so either a `top-*` to hold
   * it clear of whatever sits at the frame's top, or an `h-*` to keep it a band
   * of its own height on a frame too tall to give a share of.
   */
  panelClassName?: string;
  /** Sizes the frame to the artwork it slides over. */
  className?: string;
  style?: CSSProperties;
}

/**
 * The description, parked below the artwork and sliding up over it on hover.
 *
 * Frosted rather than solid so the artwork stays legible behind the text, and
 * scrollable rather than clamped: the card is the only place the description is
 * shown, so anything cut here is not readable anywhere.
 *
 * The frame is the caller's business — it mirrors whatever box the artwork
 * occupies, which is a fixed square on one grid and the screenshot's own shape
 * on the other. Everything inside it is the same on both.
 */
export function DescriptionPanel({
  text,
  terms,
  isHovered,
  panelClassName = "top-0",
  className,
  style,
}: DescriptionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  // Rewound while the panel is still parked below the frame, so the next reader
  // starts at its first line without seeing the text jump.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isHovered) return;
    el.scrollTop = 0;
    setHasMoreBelow(el.clientHeight < el.scrollHeight - 1);
  }, [isHovered, text]);

  // Drives the bottom fade. Cheap enough to run on every scroll event: React
  // bails out when the answer has not changed, which is all but two frames of
  // any given scroll. The pixel of slack absorbs fractional layout, which can
  // otherwise leave a card permanently one hair short of its own end.
  const syncHasMoreBelow = () => {
    const el = scrollRef.current;
    if (!el) return;
    setHasMoreBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };

  const textMask = hasMoreBelow ? TEXT_MASK_WITH_MORE : TEXT_MASK;

  return (
    <div
      className={cn(
        "absolute left-0 top-0 z-30 w-full overflow-hidden",
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          "absolute inset-x-0 bottom-0",
          panelClassName,
          "transition-transform duration-300 ease-out",
          "motion-reduce:transition-none",
          isHovered ? "translate-y-0" : "translate-y-full",
        )}
      >
        {BLUR_LAYERS.map(({ blur, stops }) => {
          const mask = `linear-gradient(to bottom, ${stops})`;
          return (
            <div
              key={blur}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                maskImage: mask,
                WebkitMaskImage: mask,
              }}
            />
          );
        })}

        {/* Rises with the blur rather than against it: nothing at the top,
            holding at 70% from the point the text starts. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: TINT }}
        />

        {/* Sized to the frosted part of the panel, so no line is ever read
            against the sharp artwork. */}
        <div
          ref={scrollRef}
          onScroll={syncHasMoreBelow}
          className={cn(
            "scrollbar-hide absolute inset-x-0 bottom-0 flex h-[65%] flex-col",
            "overflow-y-auto overscroll-contain",
          )}
          style={{ maskImage: textMask, WebkitMaskImage: textMask }}
        >
          {/* mt-auto only has free space to absorb when the description fits,
              so a short one sits at the bottom of the box and a long one falls
              back to starting at the top, which is where a reader expects to
              begin scrolling from. */}
          <p className="mt-auto px-5 pb-5 pt-8 text-sm leading-snug text-neutral-700">
            <Highlight text={text} terms={terms} />
          </p>
        </div>
      </div>
    </div>
  );
}
