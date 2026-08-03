"use client";

import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { type api as serverApi } from "@/trpc/server";
import { cn } from "@/lib/utils";
import { badgeScaleForPointer, type CoverBox } from "@/lib/cursor-badge";
import { ImagePlaceholder } from "./image-placeholder";

type CaseStudy = Awaited<
  ReturnType<(typeof serverApi)["caseStudy"]["getInfiniteScroll"]>
>["items"][number];

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
}

const HOVER_ROTATION_SEEDS = [2, 3, 4, 5, -2, -3, -4, -5] as const;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [mediaError, setMediaError] = useState(false);
  const [hoverRotation, setHoverRotation] = useState(0);
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
    if (prefersReducedMotion()) return;
    const seed =
      HOVER_ROTATION_SEEDS[
        Math.floor(Math.random() * HOVER_ROTATION_SEEDS.length)
      ]!;
    setHoverRotation(seed);
  };

  const handleMouseLeave = () => {
    const video = videoRef.current;
    if (hasVideo && video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsHovered(false);
    setHoverRotation(0);
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

    // Layout offsets rather than getBoundingClientRect: the cover is rotated
    // while hovered, and its bounding box is the enlarged one that encloses
    // the tilt, not the square the pointer actually sees.
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

  const media = hasVideo ? (
    <video
      ref={videoRef}
      src={caseStudy.videoUrl!}
      poster={caseStudy.posterUrl ?? undefined}
      muted
      loop
      playsInline
      preload="metadata"
      className="h-full w-full object-contain p-16"
      onError={() => setMediaError(true)}
    />
  ) : caseStudy.coverImageUrl && !mediaError ? (
    <Image
      src={caseStudy.coverImageUrl}
      alt={caseStudy.name}
      fill
      unoptimized
      className="object-contain p-16"
      onError={() => setMediaError(true)}
    />
  ) : (
    <ImagePlaceholder name={caseStudy.name} />
  );

  const metadata = [caseStudy.infoRole, caseStudy.infoTeam].filter(Boolean);

  return (
    <div
      ref={containerRef}
      // Lifted while hovered so the tilted frame and the cursor badge, which
      // both spill past the card's bounds, aren't painted over by the
      // neighbouring card.
      className={cn("group relative block cursor-none", isHovered && "z-30")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={positionBadge}
    >
      <div
        ref={coverRef}
        className={cn(
          "relative z-0 mb-3 aspect-square overflow-hidden bg-muted",
          "origin-center transition-transform duration-300 ease-out",
          "motion-reduce:transition-none",
        )}
        style={{
          transform:
            hoverRotation !== 0 ? `rotate(${hoverRotation}deg)` : undefined,
        }}
      >
        <div
          className={cn(
            "absolute inset-0 origin-center",
            "transition-transform duration-300 ease-out",
            "motion-reduce:transition-none",
          )}
          style={{
            transform:
              hoverRotation !== 0
                ? `rotate(${-hoverRotation * 2}deg) scale(1.05)`
                : undefined,
          }}
        >
          {media}
        </div>

        {caseStudy.types && caseStudy.types.length > 0 && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
            {caseStudy.types.map((type) => (
              <span
                key={type}
                className="flex h-[22px] items-center rounded-full bg-foreground px-2 text-xs text-background"
              >
                {toTitleCase(type)}
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
                {toTitleCase(industry)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <h2 className="font-medium text-neutral-900">{caseStudy.name}</h2>

        {caseStudy.aiSummary && (
          <p className="line-clamp-2 text-sm leading-snug text-neutral-600">
            {caseStudy.aiSummary}
          </p>
        )}

        {metadata.length > 0 && (
          <p className="text-xs text-neutral-500">{metadata.join(" · ")}</p>
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
