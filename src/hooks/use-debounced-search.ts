"use client";

import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

/**
 * Keeps a search box responsive while the query lives in the URL.
 *
 * The input renders from local state so keystrokes never wait on a round trip,
 * and the committed value is written a beat after typing stops. The URL still
 * wins whenever it changes on its own — a reset button, the back button — but
 * not when the change is our own write coming back, which would otherwise wipe
 * out anything typed while that write was in flight.
 */
export function useDebouncedSearch(
  value: string,
  commit: (next: string | null) => void,
) {
  const [draft, setDraft] = useState(value);
  const committedRef = useRef(value);
  const commitRef = useRef(commit);

  useEffect(() => {
    commitRef.current = commit;
  });

  useEffect(() => {
    if (value === committedRef.current) return;

    committedRef.current = value;
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === committedRef.current) return;

    const timeout = setTimeout(() => {
      committedRef.current = draft;
      commitRef.current(draft === "" ? null : draft);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [draft]);

  return [draft, setDraft] as const;
}
