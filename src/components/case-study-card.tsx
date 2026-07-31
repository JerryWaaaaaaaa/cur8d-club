"use client";

import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { type api as serverApi } from "@/trpc/server";
import { cn } from "@/lib/utils";
import { ImagePlaceholder } from "./image-placeholder";

type CaseStudy = Awaited<
  ReturnType<(typeof serverApi)["caseStudy"]["getInfiniteScroll"]>
>["items"][number];

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
}

// Same seeds as the designer card, so both grids share one hover personality.
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
  const [mediaError, setMediaError] = useState(false);
  const [hoverRotation, setHoverRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const hasVideo =
    caseStudy.mediaType === "video" && caseStudy.videoUrl !== null && !mediaError;

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

  const handleMouseEnter = () => {
    if (hasVideo) void videoRef.current?.play().catch(() => undefined);
    if (prefersReducedMotion()) return;
    const seed =
      HOVER_ROTATION_SEEDS[
        Math.floor(Math.random() * HOVER_ROTATION_SEEDS.length)
      ]!;
    setHoverRotation(seed);
    setIsHovered(true);
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
      className="group relative block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "relative z-0 mb-3 aspect-square overflow-hidden bg-muted",
          "origin-center transition-transform duration-300 ease-out",
          isHovered && "z-10",
          "motion-reduce:transition-none",
        )}
        style={{
          transform:
            hoverRotation !== 0 ? `rotate(${hoverRotation}deg)` : undefined,
        }}
      >
        {caseStudy.websiteUrl && (
          <a
            href={caseStudy.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-0"
            aria-label={`Visit ${caseStudy.name}`}
          />
        )}

        {caseStudy.types && caseStudy.types.length > 0 && (
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
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

        {caseStudy.websiteUrl && (
          <div className="absolute right-3 top-3 z-10">
            <a
              href={caseStudy.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex h-[22px] cursor-pointer items-center overflow-hidden rounded-full",
                "bg-neutral-200 transition-all duration-200 ease-out hover:bg-neutral-300",
                "w-[22px] group-hover:w-[104px]",
              )}
            >
              <div className="flex w-[22px] flex-shrink-0 items-center justify-center">
                <ArrowUpRight className="h-3.5 w-3.5 text-neutral-700" />
              </div>
              <span className="whitespace-nowrap pl-0 text-xs text-neutral-700">
                Visit Project
              </span>
              <span className="sr-only">Visit Project</span>
            </a>
          </div>
        )}

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
        {caseStudy.websiteUrl ? (
          <a
            href={caseStudy.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <h2 className="font-medium text-neutral-900">{caseStudy.name}</h2>
          </a>
        ) : (
          <h2 className="font-medium text-neutral-900">{caseStudy.name}</h2>
        )}

        {caseStudy.aiSummary && (
          <p className="text-sm leading-snug text-neutral-600">
            {caseStudy.aiSummary}
          </p>
        )}

        {metadata.length > 0 && (
          <p className="text-xs text-neutral-500">{metadata.join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
