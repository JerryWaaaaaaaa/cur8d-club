"use client";

import Link from "next/link";
import { useState } from "react";

import { SubmissionForm } from "@/components/submission-form";

/**
 * The site blurb, pinned to the bottom-right corner.
 *
 * It used to live in the header's right-hand column, which cost the filter row
 * a third of the width it needed once the sort control arrived. Down here it
 * sits over the grid instead of competing with it, so the whole header width is
 * free for controls.
 *
 * Cards scroll underneath, so the text needs something behind it to stay
 * readable. That something is painted on the inline text itself rather than on
 * a wrapper, so it hugs each line instead of reading as a panel floating over
 * the grid. `box-decoration-clone` is what gives the second line its own
 * padding instead of the two sharing one box.
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
            Discover inspiring designers. Curated by{" "}
            <Link
              href="https://x.com/notjerrywang"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              ↳ @Jerry
            </Link>
          </span>
        </p>
        <p>
          <span className={LINE_BACKDROP}>
            Have someone in mind?{" "}
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
