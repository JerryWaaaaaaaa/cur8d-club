/**
 * The colour values the UI shares.
 *
 * Two palettes live here for one reason: before this file, the logo's colours
 * existed only as `fill` attributes inside the wordmark's SVG and the tile
 * palette was private to `name-visuals`, so nothing else could reach either one.
 * Anything that needs a brand colour reads it from here now.
 */

/**
 * The wordmark's colours, minus the three that make poor backgrounds for text:
 * near-black `#0D0D0D`, dark red `#860001`, and the cream `#F1E9C2`, which is
 * too close to the page to register as a highlight.
 *
 * `src/components/nav/logo.tsx` paints its balls from these, so the set and the
 * mark cannot drift apart.
 */
export const accentColors = [
  "#C5271E", // red — the two `c` balls
  "#E6C507", // yellow — the two `u` balls
  "#193E83", // blue — the `r` ball
  "#522280", // purple — the `l` ball
  "#FC881A", // orange — the `b` ball
] as const;

/** A colour from `accentColors`, chosen fresh each call. */
export function randomAccentColor(): string {
  return accentColors[Math.floor(Math.random() * accentColors.length)]!;
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
