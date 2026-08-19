export const SORT_VALUES = [
  "recent",
  "earliest",
  "name-asc",
  "name-desc",
] as const;

export type SortValue = (typeof SORT_VALUES)[number];

/**
 * Both grids are read as feeds rather than directories, so designers and
 * projects alike land newest first.
 */
export const DEFAULT_SORT: SortValue = "recent";

export const CASE_STUDY_DEFAULT_SORT: SortValue = DEFAULT_SORT;

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "earliest", label: "Earliest Added" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

/**
 * Skill sets carry an order somebody chose — the sequence they were curated
 * in, which keeps each category's four sets together — so they get one option
 * the other two views have no use for, and take it as their default. Sorting
 * them by name or by date would scatter the categories for no gain, since
 * every set was imported in the same moment and none of the twenty is hard to
 * find.
 */
export const SKILL_SET_SORT_VALUES = ["curated", ...SORT_VALUES] as const;

export type SkillSetSortValue = (typeof SKILL_SET_SORT_VALUES)[number];

export const SKILL_SET_DEFAULT_SORT: SkillSetSortValue = "curated";

export const SKILL_SET_SORT_OPTIONS: {
  value: SkillSetSortValue;
  label: string;
}[] = [{ value: "curated", label: "Curated" }, ...SORT_OPTIONS];

export function getSortLabel(sort: SortValue) {
  return SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Sort";
}

export function getSkillSetSortLabel(sort: SkillSetSortValue) {
  return (
    SKILL_SET_SORT_OPTIONS.find((option) => option.value === sort)?.label ??
    "Sort"
  );
}

export function getSkillSetSortValueFromLabel(label: string) {
  return SKILL_SET_SORT_OPTIONS.find((option) => option.label === label)?.value;
}

export function getSortValueFromLabel(label: string) {
  return SORT_OPTIONS.find((option) => option.label === label)?.value;
}
