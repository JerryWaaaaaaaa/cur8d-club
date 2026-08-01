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
 * Cards scroll underneath, so the text needs its own backdrop to stay readable
 * — the neutral chip matches the filter pills rather than inventing a new
 * surface colour.
 *
 * Mobile has its own copy of this text inside the Info overlay, and a fixed
 * filter bar in this corner, so this is desktop-only.
 */
export function SiteFooter() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <footer className="pointer-events-none fixed bottom-5 right-6 z-40 hidden md:block">
        <div className="pointer-events-auto rounded-2xl bg-neutral-200/80 px-4 py-2.5 text-right text-base leading-normal text-neutral-900 backdrop-blur-md">
          <p>
            Discover inspiring designers. Curated by{" "}
            <Link
              href="https://x.com/notjerrywang"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              ↳ @Jerry
            </Link>
          </p>
          <p>
            Have someone in mind?{" "}
            <button
              onClick={() => setIsFormOpen(true)}
              className="underline hover:no-underline"
            >
              ↳ Submit a referral
            </button>
          </p>
        </div>
      </footer>

      <SubmissionForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </>
  );
}
