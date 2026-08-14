"use client";

import { useState } from "react";

import { inkForBackground, randomAccentColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

/**
 * Props to spread onto a piece of link text so hovering it lights up in one of
 * the wordmark's colours.
 *
 * Both `<a>` and `<button>` wear this — the footer's two lines are one of each —
 * so it is a hook returning props rather than a component.
 */
export function useAccentHover(className?: string) {
  // A fresh colour per hover, so the same link is a different colour each time
  // rather than wearing one assigned at mount. Picking in the handler also
  // keeps the randomness out of render, where the server and the client would
  // have disagreed about the answer.
  const [accent, setAccent] = useState<string | null>(null);

  const raise = () => setAccent(randomAccentColor());
  const clear = () => setAccent(null);

  return {
    className: cn(
      "underline transition-colors hover:no-underline",
      // Padding the highlight without moving the text, and painting it on both
      // halves of a link that wraps rather than only the first.
      "box-decoration-clone px-0.5 -mx-0.5",
      className,
    ),
    style: accent
      ? { backgroundColor: accent, color: inkForBackground(accent) }
      : undefined,
    onMouseEnter: raise,
    onMouseLeave: clear,
    // Keyboard users get the same highlight, and the same fresh colour.
    onFocus: raise,
    onBlur: clear,
  };
}
