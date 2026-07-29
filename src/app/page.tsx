import { api, HydrateClient } from "@/trpc/server";
import { DesktopNav } from "@/components/nav/desktop-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import CollectableGrid from "@/components/collectable-grid";
import CaseStudyGrid from "@/components/case-study-grid";

const COLLECTABLE_PER_PAGE = 12;

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

  // Only read the case study tables when that view is actually being shown.
  // Switching views is a full server round trip (the `view` param is not
  // shallow), so the real options are fetched before the filters are visible —
  // and the designer view stays up even if the case study table is absent.
  const [caseStudyTypes, caseStudyIndustries] = isCaseStudyView
    ? await Promise.all([
        api.caseStudy.getUniqueTypes(),
        api.caseStudy.getUniqueIndustries(),
      ])
    : [[], []];

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
    </>
  );

  if (isCaseStudyView) {
    const initialCaseStudies = await api.caseStudy.getInfiniteScroll({
      types: [],
      industries: [],
      limit: COLLECTABLE_PER_PAGE,
    });

    return (
      <HydrateClient>
        {nav}
        <main className="container mx-auto px-4 pb-32 pt-20 md:pb-8 md:pt-8">
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
    limit: COLLECTABLE_PER_PAGE,
  });

  return (
    <HydrateClient>
      {nav}
      <main className="container mx-auto px-4 pb-32 pt-20 md:pb-8 md:pt-8">
        <CollectableGrid
          initialData={initialInfiniteScrollData}
          pageSize={COLLECTABLE_PER_PAGE}
        />
      </main>
    </HydrateClient>
  );
}
