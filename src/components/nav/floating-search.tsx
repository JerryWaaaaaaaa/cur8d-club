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
 * you are rather than back up at the top of the page. Cards scroll underneath
 * it untouched — nothing is painted behind the bar, so its own fill and the
 * shadow under it are what hold it apart from whatever it passes over.
 *
 * Desktop only — the mobile sheet already holds every control at the bottom of
 * the screen, and a second floating bar would land on top of it.
 */

/**
 * Wide enough that the placeholder reads in full rather than clipping.
 *
 * A step lighter than the filter chips it echoes: those sit on the header's
 * flat white, while this one sits over the grid with a shadow under it, and
 * the chips' own neutral-200 reads heavy there.
 */
const BAR =
  "w-[26rem] bg-neutral-100 hover:bg-neutral-200 focus-within:bg-neutral-200 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)]";

function FloatingSearchShell({ children }: { children: React.ReactNode }) {
  return (
    // The bottom offset matches the footer links' own, so the bar and the
    // links share a line and end on the same edge. Centred on the window, the
    // bar still reaches the links below about 1024px even with them trimmed to
    // the two calls to action, so under `lg` it steps up out of their way
    // instead — narrowing it to fit would clip the placeholder, which is the
    // thing the width is there to prevent.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center pb-16 md:flex lg:pb-5">
      {children}
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
      className={`pointer-events-auto ${BAR}`}
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
      className={`pointer-events-auto ${BAR}`}
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
