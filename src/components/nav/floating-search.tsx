"use client";

import { SearchInput } from "./search-input";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useCollectableFilterParams } from "@/hooks/params-parsers/use-collectable-filter-params";
import { useCaseStudyFilterParams } from "@/hooks/params-parsers/use-case-study-filter-params";
import { useViewParams } from "@/hooks/params-parsers/use-view-params";

/**
 * The search box, floating over the bottom of the grid.
 *
 * It sits apart from the filter row on purpose: search is the one control you
 * reach for while reading the cards, so it stays within thumb's reach of where
 * you are rather than back up at the top of the page. Cards scroll underneath,
 * and the radial wash behind it fades them out just enough to keep the bar
 * legible without reading as a solid bar pinned across the window.
 *
 * Desktop only — the mobile sheet already holds every control at the bottom of
 * the screen, and a second floating bar would land on top of it.
 */
const HALO =
  "radial-gradient(60% 78% at 50% 78%, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 45%, rgba(255,255,255,0) 72%)";

/**
 * Wide enough that the placeholder reads in full rather than clipping.
 *
 * A step lighter than the filter chips it echoes: those sit on the header's
 * flat white, while this one sits on the wash with a shadow under it, and the
 * chips' own neutral-200 reads heavy against that.
 */
const BAR =
  "w-[26rem] bg-neutral-100 hover:bg-neutral-200 focus-within:bg-neutral-200 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)]";

function FloatingSearchShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center md:flex">
      {/* Bottom padding matches the footer links' own offset, so the bar and
          the links share a line and end on the same edge. Centred on the
          window, the bar still reaches the links below about 1024px even with
          them trimmed to the two calls to action, so under `lg` it steps up
          out of their way instead — narrowing it to fit would clip the
          placeholder, which is the thing the width is there to prevent. */}
      <div className="relative flex justify-center px-24 pb-16 pt-24 lg:pb-5">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: HALO }}
        />
        {children}
      </div>
    </div>
  );
}

function DesignerSearch() {
  const [params, setParams] = useCollectableFilterParams();

  // Shallow, so the query re-runs the grid's client query without a server
  // round trip for every keystroke.
  const [searchDraft, setSearchDraft] = useDebouncedSearch(
    params.q,
    (q) => void setParams({ q }, { shallow: true }),
  );

  return (
    <SearchInput
      value={searchDraft}
      onValueChange={setSearchDraft}
      className={`pointer-events-auto relative ${BAR}`}
    />
  );
}

function ProjectSearch() {
  const [params, setParams] = useCaseStudyFilterParams();

  const [searchDraft, setSearchDraft] = useDebouncedSearch(
    params.q,
    (q) => void setParams({ q }, { shallow: true }),
  );

  return (
    <SearchInput
      value={searchDraft}
      onValueChange={setSearchDraft}
      placeholder="Search name, industry, keywords"
      className={`pointer-events-auto relative ${BAR}`}
    />
  );
}

export function FloatingSearch() {
  const [{ view }] = useViewParams();

  return (
    <FloatingSearchShell>
      {view === "case-study" ? <ProjectSearch /> : <DesignerSearch />}
    </FloatingSearchShell>
  );
}
