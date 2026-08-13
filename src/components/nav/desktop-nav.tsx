"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { HorizontalFilter } from "./horizontal-filter";
import { useViewParams } from "@/hooks/params-parsers/use-view-params";
import { useCollectableFilterParams } from "@/hooks/params-parsers/use-collectable-filter-params";
import { useCaseStudyFilterParams } from "@/hooks/params-parsers/use-case-study-filter-params";
import { ViewToggle } from "./view-toggle";
import { CaseStudyFilter } from "./case-study-filter";
import { HeaderSearch } from "./header-search";

interface DesktopNavProps {
  typeOptions: string[];
  tagOptions: string[];
  caseStudyTypeOptions: string[];
  caseStudyIndustryOptions: string[];
}

export function DesktopNav({
  typeOptions,
  tagOptions,
  caseStudyTypeOptions,
  caseStudyIndustryOptions,
}: DesktopNavProps) {
  const [{ view }] = useViewParams();
  const [, setCollectableParams] = useCollectableFilterParams();
  const [, setCaseStudyParams] = useCaseStudyFilterParams();

  // Search and the filters share the row, so only one of them is up at a time.
  const [searchOpen, setSearchOpen] = useState(false);

  const controlsRef = useRef<HTMLDivElement>(null);

  /**
   * Every way out of search mode comes through here — the button on the field,
   * Escape, and a click on the page behind it.
   *
   * The query is cleared from the param rather than the field's own draft: that
   * draft's write is debounced, and the field unmounts the moment the filters
   * come back, which cancels anything still pending. Left behind, the query
   * would keep narrowing the grid from a box that is no longer on screen.
   */
  const closeSearch = useCallback(() => {
    setSearchOpen(false);

    if (view === "case-study") {
      void setCaseStudyParams({ q: null }, { shallow: true });
    } else {
      void setCollectableParams({ q: null }, { shallow: true });
    }
  }, [view, setCaseStudyParams, setCollectableParams]);

  // Held in a ref so the listener below is bound once per open rather than
  // torn down and rebound on every keystroke's re-render.
  const closeSearchRef = useRef(closeSearch);
  useEffect(() => {
    closeSearchRef.current = closeSearch;
  });

  // Anywhere outside the control row dismisses search — the grid, the rail, the
  // page behind them. The row itself is the exception rather than the field
  // alone, because the view toggle stays up in search mode and is there to be
  // used: switching to the other set mid-search shouldn't throw the search away.
  //
  // Bound on pointerdown, and only while open, so the click that opens the
  // field has already been and gone before this is listening for one.
  useEffect(() => {
    if (!searchOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!controlsRef.current?.contains(event.target as Node)) {
        closeSearchRef.current();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [searchOpen]);

  const filters =
    view === "case-study" ? (
      <CaseStudyFilter
        typeOptions={caseStudyTypeOptions}
        industryOptions={caseStudyIndustryOptions}
      />
    ) : (
      <HorizontalFilter tagOptions={tagOptions} typeOptions={typeOptions} />
    );

  return (
    <header
      className="sticky top-0 z-40 hidden pb-6 pt-6 md:block"
      style={{
        backdropFilter: "blur(20px) brightness(1.1)",
        WebkitBackdropFilter: "blur(20px) brightness(1.1)",
        maskImage:
          "linear-gradient(black 72%, rgba(0, 0, 0, 0.8) 85%, rgba(0, 0, 0, 0.6) 90%, rgba(0, 0, 0, 0.3) 95%, transparent)",
        WebkitMaskImage:
          "linear-gradient(black 72%, rgba(0, 0, 0, 0.8) 85%, rgba(0, 0, 0, 0.6) 90%, rgba(0, 0, 0, 0.3) 95%, transparent)",
        background: "linear-gradient(white 72%, transparent)",
      }}
    >
      {/* The wordmark and the footnote have the rail to the left of this
        column, which is what leaves the whole row to the controls: filters
        from the left edge, search from the right.

        Top-aligned, not centred: when the filters wrap to a second line the
        search control should stay level with the toggle rather than drifting
        down to the middle of them. On one line the two are the same height, so
        it makes no difference there. */}
      <div
        ref={controlsRef}
        className="flex items-start justify-between gap-6 pb-6"
      >
        {/* Wraps rather than running off the edge: a tablet has room for the
          toggle and two of the pills on one line, not the whole set plus the
          search pill sitting opposite them. */}
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          {/* The one control search mode keeps: switching between designers
            and projects searches the other set, so it stays reachable. */}
          <ViewToggle />
          {!searchOpen && filters}
        </div>

        {/* Closed, the trigger is a pill and sits on the right edge. Open, the
          field takes the width the filters have just given up — capped, so on
          a wide screen it stops well short of the toggle rather than stretching
          into a bar the length of the row. */}
        <div
          className={cn(
            "flex justify-end",
            searchOpen ? "min-w-0 flex-1 lg:max-w-xl" : "flex-shrink-0",
          )}
        >
          <HeaderSearch
            open={searchOpen}
            onOpen={() => setSearchOpen(true)}
            onClose={closeSearch}
          />
        </div>
      </div>
    </header>
  );
}
