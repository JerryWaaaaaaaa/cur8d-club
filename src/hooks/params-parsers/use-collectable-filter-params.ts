import {
  parseAsString,
  parseAsArrayOf,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { DEFAULT_SORT, SORT_VALUES } from "@/lib/sort-options";

const COLLECTABLE_FILTER_PARAMS = {
  type: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
  tags: parseAsArrayOf(parseAsString).withDefault([]).withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
  // Written by the search box, which passes `shallow: true` on the setter so
  // typing doesn't re-run the server render for every keystroke.
  q: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
  sort: parseAsStringLiteral(SORT_VALUES)
    .withDefault(DEFAULT_SORT)
    .withOptions({
      clearOnDefault: true,
      shallow: false,
    }),
};

export function hasAnyFilterApplied(
  filterParams: ReturnType<typeof useCollectableFilterParams>[0],
) {
  return (
    filterParams.type !== "" ||
    filterParams.tags.length > 0 ||
    filterParams.q !== "" ||
    filterParams.sort !== DEFAULT_SORT
  );
}

export const URL_KEYS = {
  type: "type",
  tags: "tags",
  q: "q",
  sort: "sort",
};

export function useCollectableFilterParams() {
  return useQueryStates(COLLECTABLE_FILTER_PARAMS, {
    urlKeys: URL_KEYS,
    shallow: false,
  });
}
