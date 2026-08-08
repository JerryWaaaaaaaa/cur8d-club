export const SORT_VALUES = [
  "recent",
  "earliest",
  "name-asc",
  "name-desc",
] as const;

export type SortValue = (typeof SORT_VALUES)[number];

export const DEFAULT_SORT: SortValue = "name-asc";

/**
 * Projects have always landed newest first, and the grid is read as a feed
 * rather than a directory, so they keep that default instead of the
 * alphabetical one the designer list uses.
 */
export const CASE_STUDY_DEFAULT_SORT: SortValue = "recent";

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "earliest", label: "Earliest Added" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];

export function getSortLabel(sort: SortValue) {
  return SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Sort";
}

export function getSortValueFromLabel(label: string) {
  return SORT_OPTIONS.find((option) => option.label === label)?.value;
}
