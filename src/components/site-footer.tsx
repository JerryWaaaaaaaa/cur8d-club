"use client";

import Link from "next/link";
import { useState } from "react";

import { SubmissionForm } from "@/components/submission-form";

/**
 * The site's two links, pinned to the bottom-right corner.
 *
 * They used to live in the header's right-hand column, which cost the filter
 * row a third of the width it needed once the sort control arrived. Down here
 * they sit over the grid instead of competing with it, so the whole header
 * width is free for controls.
 *
 * Trimmed to the calls to action alone — the sentences that used to introduce
 * them ("Discover inspiring designers…", "Have someone in mind?") ran wide
 * enough to reach the search bar centred on the same line. What is left is
 * short enough for the two to share that line.
 *
 * Cards scroll underneath, so the text needs something behind it to stay
 * readable. That something is painted on the inline text itself rather than on
 * a wrapper, so it hugs the line instead of reading as a panel floating over
 * the grid, with `box-decoration-clone` keeping that true if it ever wraps.
 *
 * Mobile has its own copy of this text inside the Info overlay, and a fixed
 * filter bar in this corner, so this is desktop-only.
 */
const LINE_BACKDROP =
  "box-decoration-clone bg-neutral-200/85 px-1.5 py-0.5 pointer-events-auto";

export function SiteFooter() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <footer className="pointer-events-none fixed bottom-5 right-6 z-40 hidden text-right text-base leading-relaxed text-neutral-900 md:block">
        <p>
          <span className={LINE_BACKDROP}>
            <Link
              href="https://x.com/notjerrywang"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              ↳ @Jerry
            </Link>
            {" · "}
            <button
              onClick={() => setIsFormOpen(true)}
              className="underline hover:no-underline"
            >
              ↳ Submit a referral
            </button>
          </span>
        </p>
      </footer>

      <SubmissionForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </>
  );
}
