/**
 * The accent colours for skill set badges, taken from the balls in the
 * wordmark (`src/components/nav/logo.tsx`) rather than invented. Six distinct
 * hues is already a categorical palette, and drawing from the mark means a new
 * category can never arrive off-brand.
 *
 * `ink` is stored per colour instead of being derived, because the palette
 * does not take one rule: red, blue, maroon and purple clear AA against white
 * text (5.7 to 11.0), but yellow and orange sit at 1.7 and 2.4 and have to be
 * set in the near-black the logo already uses.
 */
export const BALL_ACCENTS = {
  red: { fill: "#C5271E", ink: "#FFFFFF" },
  yellow: { fill: "#E6C507", ink: "#1E1E1E" },
  blue: { fill: "#193E83", ink: "#FFFFFF" },
  maroon: { fill: "#860001", ink: "#FFFFFF" },
  purple: { fill: "#522280", ink: "#FFFFFF" },
  orange: { fill: "#FC881A", ink: "#1E1E1E" },
} as const;

export type AccentToken = keyof typeof BALL_ACCENTS;
export type Accent = (typeof BALL_ACCENTS)[AccentToken];

/**
 * The categories currently in the data, pinned so a set's colour is a property
 * of what it is rather than of where it happens to sit in a list. Yellow is
 * deliberately unassigned — it is the one left for a sixth category.
 */
const USE_CASE_ACCENT: Record<string, AccentToken> = {
  "Brand Design": "red",
  "Website Design": "blue",
  "Product Design": "purple",
  "Mobile Design": "orange",
  "Design Engineering": "maroon",
};

const ACCENT_TOKENS = Object.keys(BALL_ACCENTS) as AccentToken[];

/**
 * FNV-1a, for categories that arrive after this file was written. Any stable
 * hash would do; what matters is that it is a pure function of the name, so a
 * category keeps its colour across renders, machines and deploys without
 * anyone having to store one.
 */
function hashToken(value: string): AccentToken {
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return ACCENT_TOKENS[Math.abs(hash) % ACCENT_TOKENS.length]!;
}

/** The accent for a set's category, falling back to a stable hash. */
export function accentForUseCase(useCase: string | null | undefined): Accent {
  if (!useCase) return BALL_ACCENTS.blue;

  const token = USE_CASE_ACCENT[useCase] ?? hashToken(useCase);

  return BALL_ACCENTS[token];
}
