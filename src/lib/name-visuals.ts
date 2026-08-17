import { bauhausColors } from "@/lib/colors";

// The tiles' ink lives with the palettes now, but every caller that needs a
// colour for a name needs it too, so it stays reachable from here.
export { inkForBackground } from "@/lib/colors";

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
