"use client";

import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { type api as serverApi } from "@/trpc/server";
import { cn } from "@/lib/utils";
import { badgeScaleForPointer, type CoverBox } from "@/lib/cursor-badge";
import { DescriptionPanel } from "./description-panel";
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
  // The description panel has to mirror the cover's box, and on this grid that
  // box is whatever shape the screenshot came back as — there is no ratio to
  // give the panel instead. It also changes once, when the image lands and the
  // assumed ratio is replaced by the real one, which is what the observer is
  // for rather than a single measurement on mount.
  const [coverHeight, setCoverHeight] = useState<number | null>(null);

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

  useEffect(() => {
    const cover = coverRef.current;
    if (!cover) return;

    // offsetHeight rather than the entry's contentRect: the panel is laid over
    // the whole cover, border included, and contentRect measures inside it.
    const observer = new ResizeObserver(() =>
      setCoverHeight(cover.offsetHeight),
    );
    observer.observe(cover);
    return () => observer.disconnect();
  }, []);

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

  // Type and industry read as one row of chips now that they are off the
  // artwork and under the title. They were told apart by their colour while
  // they sat on the screenshot; here the order carries it, type first.
  const chips = [...(caseStudy.types ?? []), ...(caseStudy.industries ?? [])];

  // Sized to the cover and rendered inside the full-card link, so the panel can
  // take the pointer — it needs the wheel to scroll — without swallowing the
  // click that opens the project.
  //
  // The panel sizes itself to its text; this is only the ceiling. A share of
  // the frame on a short cover, but flat past ~430px tall — a portrait
  // screenshot makes a cover twice the height of a landscape one, and 65% of
  // that would be most of the artwork frosted over.
  const description = caseStudy.aiSummary ? (
    <DescriptionPanel
      text={caseStudy.aiSummary}
      terms={terms}
      isHovered={isHovered}
      maxPanelHeight="min(65%, 280px)"
      style={{ height: coverHeight ?? 0 }}
    />
  ) : null;

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
      </div>

      {/* The summary is missing from this column on purpose: it now lives in
          the panel that slides up over the cover on hover. */}
      <div className="mt-4 flex flex-col gap-1.5">
        <h2 className="font-medium text-neutral-900">
          <Highlight text={caseStudy.name} terms={terms} />
        </h2>

        {chips.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600"
              >
                <Highlight text={toTitleCase(chip)} terms={terms} />
              </span>
            ))}
          </div>
        )}

        {metadata.length > 0 && (
          <p className="text-xs text-neutral-500">
            <Highlight text={metadata.join(" · ")} terms={terms} />
          </p>
        )}
      </div>

      {/* Covers the whole card — artwork, title and chips are all one click
          target. Sits above the media so it actually receives the click. */}
      {caseStudy.websiteUrl ? (
        <a
          href={caseStudy.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-20 cursor-none"
          aria-label={`Visit ${caseStudy.name}`}
        >
          {description}
        </a>
      ) : (
        description
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
