interface MicrolinkResponse {
  status: string;
  data?: {
    screenshot?: {
      url?: string;
    };
  };
}

/**
 * Captures a screenshot of a page and returns a hosted image URL.
 *
 * Kept behind one helper so the provider stays swappable. Only meaningful for
 * ordinary websites — x.com and friends block automated capture, so video
 * entries use their poster frame instead of calling this.
 */
export async function fetchScreenshotUrl(url: string): Promise<string | null> {
  const endpoint = new URL("https://api.microlink.io");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("screenshot", "true");
  endpoint.searchParams.set("meta", "false");
  endpoint.searchParams.set("waitUntil", "networkidle2");

  const apiKey = process.env.SCREENSHOT_API_KEY;

  try {
    const response = await fetch(endpoint, {
      headers: apiKey ? { "x-api-key": apiKey } : undefined,
    });

    if (!response.ok) {
      console.error("Screenshot request failed for", url, response.status);
      return null;
    }

    const body = (await response.json()) as MicrolinkResponse;
    return body.data?.screenshot?.url ?? null;
  } catch (error) {
    console.error("Error fetching screenshot for", url, error);
    return null;
  }
}
