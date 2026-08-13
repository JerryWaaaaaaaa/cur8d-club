import { api, HydrateClient } from "@/trpc/server";
import { DesktopNav } from "@/components/nav/desktop-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { Logo } from "@/components/nav/logo";
import CollectableGrid from "@/components/collectable-grid";
import CaseStudyGrid from "@/components/case-study-grid";
import { SiteFooter } from "@/components/site-footer";
import { CASE_STUDY_DEFAULT_SORT, DEFAULT_SORT } from "@/lib/sort-options";

const COLLECTABLE_PER_PAGE = 12;

async function readCaseStudyOptions(read: () => Promise<string[]>) {
  try {
    return await read();
  } catch (error) {
    console.error("Case study filter options unavailable:", error);
    return [];
  }
}

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { view } = await searchParams;
  const isCaseStudyView = view === "case-study";

  const [allTags, allTypes] = await Promise.all([
    api.collectable.getUniqueTags(),
    api.collectable.getUniqueTypes(),
  ]);

  // Both views' filter options ship on every render, whichever view is being
  // shown. Switching views is a server round trip, but the toggle does not wait
  // for it: the `view` param updates on the client the moment it is clicked, so
  // the nav swaps in the other view's filters straight away and only their
  // options would still be coming. Gating the read on `isCaseStudyView` meant
  // those options were, by definition, never in the payload that was on screen
  // when the switch happened — so the project filters rendered empty until the
  // round trip landed. Sending both makes the swap immediate.
  //
  // The reads are cached under FILTER_OPTIONS_TAG and only recomputed when a
  // sync drops it, so carrying the other view's options costs a cache hit.
  const [caseStudyTypes, caseStudyIndustries] = await Promise.all([
    // Kept non-fatal so the designer view still stands up if the case study
    // table is absent — the filters come back empty rather than the page 500ing.
    readCaseStudyOptions(() => api.caseStudy.getUniqueTypes()),
    readCaseStudyOptions(() => api.caseStudy.getUniqueIndustries()),
  ]);

  // One container for the whole page, split into a rail and a column: the rail
  // holds the two pieces of furniture that are neither control nor card — the
  // wordmark and the footnote — which is what leaves the header row's full
  // width to the filters and search. It's sticky and screen-tall, so the
  // footnote sits at the bottom of the window and the grid scrolls past both
  // rather than under them, the way it did when they were pinned corners.
  //
  // Mobile keeps its fixed top bar and filter sheet, so the rail is md and up.
  //
  // Deliberately not Tailwind's `container`, which snaps its max-width to a
  // fixed value per breakpoint — 640, 768, 1024, 1280, 1536 — and so leaves
  // every width in between on the floor: at a 1000px window the page was
  // locked to 768 and a quarter of the screen sat empty. A plain max-width
  // lets the whole shell track the window, so the cards resize as it is
  // dragged, and settles at 1600 (gutters included) rather than growing
  // without end on a very wide screen.
  const shell = (grid: React.ReactNode) => (
    <>
      <div className="mx-auto w-full max-w-[1600px] px-4 md:flex md:gap-6 md:px-6">
        {/* Wide enough to hold the wordmark and the footnote with air around
          them rather than to their exact width. It's held back at md, where
          every pixel it takes comes off a card. */}
        <aside className="sticky top-0 hidden h-screen w-44 flex-shrink-0 flex-col justify-between py-6 md:flex lg:w-52">
          <Logo align="left" className="h-12 w-[145px]" />
          <SiteFooter />
        </aside>

        {/* min-w-0 so the grid's cards set this column's width from the space
          that's left, rather than their content forcing it wider. */}
        <div className="min-w-0 flex-1">
          <DesktopNav
            tagOptions={allTags}
            typeOptions={allTypes}
            caseStudyTypeOptions={caseStudyTypes}
            caseStudyIndustryOptions={caseStudyIndustries}
          />

          <main className="pb-72 pt-20 md:pb-28 md:pt-8">{grid}</main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <MobileNav
          tagOptions={allTags}
          typeOptions={allTypes}
          caseStudyTypeOptions={caseStudyTypes}
          caseStudyIndustryOptions={caseStudyIndustries}
        />
      </div>
    </>
  );

  if (isCaseStudyView) {
    const initialCaseStudies = await api.caseStudy.getInfiniteScroll({
      types: [],
      industries: [],
      sort: CASE_STUDY_DEFAULT_SORT,
      limit: COLLECTABLE_PER_PAGE,
    });

    return (
      <HydrateClient>
        {shell(
          <CaseStudyGrid
            initialData={initialCaseStudies}
            pageSize={COLLECTABLE_PER_PAGE}
          />,
        )}
      </HydrateClient>
    );
  }

  const initialInfiniteScrollData = await api.collectable.getInfiniteScroll({
    type: undefined,
    tags: [],
    sort: DEFAULT_SORT,
    limit: COLLECTABLE_PER_PAGE,
  });

  return (
    <HydrateClient>
      {shell(
        <CollectableGrid
          initialData={initialInfiniteScrollData}
          pageSize={COLLECTABLE_PER_PAGE}
        />,
      )}
    </HydrateClient>
  );
}
