"use client";

import { HorizontalFilter } from "./horizontal-filter";
import { Logo } from "./logo";
import { useViewParams } from "@/hooks/params-parsers/use-view-params";
import { ViewToggle } from "./view-toggle";
import { CaseStudyFilter } from "./case-study-filter";

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
      {/* Same container as the grid below, so the first control lines up with
          the first card and the logo with the last one. */}
      <div className="container mx-auto px-4 pb-6 md:px-6">
        <div className="flex items-center justify-between gap-6">
          {/* Every control lives in one left-aligned row. The blurb that used
              to sit on the right is now the fixed footer, which is what frees
              up the width for however many controls a view needs. */}
          <div className="flex flex-wrap items-center gap-2.5">
            <ViewToggle />
            {filters}
          </div>

          <Logo align="right" className="h-12 w-[145px] flex-shrink-0" />
        </div>
      </div>
    </header>
  );
}
