import { parseAsStringEnum, useQueryStates } from "nuqs";

export const VIEWS = ["designer", "case-study", "skill"] as const;
export type View = (typeof VIEWS)[number];

const VIEW_PARAMS = {
  view: parseAsStringEnum([...VIEWS])
    .withDefault("designer")
    .withOptions({
      clearOnDefault: true,
      // Not shallow: switching views re-runs the server prefetch, matching how
      // the existing filters behave.
      shallow: false,
    }),
};

export function useViewParams() {
  return useQueryStates(VIEW_PARAMS, { shallow: false });
}
