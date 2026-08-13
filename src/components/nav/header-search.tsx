"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";

import { SearchInput } from "./search-input";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useCollectableFilterParams } from "@/hooks/params-parsers/use-collectable-filter-params";
import { useCaseStudyFilterParams } from "@/hooks/params-parsers/use-case-study-filter-params";
import { useViewParams } from "@/hooks/params-parsers/use-view-params";

/**
 * The search control at the right-hand end of the desktop header row.
 *
 * It used to float over the bottom of the grid at a fixed width. Up here it
 * shares the row with the filters, and the row is only so wide — so it sits
 * collapsed to a pill until it is asked for, then takes the width the filters
 * were using. That trade is the point: searching and filtering are the two
 * ways to narrow the grid, and you are doing one or the other.
 *
 * Desktop only — the mobile sheet keeps its own search field among the rest of
 * its stacked controls.
 */

interface HeaderSearchProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/** Closed: the same pill as the filters beside it, holding icon and label. */
function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-9 items-center gap-2 rounded-full bg-neutral-200 px-4 text-base font-normal text-neutral-900 transition-colors hover:bg-neutral-300 focus:outline-none"
    >
      <MagnifyingGlass weight="bold" className="h-5 w-5 flex-shrink-0" />
      Search
    </button>
  );
}

/**
 * The two views keep their query in different params, so each gets its own
 * field. Both hand `onClose` straight through: clearing the query on the way
 * out belongs to the header, which has three ways in — this button, Escape,
 * and a click on the page behind the row.
 */
function DesignerSearchField({ onClose }: { onClose: () => void }) {
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
      autoFocus
      onClose={onClose}
      className="w-full"
    />
  );
}

function ProjectSearchField({ onClose }: { onClose: () => void }) {
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
      autoFocus
      onClose={onClose}
      className="w-full"
    />
  );
}

export function HeaderSearch({ open, onOpen, onClose }: HeaderSearchProps) {
  const [{ view }] = useViewParams();

  if (!open) return <SearchTrigger onOpen={onOpen} />;

  return view === "case-study" ? (
    <ProjectSearchField onClose={onClose} />
  ) : (
    <DesignerSearchField onClose={onClose} />
  );
}
