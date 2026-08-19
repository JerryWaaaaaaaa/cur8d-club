import {
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  SKILL_SET_DEFAULT_SORT,
  SKILL_SET_SORT_VALUES,
} from "@/lib/sort-options";

const SKILL_SET_FILTER_PARAMS = {
  // Scalar, unlike the type filters on the other two views: a set has exactly
  // one category, so picking two would be picking none.
  useCase: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
  sort: parseAsStringLiteral(SKILL_SET_SORT_VALUES)
    .withDefault(SKILL_SET_DEFAULT_SORT)
    .withOptions({
      clearOnDefault: true,
      shallow: false,
    }),
  // Written by the search box, which passes `shallow: true` on the setter so
  // typing doesn't re-run the server render for every keystroke.
  q: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
};

export function hasAnySkillSetFilterApplied(
  filterParams: ReturnType<typeof useSkillSetFilterParams>[0],
) {
  return (
    filterParams.useCase !== "" ||
    filterParams.sort !== SKILL_SET_DEFAULT_SORT ||
    filterParams.q !== ""
  );
}

export const SKILL_SET_URL_KEYS = {
  useCase: "type",
  sort: "sort",
  q: "q",
};

export function useSkillSetFilterParams() {
  return useQueryStates(SKILL_SET_FILTER_PARAMS, {
    urlKeys: SKILL_SET_URL_KEYS,
    shallow: false,
  });
}

/**
 * Which set is open, kept apart from the filters above because it is
 * navigation rather than narrowing: resetting the filters should not throw you
 * out of the set you are reading, and opening one should not read as a filter
 * being applied.
 */
const SKILL_SET_SELECTION_PARAMS = {
  set: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    shallow: false,
  }),
};

export function useSkillSetSelection() {
  return useQueryStates(SKILL_SET_SELECTION_PARAMS, { shallow: false });
}
