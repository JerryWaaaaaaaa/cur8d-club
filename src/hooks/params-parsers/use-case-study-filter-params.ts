import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";

const CASE_STUDY_FILTER_PARAMS = {
  types: parseAsArrayOf(parseAsString).withDefault([]).withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
  industries: parseAsArrayOf(parseAsString).withDefault([]).withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
};

export function hasAnyCaseStudyFilterApplied(
  filterParams: ReturnType<typeof useCaseStudyFilterParams>[0],
) {
  return filterParams.types.length > 0 || filterParams.industries.length > 0;
}

export const CASE_STUDY_URL_KEYS = {
  types: "types",
  industries: "industries",
};

export function useCaseStudyFilterParams() {
  return useQueryStates(CASE_STUDY_FILTER_PARAMS, {
    urlKeys: CASE_STUDY_URL_KEYS,
    shallow: false,
  });
}
