import { put } from "@vercel/blob";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Copies a remote asset into Vercel Blob and returns the stable public URL.
 *
 * Notion file URLs expire after roughly an hour and twimg links rot, so
 * anything we intend to keep rendering has to be mirrored rather than linked.
 * URLs that already point at Blob are returned untouched.
 */
export async function mirrorToBlob(
  sourceUrl: string,
  key: string,
): Promise<string | null> {
  if (isBlobUrl(sourceUrl)) return sourceUrl;

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      console.error(
        `Failed to download ${sourceUrl} for mirroring:`,
        response.status,
      );
      return null;
    }

    const blob = await put(key, response.body!, {
      access: "public",
      contentType: response.headers.get("content-type") ?? undefined,
      addRandomSuffix: true,
    });

    return blob.url;
  } catch (error) {
    console.error("Error mirroring to blob:", sourceUrl, error);
    return null;
  }
}

/** Mirrors a file already on disk — used by the local ingest script. */
export async function uploadFileToBlob(
  data: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const blob = await put(key, data, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });

  return blob.url;
}
