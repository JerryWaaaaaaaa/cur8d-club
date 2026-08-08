import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { CASE_STUDY_DEFAULT_SORT, SORT_VALUES } from "@/lib/sort-options";

const CASE_STUDY_FILTER_PARAMS = {
  types: parseAsArrayOf(parseAsString).withDefault([]).withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
  industries: parseAsArrayOf(parseAsString).withDefault([]).withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
  sort: parseAsStringLiteral(SORT_VALUES)
    .withDefault(CASE_STUDY_DEFAULT_SORT)
    .withOptions({
      clearOnDefault: true,
      shallow: false,
    }),
};

export function hasAnyCaseStudyFilterApplied(
  filterParams: ReturnType<typeof useCaseStudyFilterParams>[0],
) {
  return (
    filterParams.types.length > 0 ||
    filterParams.industries.length > 0 ||
    filterParams.sort !== CASE_STUDY_DEFAULT_SORT
  );
}

export const CASE_STUDY_URL_KEYS = {
  types: "types",
  industries: "industries",
  sort: "sort",
};

export function useCaseStudyFilterParams() {
  return useQueryStates(CASE_STUDY_FILTER_PARAMS, {
    urlKeys: CASE_STUDY_URL_KEYS,
    shallow: false,
  });
}
