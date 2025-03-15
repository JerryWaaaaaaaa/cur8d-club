import { parseAsString, parseAsArrayOf, useQueryStates } from "nuqs";

const COLLECTABLE_FILTER_PARAMS = {
  type: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
  tags: parseAsArrayOf(parseAsString).withDefault([]).withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
};

export function hasAnyFilterApplied(
  filterParams: ReturnType<typeof useCollectableFilterParams>[0],
) {
  return filterParams.type !== "" || filterParams.tags.length > 0;
}

export const URL_KEYS = {
  type: "type",
  tags: "tags",
};

export function useCollectableFilterParams() {
  return useQueryStates(COLLECTABLE_FILTER_PARAMS, {
    urlKeys: URL_KEYS,
    shallow: false,
  });
}
