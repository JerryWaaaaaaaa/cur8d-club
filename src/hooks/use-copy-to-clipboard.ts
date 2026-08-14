"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** How long the button stays in its "copied" state before reverting. */
const COPIED_MS = 2000;

/**
 * Copy text, confirm it, and say so on the button for a moment.
 *
 * The confirmation matters more here than it usually would: the page never
 * shows the text being copied, and there are two things a button might have
 * copied, so the toast is what tells you which one you got.
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const copy = useCallback(async (text: string, confirmation: string) => {
    if (text === "") return false;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Denied permission, or an insecure origin. Saying so is better than a
      // button that reports success over an empty clipboard.
      toast("Couldn't reach the clipboard — copy it by hand instead.");
      return false;
    }

    toast(confirmation);
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), COPIED_MS);

    return true;
  }, []);

  return { copy, copied };
}
