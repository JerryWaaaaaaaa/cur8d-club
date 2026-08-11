"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const SEARCH_PLACEHOLDER = "Search name, expertise, keywords";

interface SearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
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
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-full bg-neutral-200 px-4 text-neutral-900 transition-colors focus-within:bg-neutral-300 hover:bg-neutral-300",
        className,
      )}
    >
      <MagnifyingGlass weight="bold" className="h-5 w-5 flex-shrink-0" />

      <input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onValueChange("");
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full min-w-0 bg-transparent text-base font-normal placeholder:text-neutral-500 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />

      {value !== "" && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Clear search"
          className="flex flex-shrink-0 items-center justify-center focus:outline-none"
        >
          <X weight="bold" className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
