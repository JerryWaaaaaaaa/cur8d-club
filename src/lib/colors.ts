/**
 * The colour values the UI shares.
 *
 * Two palettes live here for one reason: before this file, the logo's colours
 * existed only as `fill` attributes inside the wordmark's SVG and the tile
 * palette was private to `name-visuals`, so nothing else could reach either one.
 * Anything that needs a brand colour reads it from here now.
 */

/**
 * The wordmark's balls, by name.
 *
 * Named rather than positional because two different things draw from this now
 * and they need different subsets: `accentColors` below wants the five that
 * work as *text*, and the skill set badges want a sixth as a *background*.
 * Reaching for a colour by index would have meant the two agreeing about the
 * order of an array forever.
 */
export const wordmarkColors = {
  red: "#C5271E", // the two `c` balls
  yellow: "#E6C507", // the two `u` balls
  blue: "#193E83", // the `r` ball
  purple: "#522280", // the `l` ball
  orange: "#FC881A", // the `b` ball
  darkRed: "#860001",
  nearBlack: "#0D0D0D",
  cream: "#F1E9C2",
} as const;

/**
 * The wordmark's colours, minus the three that make poor backgrounds for text:
 * near-black `#0D0D0D`, dark red `#860001`, and the cream `#F1E9C2`, which is
 * too close to the page to register as a highlight.
 *
 * `src/components/nav/logo.tsx` paints its balls from these, so the set and the
 * mark cannot drift apart. Composed from `wordmarkColors` rather than repeating
 * the hexes, but the values and their order are exactly as they were.
 */
export const accentColors = [
  wordmarkColors.red,
  wordmarkColors.yellow,
  wordmarkColors.blue,
  wordmarkColors.purple,
  wordmarkColors.orange,
] as const;

/** A colour from `accentColors`, chosen fresh each call. */
export function randomAccentColor(): string {
  return accentColors[Math.floor(Math.random() * accentColors.length)]!;
}

/**
 * An arbitrary but stable colour from `accentColors`.
 *
 * For colours that are painted during render rather than raised by an event.
 * `Math.random()` cannot be used there: the server and the client would draw
 * different answers and React would report the mismatch, and every re-render —
 * a keystroke, a scroll, a filter — would reshuffle colours that are already on
 * screen. Hashing whatever makes the mark distinct gives the same spread
 * without either problem.
 *
 * FNV-1a with a finalizer, rather than the char-code sum `colorForName` uses.
 * Five colours is a small enough bucket count that a hash has to actually mix:
 * summing sends near-identical strings to neighbouring buckets, and so does any
 * multiplier congruent to 1 mod 5 — 31 included, which is why the obvious
 * `hash * 31 + c` painted two thirds of a searched grid in two colours. The
 * xor-shifts are what break that pattern.
 */
export function accentForKey(key: string): string {
  return accentColors[hashKey(key) % accentColors.length]!;
}

/**
 * FNV-1a with a finalizer, for picking a stable bucket from a string.
 *
 * Exported because the skill set badges hash into a palette of their own and
 * had grown a second copy of this. The finalizer is the part worth sharing:
 * with a handful of buckets, plain FNV-1a's low bits send near-identical
 * strings to neighbouring ones, and so does any multiplier congruent to 1 mod
 * the bucket count — 31 included, which is why an earlier `hash * 31 + c`
 * painted two thirds of a searched grid in two colours. The xor-shifts break
 * that up.
 */
export function hashKey(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x2545f491);
  hash ^= hash >>> 13;

  return Math.abs(hash);
}

// Expanded Bauhaus and Swiss style inspired color palette
export const bauhausColors = [
  "#E30022", // Bauhaus Red
  "#0087CC", // Bauhaus Blue
  "#F5D13B", // Bauhaus Yellow
  "#000000", // Black
  "#D9043D", // Swiss Red
  "#005CA9", // Swiss Blue
  "#FFDD00", // Swiss Yellow
  "#009F4D", // Green
  "#FF5C00", // Bauhaus Orange
  "#7C378A", // Bauhaus Purple
  "#00A19A", // Teal
  "#6B6B6B", // Dark Gray
  "#B8B8B8", // Light Gray
  "#E84E0F", // Vermilion
  "#2D2D2D", // Charcoal
  "#F2F2F2", // Off-White
  "#005F73", // Dark Teal
  "#DC143C", // Crimson
  "#1A5E63", // Petroleum Blue
  "#F28C28", // Tangerine
  "#264653", // Prussian Blue
  "#E76F51", // Burnt Sienna
  "#2A9D8F", // Persian Green
  "#E9C46A", // Saffron
];

/**
 * Ink that can actually be read on a given background.
 *
 * The tile palette runs from black to off-white, so the white the initials used
 * to be painted in unconditionally disappeared on four of the twenty-four — a
 * name landing on Off-White or Swiss Yellow drew a blank tile. The accent set
 * has the same spread: dark text vanishes on the blue and the purple. Relative
 * luminance per WCAG, with the threshold at the point where black overtakes
 * white for contrast.
 *
 * Expects a full `#RRGGBB` string — three-digit shorthand is not parsed.
 */
export function inkForBackground(hex: string): "#FFFFFF" | "#1A1A1A" {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  const luminance =
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);

  return luminance > 0.4 ? "#1A1A1A" : "#FFFFFF";
}
