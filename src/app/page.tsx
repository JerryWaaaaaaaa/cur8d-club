import { api, HydrateClient } from "@/trpc/server";
import { DesktopNav } from "@/components/nav/desktop-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
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

  const nav = (
    <>
      {/* Desktop Navigation */}
      <DesktopNav
        tagOptions={allTags}
        typeOptions={allTypes}
        caseStudyTypeOptions={caseStudyTypes}
        caseStudyIndustryOptions={caseStudyIndustries}
      />

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <MobileNav
          tagOptions={allTags}
          typeOptions={allTypes}
          caseStudyTypeOptions={caseStudyTypes}
          caseStudyIndustryOptions={caseStudyIndustries}
        />
      </div>

      <SiteFooter />
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
        {nav}
        <main className="container mx-auto px-4 pb-72 pt-20 md:px-6 md:pb-28 md:pt-8">
          <CaseStudyGrid
            initialData={initialCaseStudies}
            pageSize={COLLECTABLE_PER_PAGE}
          />
        </main>
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
      {nav}
      <main className="container mx-auto px-4 pb-72 pt-20 md:px-6 md:pb-28 md:pt-8">
        <CollectableGrid
          initialData={initialInfiniteScrollData}
          pageSize={COLLECTABLE_PER_PAGE}
        />
      </main>
    </HydrateClient>
  );
}
