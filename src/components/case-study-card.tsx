"use client";

import Image from "next/image";
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
    if (!hasVideo || prefersReducedMotion()) return;
    void videoRef.current?.play().catch(() => undefined);
  };

  const handleMouseLeave = () => {
    const video = videoRef.current;
    if (!hasVideo || !video) return;
    video.pause();
    video.currentTime = 0;
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
      className="h-full w-full object-cover"
      onError={() => setMediaError(true)}
    />
  ) : caseStudy.coverImageUrl && !mediaError ? (
    <Image
      src={caseStudy.coverImageUrl}
      alt={caseStudy.name}
      fill
      unoptimized
      className="object-cover"
      onError={() => setMediaError(true)}
    />
  ) : (
    <ImagePlaceholder name={caseStudy.name} fill />
  );

  const metadata = [caseStudy.infoRole, caseStudy.infoTeam].filter(Boolean);

  return (
    <div
      ref={containerRef}
      className="group relative block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video overflow-hidden rounded-sm bg-muted">
        {media}

        {caseStudy.websiteUrl && (
          <a
            href={caseStudy.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10"
            aria-label={`Visit ${caseStudy.name}`}
          />
        )}

        {caseStudy.industries && caseStudy.industries.length > 0 && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex flex-wrap gap-1.5">
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

      <div className="mt-3 flex flex-col gap-1.5">
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
          <p className={cn("text-xs text-neutral-500")}>
            {metadata.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
