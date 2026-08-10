interface MicrolinkResponse {
  status: string;
  data?: {
    screenshot?: {
      url?: string;
    };
  };
}

export interface ScreenshotResult {
  url: string | null;
  /**
   * Whether a failure is worth coming back to. A rate limit or a dropped
   * connection says nothing about the site and should be retried; a site that
   * refuses capture will refuse it again tomorrow. Callers use this to decide
   * whether to stamp the row as attempted — without the distinction a
   * rate-limited row either burns the budget forever or waits out a month it
   * did nothing to deserve.
   */
  retryable: boolean;
}

interface ScreenshotOptions {
  /** Capture viewport, in CSS pixels. Microlink's own default when omitted. */
  width?: number;
  height?: number;
}

/**
 * Captures a screenshot of a page and returns a hosted image URL.
 *
 * Kept behind one helper so the provider stays swappable. Only meaningful for
 * ordinary websites — x.com and friends block automated capture, so video
 * entries use their poster frame instead of calling this.
 */
export async function fetchScreenshotUrl(
  url: string,
  options: ScreenshotOptions = {},
): Promise<ScreenshotResult> {
  const endpoint = new URL("https://api.microlink.io");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("screenshot", "true");
  endpoint.searchParams.set("meta", "false");
  endpoint.searchParams.set("waitUntil", "networkidle2");

  if (options.width !== undefined) {
    endpoint.searchParams.set("viewport.width", String(options.width));
  }
  if (options.height !== undefined) {
    endpoint.searchParams.set("viewport.height", String(options.height));
  }

  const apiKey = process.env.SCREENSHOT_API_KEY;

  try {
    const response = await fetch(endpoint, {
      headers: apiKey ? { "x-api-key": apiKey } : undefined,
    });

    if (!response.ok) {
      console.error("Screenshot request failed for", url, response.status);
      // 429 is the free tier's daily ceiling rather than anything about this
      // page; 5xx is the service having a bad minute. Both come round again.
      return {
        url: null,
        retryable: response.status === 429 || response.status >= 500,
      };
    }

    const body = (await response.json()) as MicrolinkResponse;
    return { url: body.data?.screenshot?.url ?? null, retryable: false };
  } catch (error) {
    console.error("Error fetching screenshot for", url, error);
    return { url: null, retryable: true };
  }
}
