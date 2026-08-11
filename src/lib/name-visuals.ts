// Expanded Bauhaus and Swiss style inspired color palette
const bauhausColors = [
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
 * Up to two initials for a name.
 *
 * `filter(Boolean)` is doing real work: splitting on runs of non-letters leaves
 * an empty string for every gap between them, so "A.B. Design" and any name
 * with a double space would otherwise take `undefined` as its first initial.
 * A name with no Latin letters at all yields "", which the callers draw as a
 * plain tile rather than an empty box.
 */
export function initialsFor(name: string): string {
  return name
    .split(/[^a-zA-Z]/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * A stable colour for a name. Deterministic so a designer's tile is the same on
 * every render and every machine, and shared between the square placeholder and
 * the round avatar so one card never shows two different colours for one person.
 */
export function colorForName(name: string): string {
  const nameHash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return bauhausColors[nameHash % bauhausColors.length]!;
}

/**
 * Ink that can actually be read on `colorForName`'s answer.
 *
 * The palette runs from black to off-white, so the white the initials used to
 * be painted in unconditionally disappeared on four of the twenty-four — a name
 * landing on Off-White or Swiss Yellow drew a blank tile. Relative luminance
 * per WCAG, with the threshold at the point where black overtakes white for
 * contrast.
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
