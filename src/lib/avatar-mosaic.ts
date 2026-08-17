/** The cover is an 8×8 grid, so a mosaic is always exactly 64 tiles. */
export const MOSAIC_SIZE = 8;
export const MOSAIC_TILES = MOSAIC_SIZE * MOSAIC_SIZE;

/**
 * Each avatar is read as a 4×4 block of pixels — sixteen colours, in the
 * arrangement they had in the picture. Small enough that a face reduces to a
 * few flat fields rather than mush, and it divides the 8×8 grid evenly.
 */
export const PALETTE_SIZE = 4;
export const PALETTE_COLORS = PALETTE_SIZE * PALETTE_SIZE;

/** FNV-1a, so an owner's fallback is the same on every render and machine. */
function hueFor(owner: string): number {
  let hash = 0x811c9dc5;

  for (let i = 0; i < owner.length; i++) {
    hash ^= owner.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return Math.abs(hash) % 360;
}

/**
 * A palette for an owner whose avatar could not be read — the host was
 * unreachable, or the canvas came back tainted.
 *
 * Deliberately not built on `colorForName`, which the initials tiles use.
 * That palette carries black, charcoal, off-white and two greys on purpose,
 * which are the right answer behind two letters and the wrong one here: an
 * owner landing on black produced sixteen shades between #000 and #474747, a
 * block that reads as a rendering failure rather than as a colour.
 *
 * So: one hue from the name, held at a saturation that cannot go grey, walked
 * across a bounded lightness band. Sixteen shades of one colour read as a
 * pixelated something; sixteen unrelated hues would read as confetti.
 */
export function fallbackPalette(owner: string): string[] {
  const hue = hueFor(owner);

  return Array.from({ length: PALETTE_COLORS }, (_, index) => {
    const t = index / (PALETTE_COLORS - 1);

    // 32%–74% keeps every tile clear of both ends, where colours collapse
    // into black and white and the block stops looking deliberate.
    const lightness = 32 + t * 42;
    // A slight hue drift across the ramp, so it reads as a rendered surface
    // rather than a linear gradient swatch.
    const drift = (hue + (t - 0.5) * 24 + 360) % 360;

    return `hsl(${drift.toFixed(1)} 52% ${lightness.toFixed(1)}%)`;
  });
}

/**
 * Weave a set's avatars into one 64-tile mosaic.
 *
 * Owners are picked per cell by `(row + col) % count`, which runs them along
 * diagonals so no one clumps into a corner, and which lands on exactly 64 tiles
 * for any number of owners — the reason this is not a block per avatar. Four
 * owners divide 64 into equal squares; five, six and seven do not, and twelve
 * of the twenty sets have one of those counts.
 *
 * Within an owner the colour comes from their own 4×4 grid at the cell's
 * position modulo four, so their pixels keep the arrangement they had in the
 * avatar. That is what separates this from noise: each palette repeats as a
 * recognisable little block, and the weave interleaves the blocks.
 */
export function buildMosaic(palettes: string[][]): string[] {
  const usable = palettes.filter((palette) => palette.length > 0);
  if (usable.length === 0) return [];

  const tiles: string[] = [];

  for (let row = 0; row < MOSAIC_SIZE; row++) {
    for (let col = 0; col < MOSAIC_SIZE; col++) {
      const palette = usable[(row + col) % usable.length]!;
      const index =
        ((row % PALETTE_SIZE) * PALETTE_SIZE + (col % PALETTE_SIZE)) %
        palette.length;

      tiles.push(palette[index]!);
    }
  }

  return tiles;
}
