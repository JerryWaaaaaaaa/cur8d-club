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

/**
 * The wash rises off the top of the bar and is gone by its bottom edge, so
 * nothing is tinted below it.
 *
 * The stops have to reach zero just inside the box rather than at it: the box
 * now ends level with the bar, and any alpha left at that line would show as a
 * hard horizontal edge running out either side of the bar, which is worse than
 * the tint being removed.
 */
const HALO =
  "radial-gradient(58% 45% at 50% 55%, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.9) 38%, rgba(255,255,255,0) 100%)";

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
    // The bottom offset lives out here rather than on the box below, so that
    // box — and the wash filling it — stops level with the bar instead of
    // carrying on beneath it. It matches the footer links' own offset, so the
    // bar and the links share a line and end on the same edge. Centred on the
    // window, the bar still reaches the links below about 1024px even with
    // them trimmed to the two calls to action, so under `lg` it steps up out
    // of their way instead — narrowing it to fit would clip the placeholder,
    // which is the thing the width is there to prevent.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center pb-16 md:flex lg:pb-5">
      <div className="relative flex justify-center px-24 pt-24">
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
