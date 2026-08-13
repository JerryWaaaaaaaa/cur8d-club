"use client";

import { useEffect, useRef } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const SEARCH_PLACEHOLDER = "Search name, expertise, keywords";

interface SearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Take the caret on mount — the desktop field only exists once opened. */
  autoFocus?: boolean;
  /**
   * Turns the trailing button from a clear into an exit. The desktop header
   * opens this field in place of its filter row, so the one button that closes
   * it has to be offered whether or not anything has been typed; without this
   * the button stays the clear it has always been.
   */
  onClose?: () => void;
}

/**
 * Presentational only — the debounce and the URL write live at the call site,
 * because the designer and case study views keep their query in different
 * params. Shaped like the filter pills next to it; `className` is how the
 * mobile sheet stretches it to a full-width row.
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder = SEARCH_PLACEHOLDER,
  className,
  autoFocus = false,
  onClose,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focused from an effect rather than the autoFocus attribute, which browsers
  // only honour on the first paint of the document — this field mounts later,
  // when the header swaps its filters out for it.
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const dismiss = onClose ?? (() => onValueChange(""));

  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-full bg-neutral-200 px-4 text-neutral-900 transition-colors focus-within:bg-neutral-300 hover:bg-neutral-300",
        className,
      )}
    >
      <MagnifyingGlass weight="bold" className="h-5 w-5 flex-shrink-0" />

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") dismiss();
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full min-w-0 bg-transparent text-base font-normal placeholder:text-neutral-500 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />

      {(onClose !== undefined || value !== "") && (
        <button
          type="button"
          onClick={dismiss}
          aria-label={onClose ? "Close search" : "Clear search"}
          className="flex flex-shrink-0 items-center justify-center focus:outline-none"
        >
          <X weight="bold" className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
