/** The cover is an 8×8 grid, so a mosaic is always exactly 64 tiles. */
export const MOSAIC_SIZE = 8;
export const MOSAIC_TILES = MOSAIC_SIZE * MOSAIC_SIZE;

export interface MosaicOwner {
  author: string;
  avatarUrl: string | null;
}

export interface MosaicTile {
  author: string;
  src: string;
  /** Painted under the image, and all that shows if it cannot be fetched. */
  color: string;
}

/** FNV-1a, so a set's arrangement is the same on every render and machine. */
function hash(value: string): number {
  let result = 0x811c9dc5;

  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i);
    result = Math.imul(result, 0x01000193);
  }

  return Math.abs(result);
}

/** mulberry32 — small, seedable, and good enough to scatter 64 tiles. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function avatarSrc(owner: MosaicOwner): string {
  return owner.avatarUrl ?? `https://github.com/${owner.author}.png`;
}

/**
 * A flat colour per owner, shown only when their avatar cannot be fetched.
 *
 * Deliberately not `colorForName`, which the initials tiles use: that palette
 * carries black, charcoal, off-white and two greys on purpose, which is right
 * behind two letters and wrong for a tile that is standing in for a picture.
 * One hue from the name at a saturation that cannot go grey instead.
 */
export function ownerColor(author: string): string {
  return `hsl(${hash(author) % 360} 46% 56%)`;
}

/**
 * Fill the grid with the set's avatars, repeating them until all 64 tiles are
 * taken and then shuffling.
 *
 * The shuffle is the point. Walking the owners in order — tile `i` gets owner
 * `i % count` — collapses whenever the count divides the row length: four
 * owners across eight columns puts the same avatar in columns 0 and 4 of every
 * row, and eight owners puts one avatar down each column, so the cover comes
 * out as vertical stripes rather than a mosaic. Offsetting by row turns the
 * stripes diagonal, which is tidier and still obviously a pattern.
 *
 * Seeded from the set's slug, so the arrangement is scattered but fixed: a
 * given set looks the same on every visit and to every visitor, and does not
 * reshuffle on re-render.
 */
export function buildMosaic(owners: MosaicOwner[], seed: string): MosaicTile[] {
  if (owners.length === 0) return [];

  // Repeating before shuffling is what keeps the owners evenly represented —
  // 64 draws at random would leave some avatars barely present by chance.
  const picks = Array.from(
    { length: MOSAIC_TILES },
    (_, index) => index % owners.length,
  );

  const random = seededRandom(hash(seed));
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [picks[i], picks[j]] = [picks[j]!, picks[i]!];
  }

  return picks.map((index) => {
    const owner = owners[index]!;

    return {
      author: owner.author,
      src: avatarSrc(owner),
      color: ownerColor(owner.author),
    };
  });
}
