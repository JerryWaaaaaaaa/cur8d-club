"use client";

import Link from "next/link";
import { useState } from "react";

import { SubmissionForm } from "@/components/submission-form";

/**
 * The site's footnote, at the foot of the desktop rail.
 *
 * It has moved twice for the same reason: to stay out of the controls' way. It
 * was the header's right-hand column until the sort control needed that width,
 * then the bottom-right corner, floating over the grid — which is why it used
 * to paint a backdrop on its own text. In the rail it has a column to itself
 * with nothing scrolling behind it, so the backdrop is gone and the lines can
 * read as plain text again.
 *
 * Mobile has its own copy of this text inside the filter sheet, and the rail
 * is desktop-only, so this is too.
 */
export function SiteFooter() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <footer className="text-base leading-relaxed text-neutral-900">
      <p>
        <button
          onClick={() => setIsFormOpen(true)}
          className="underline hover:no-underline"
        >
          Submit a referral
        </button>
      </p>
      <p>
        Curated by{" "}
        <Link
          href="https://x.com/notjerrywang"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          @Jerry
        </Link>
      </p>
      {/* Read off the clock rather than written in, so the line is still true
        next January without anyone having to remember it. */}
      <p>@ copyright {new Date().getFullYear()}</p>

      <SubmissionForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </footer>
  );
}
