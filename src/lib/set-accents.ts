import { hashKey, wordmarkColors } from "@/lib/colors";

/**
 * The accent colours for skill set badges, taken from the balls in the
 * wordmark rather than invented, so a new category can never arrive off-brand.
 *
 * Five of the six are `accentColors`; the sixth is the dark red, which that
 * set leaves out. The two are answering different questions — `accentColors`
 * is for text *painted in* a colour, where the dark red is too dark to read,
 * and this is for text sitting *on* one, where it is among the best of them at
 * 10.4:1 under white.
 *
 * `ink` is spelled out per colour rather than derived through
 * `inkForBackground`, and orange is the reason. Its luminance is 0.384, just
 * under that function's 0.4 threshold, so it comes back white — 2.42:1, which
 * fails AA outright. The near-black here gives 6.89:1. Spelling the pairs out
 * also means a colour added later has to have its ink chosen deliberately
 * rather than inheriting a threshold that is wrong for this band.
 */
export const BALL_ACCENTS = {
  red: { fill: wordmarkColors.red, ink: "#FFFFFF" },
  yellow: { fill: wordmarkColors.yellow, ink: "#1E1E1E" },
  blue: { fill: wordmarkColors.blue, ink: "#FFFFFF" },
  maroon: { fill: wordmarkColors.darkRed, ink: "#FFFFFF" },
  purple: { fill: wordmarkColors.purple, ink: "#FFFFFF" },
  orange: { fill: wordmarkColors.orange, ink: "#1E1E1E" },
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
 * For categories that arrive after this file was written. What matters is that
 * it is a pure function of the name, so a category keeps its colour across
 * renders, machines and deploys without anyone having to store one.
 */
function hashToken(value: string): AccentToken {
  return ACCENT_TOKENS[hashKey(value) % ACCENT_TOKENS.length]!;
}

/** The accent for a set's category, falling back to a stable hash. */
export function accentForUseCase(useCase: string | null | undefined): Accent {
  if (!useCase) return BALL_ACCENTS.blue;

  const token = USE_CASE_ACCENT[useCase] ?? hashToken(useCase);

  return BALL_ACCENTS[token];
}
