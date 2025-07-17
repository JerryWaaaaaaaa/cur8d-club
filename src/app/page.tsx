import { api, HydrateClient } from "@/trpc/server";
import { DesktopNav } from "@/components/nav/desktop-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import CollectableGrid from "@/components/collectable-grid";

const COLLECTABLE_PER_PAGE = 12;

export default async function Home() {
  const allTags = await api.collectable.getUniqueTags();
  const allTypes = await api.collectable.getUniqueTypes();

  const initialInfiniteScrollData = await api.collectable.getInfiniteScroll({
    type: undefined,
    tags: [],
    limit: COLLECTABLE_PER_PAGE,
  });

  return (
    <HydrateClient>
      {/* Desktop Navigation */}
      <DesktopNav tagOptions={allTags} typeOptions={allTypes} />

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <MobileNav tagOptions={allTags} typeOptions={allTypes} />
      </div>

      <main className="container mx-auto px-4 pt-20 pb-32 md:pt-8 md:pb-8">
        <CollectableGrid
          initialData={initialInfiniteScrollData}
          pageSize={COLLECTABLE_PER_PAGE}
        />
      </main>
    </HydrateClient>
  );
}
