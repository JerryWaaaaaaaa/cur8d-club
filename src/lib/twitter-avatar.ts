import { mirrorToBlob } from "@/lib/blob-storage";

/**
 * Resolves a handle to a profile picture and mirrors it into Blob.
 *
 * Goes through unavatar rather than X directly: x.com blocks data-centre
 * traffic, which is the same reason the profile scraper and the screenshot
 * service both give up on it. `fallback=false` makes unavatar 404 for a handle
 * it cannot resolve — its default is to invent a generated image, and a made-up
 * avatar stored as a real one is worse than none, since nothing downstream
 * could tell the difference.
 *
 * The bytes are copied rather than linked because twimg URLs rot, and because
 * pointing every card at unavatar would put someone else's rate limit between
 * the grid and its own faces.
 */
export async function fetchAvatarUrl(
  handle: string,
  id: string,
): Promise<string | null> {
  const source = `https://unavatar.io/x/${encodeURIComponent(
    handle,
  )}?fallback=false`;

  return mirrorToBlob(source, `designers/${id}/avatar`);
}
