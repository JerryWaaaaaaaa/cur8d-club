"use client";

import { useEffect, useState } from "react";

import {
  PALETTE_SIZE,
  fallbackPalette,
} from "@/lib/avatar-mosaic";

export interface MosaicOwner {
  author: string;
  avatarUrl: string | null;
}

/**
 * Shared across every card on the page. The twenty sets draw on twelve
 * repository owners between them, so caching by owner turns roughly a hundred
 * and twenty image decodes into twelve.
 */
const paletteCache = new Map<string, string[]>();
const inFlight = new Map<string, Promise<string[]>>();

function sourceFor(owner: MosaicOwner): string {
  return owner.avatarUrl ?? `https://github.com/${owner.author}.png`;
}

/**
 * Read an avatar as a 4×4 grid of colours.
 *
 * The pixelation is the browser's, not ours: drawing a 400px avatar into a
 * 4×4 canvas is a downscale, and a downscale averages each region into one
 * pixel. Reading those sixteen pixels back gives the picture's colours in the
 * picture's own arrangement, which is the whole trick.
 */
async function samplePalette(owner: MosaicOwner): Promise<string[]> {
  const image = new window.Image();
  // Required for `getImageData` on a cross-origin source. Both hosts in play —
  // Vercel Blob and avatars.githubusercontent.com — send the header for it,
  // but a redirect or a proxy that drops it taints the canvas, and reading a
  // tainted canvas throws rather than returning anything.
  image.crossOrigin = "anonymous";
  image.src = sourceFor(owner);

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("avatar failed to load"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = PALETTE_SIZE;
  canvas.height = PALETTE_SIZE;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("no 2d context");

  context.drawImage(image, 0, 0, PALETTE_SIZE, PALETTE_SIZE);

  const { data } = context.getImageData(0, 0, PALETTE_SIZE, PALETTE_SIZE);
  const palette: string[] = [];

  for (let i = 0; i < data.length; i += 4) {
    palette.push(`rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`);
  }

  return palette;
}

function loadPalette(owner: MosaicOwner): Promise<string[]> {
  const cached = inFlight.get(owner.author);
  if (cached) return cached;

  const request = samplePalette(owner)
    .catch(() => fallbackPalette(owner.author))
    .then((palette) => {
      paletteCache.set(owner.author, palette);
      return palette;
    });

  inFlight.set(owner.author, request);
  return request;
}

/**
 * Palettes for a set's owners, in the order given.
 *
 * Starts on the deterministic fallback rather than on nothing, because canvas
 * work cannot happen during the server render — so the cover paints a complete
 * mosaic immediately and swaps to the sampled colours when they arrive, instead
 * of flashing an empty square on every card.
 */
export function useAvatarPalettes(owners: MosaicOwner[]): string[][] {
  const key = owners.map((owner) => owner.author).join(",");

  const [palettes, setPalettes] = useState<string[][]>(() =>
    owners.map(
      (owner) =>
        paletteCache.get(owner.author) ?? fallbackPalette(owner.author),
    ),
  );

  useEffect(() => {
    let active = true;

    void Promise.all(owners.map(loadPalette)).then((resolved) => {
      if (active) setPalettes(resolved);
    });

    return () => {
      active = false;
    };
    // Keyed on the owner names rather than the array, which is rebuilt on
    // every render and would otherwise re-run this forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return palettes;
}
