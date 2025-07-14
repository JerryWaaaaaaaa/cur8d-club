import { api, HydrateClient } from "@/trpc/server";
import { Header } from "@/components/header";
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
      <Header tagOptions={allTags} typeOptions={allTypes} />

      <main className="container mx-auto px-4 pb-8 pt-8">
        <CollectableGrid
          initialData={initialInfiniteScrollData}
          pageSize={COLLECTABLE_PER_PAGE}
        />
      </main>
    </HydrateClient>
  );
}
