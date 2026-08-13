"use client";

import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { type api as serverApi } from "@/trpc/server";
import { cn } from "@/lib/utils";
import { badgeScaleForPointer, type CoverBox } from "@/lib/cursor-badge";
import { ImagePlaceholder } from "./image-placeholder";
import { Highlight } from "./highlight";

type CaseStudy = Awaited<
  ReturnType<(typeof serverApi)["caseStudy"]["getInfiniteScroll"]>
>["items"][number];

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  /** The active search terms, marked wherever they appear. */
  terms: string[];
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function CaseStudyCard({ caseStudy, terms }: CaseStudyCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [mediaError, setMediaError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasVideo =
    caseStudy.mediaType === "video" &&
    caseStudy.videoUrl !== null &&
    !mediaError;

  // On touch devices there is no hover, so play whichever card is on screen.
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!hasVideo || !video || !container) return;
    if (window.matchMedia("(hover: hover)").matches) return;
    if (prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [hasVideo]);

  const handleMouseEnter = (event: React.MouseEvent) => {
    // Place the badge before it becomes visible, otherwise it flashes at
    // wherever the pointer left it last.
    positionBadge(event);
    setIsHovered(true);
    if (hasVideo) void videoRef.current?.play().catch(() => undefined);
  };

  const handleMouseLeave = () => {
    const video = videoRef.current;
    if (hasVideo && video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsHovered(false);
  };

  // Positioned by hand rather than through state: this fires on every mouse
  // move, and re-rendering the card that often is wasteful. The second
  // translate centres the badge on the pointer, since it stands in for the
  // cursor rather than trailing it.
  const positionBadge = (event: React.MouseEvent) => {
    const container = containerRef.current;
    const badge = badgeRef.current;
    if (!container || !badge) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Layout offsets rather than a second getBoundingClientRect: the cover sits
    // at a fixed place inside the card, so its box follows from the card's.
    const cover = coverRef.current;
    const coverBox: CoverBox | null = cover
      ? {
          left: rect.left + cover.offsetLeft,
          top: rect.top + cover.offsetTop,
          width: cover.offsetWidth,
          height: cover.offsetHeight,
        }
      : null;

    const scale = badgeScaleForPointer(coverBox, event.clientX, event.clientY);

    // scale sits last so it is applied first, around the badge's own centre —
    // that keeps the centre pinned to the pointer at any size.
    badge.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
  };

  // Bleeds to the cover's edges and keeps its own proportions, so the card's
  // height is whatever the screenshot's shape makes it. The width/height pair
  // is only the ratio assumed while loading — nothing records the real
  // dimensions, and the browser swaps in the natural ratio once the file
  // arrives.
  const media = hasVideo ? (
    <video
      ref={videoRef}
      src={caseStudy.videoUrl!}
      poster={caseStudy.posterUrl ?? undefined}
      muted
      loop
      playsInline
      preload="metadata"
      className="block h-auto w-full"
      onError={() => setMediaError(true)}
    />
  ) : caseStudy.coverImageUrl && !mediaError ? (
    <Image
      src={caseStudy.coverImageUrl}
      alt={caseStudy.name}
      width={1600}
      height={1000}
      unoptimized
      className="block h-auto w-full"
      onError={() => setMediaError(true)}
    />
  ) : (
    // The placeholder has no shape of its own to follow, so it is given one.
    <div className="aspect-[16/10]">
      <ImagePlaceholder name={caseStudy.name} />
    </div>
  );

  const metadata = [caseStudy.infoRole, caseStudy.infoTeam].filter(Boolean);

  return (
    <div
      ref={containerRef}
      // Lifted while hovered so the cursor badge, which spills past the card's
      // bounds, isn't painted over by the neighbouring card.
      className={cn("group relative block cursor-none", isHovered && "z-30")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={positionBadge}
    >
      {/* The border is the cover's own background colour, which is what draws
          the edge on a screenshot that is itself white — without it those run
          straight into the page. */}
      <div
        ref={coverRef}
        className="relative z-0 mb-3 overflow-hidden border border-muted bg-muted"
      >
        {media}

        {caseStudy.types && caseStudy.types.length > 0 && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
            {caseStudy.types.map((type) => (
              <span
                key={type}
                // Frosted grey rather than solid black: it has to sit on
                // whatever the screenshot happens to put underneath it. The
                // panel stays light enough over a dark cover for the dark ink
                // to hold, and the ring keeps its edge on a white one.
                className={cn(
                  "flex h-[22px] items-center rounded-full px-2 text-xs",
                  "bg-neutral-100/70 text-neutral-800 backdrop-blur-md",
                  "ring-1 ring-inset ring-neutral-900/10",
                )}
              >
                <Highlight text={toTitleCase(type)} terms={terms} />
              </span>
            ))}
          </div>
        )}

        {caseStudy.industries && caseStudy.industries.length > 0 && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
            {caseStudy.industries.map((industry) => (
              <span
                key={industry}
                className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-700"
              >
                <Highlight text={toTitleCase(industry)} terms={terms} />
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <h2 className="font-medium text-neutral-900">
          <Highlight text={caseStudy.name} terms={terms} />
        </h2>

        {/* Unclamped: the card is the only place this summary is shown, and
            there is nothing to open that would carry the rest of it — the link
            leaves for the project's own site. A long one makes its card taller,
            which the grid already allows for. */}
        {caseStudy.aiSummary && (
          <p className="text-sm leading-snug text-neutral-600">
            <Highlight text={caseStudy.aiSummary} terms={terms} />
          </p>
        )}

        {metadata.length > 0 && (
          <p className="text-xs text-neutral-500">
            <Highlight text={metadata.join(" · ")} terms={terms} />
          </p>
        )}
      </div>

      {/* Covers the whole card — artwork, title and description are all one
          click target. Sits above the media so it actually receives the click. */}
      {caseStudy.websiteUrl && (
        <a
          href={caseStudy.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-20 cursor-none"
          aria-label={`Visit ${caseStudy.name}`}
        />
      )}

      {caseStudy.websiteUrl && (
        <span
          ref={badgeRef}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-0 top-0 z-30 flex h-7 items-center gap-1",
            "whitespace-nowrap rounded-full bg-foreground px-3 text-xs text-background",
            "transition-opacity duration-75",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <ArrowUpRight weight="bold" className="h-3 w-3" />
          Visit Project
        </span>
      )}
    </div>
  );
}
