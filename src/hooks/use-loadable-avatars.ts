"use client";

import { useEffect, useState } from "react";

/**
 * Which avatar URLs actually load.
 *
 * This exists because an SVG `<image>` cannot report its own failure usefully:
 * the browser paints its broken-image icon over whatever sits underneath, and
 * the element's error event does not bubble, so React's `onError` never fires
 * for it. A cover whose avatars are unreachable would be 64 broken icons.
 *
 * So each distinct URL is loaded once through an ordinary `HTMLImageElement`,
 * which does report reliably, and only the ones that come back are drawn.
 * Tiles for the rest keep the flat colour painted under them.
 *
 * Results are cached across every card on the page: the twenty sets draw on
 * twelve repository owners between them, so this is twelve requests rather
 * than one per tile.
 */
const loaded = new Set<string>();
const probes = new Map<string, Promise<void>>();

function probe(src: string): Promise<void> {
  const existing = probes.get(src);
  if (existing) return existing;

  const request = new Promise<void>((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      loaded.add(src);
      resolve();
    };
    image.onerror = () => resolve();
    image.src = src;
  });

  probes.set(src, request);
  return request;
}

export function useLoadableAvatars(srcs: string[]): ReadonlySet<string> {
  const key = srcs.join("|");

  // Starts empty rather than optimistic, so the first paint is the flat
  // colours and the avatars arrive over them. The other way round would show
  // broken icons for as long as the requests took to fail, which is the exact
  // thing this hook is here to prevent.
  const [ready, setReady] = useState<ReadonlySet<string>>(
    () => new Set(srcs.filter((src) => loaded.has(src))),
  );

  useEffect(() => {
    let active = true;

    void Promise.all(srcs.map(probe)).then(() => {
      if (active) setReady(new Set(srcs.filter((src) => loaded.has(src))));
    });

    return () => {
      active = false;
    };
    // Keyed on the URLs themselves; the array is rebuilt on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return ready;
}
