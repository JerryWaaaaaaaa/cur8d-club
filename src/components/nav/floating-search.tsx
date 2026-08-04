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

/** Wide enough that the placeholder reads in full rather than clipping. */
const BAR_WIDTH = "w-[26rem]";

function FloatingSearchShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center md:flex">
      {/* The bottom padding is what keeps the bar out of the footer blurb's
          band. Centred on the window, the bar reaches past the blurb's left
          edge on anything narrower than about 1280px, so it clears it
          vertically instead — at every width, rather than only where the
          collision happens, so the bar doesn't jump on resize. */}
      <div className="relative flex justify-center px-24 pb-24 pt-24">
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
      className={`pointer-events-auto relative ${BAR_WIDTH} shadow-lg shadow-neutral-900/10`}
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
      className={`pointer-events-auto relative ${BAR_WIDTH} shadow-lg shadow-neutral-900/10`}
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
