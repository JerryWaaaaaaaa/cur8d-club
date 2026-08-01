/**
 * Sizing for the badge that stands in for the cursor on the card grids.
 *
 * The badge shrinks as the pointer nears the edge of a card's cover square, so
 * it feels like it's being squeezed out as you leave the artwork.
 *
 * Set `enabled` to false to restore the constant-size badge — nothing else
 * needs changing, both grids read this one switch.
 */
export const CURSOR_BADGE_SCALING = {
  enabled: true,
  /** Full size while further than this many px from the cover's edge. */
  shrinkWithin: 50,
  /** Scale once the pointer reaches the edge. */
  minScale: 0.45,
};

/** The cover's untransformed box, in viewport coordinates. */
export interface CoverBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Scale for the badge given where the pointer is inside a card.
 *
 * Distance is measured to the nearest edge of the cover square and clamped at
 * zero, so anywhere outside it — the title and description below — sits at the
 * minimum scale rather than growing again.
 */
export function badgeScaleForPointer(
  cover: CoverBox | null,
  clientX: number,
  clientY: number,
): number {
  if (!CURSOR_BADGE_SCALING.enabled || !cover) return 1;

  const { shrinkWithin, minScale } = CURSOR_BADGE_SCALING;
  if (shrinkWithin <= 0) return 1;

  const distance = Math.max(
    0,
    Math.min(
      clientX - cover.left,
      cover.left + cover.width - clientX,
      clientY - cover.top,
      cover.top + cover.height - clientY,
    ),
  );

  if (distance >= shrinkWithin) return 1;

  return minScale + (1 - minScale) * (distance / shrinkWithin);
}
