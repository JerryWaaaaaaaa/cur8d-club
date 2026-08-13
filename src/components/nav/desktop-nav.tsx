"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { HorizontalFilter } from "./horizontal-filter";
import { useViewParams } from "@/hooks/params-parsers/use-view-params";
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

  // Search and the filters share the row, so only one of them is up at a time.
  const [searchOpen, setSearchOpen] = useState(false);

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
        from the left edge, search from the right. */}
      {/* Top-aligned, not centred: when the filters wrap to a second line the
        search control should stay level with the toggle rather than drifting
        down to the middle of them. On one line the two are the same height, so
        it makes no difference there. */}
      <div className="flex items-start justify-between gap-6 pb-6">
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
            onClose={() => setSearchOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}
