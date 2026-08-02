"use client";

import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import { HelpCircle } from "lucide-react";
import { type api as serverApi } from "@/trpc/server";
import { api } from "@/trpc/react";
import { ImagePlaceholder } from "./image-placeholder";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { badgeScaleForPointer, type CoverBox } from "@/lib/cursor-badge";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Collectable = Awaited<
  ReturnType<(typeof serverApi)["collectable"]["getInfiniteScroll"]>
>["items"][number];

interface CollectableCardProps {
  collectable: Collectable;
}

const HOVER_ROTATION_SEEDS = [2, 3, 4, 5, -2, -3, -4, -5] as const;

export function CollectableCard({ collectable }: CollectableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const [hoverRotation, setHoverRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const reportMutation = api.collectable.reportLink.useMutation({
    onSuccess: () => {
      toast("Thanks - we'll review this link and update it if needed.");
    },
  });

  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    reportMutation.mutate({ id: collectable.id });
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    // Place the badge before it becomes visible, otherwise it flashes at
    // wherever the pointer left it last.
    positionBadge(event);
    // Rewound while the description is still parked below the frame, so the
    // next reader starts at its first line without seeing the text jump.
    if (descriptionRef.current) descriptionRef.current.scrollTop = 0;
    setIsHovered(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seed =
      HOVER_ROTATION_SEEDS[
        Math.floor(Math.random() * HOVER_ROTATION_SEEDS.length)
      ]!;
    setHoverRotation(seed);
  };

  const handleMouseLeave = () => {
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

  // Mirrors the frame's box and rotation so the description rides along with
  // the tilt, and clips it so the panel is hidden below the frame until it
  // slides up. Rendered inside the full-card link where there is one, so the
  // panel can take the pointer — it needs to receive the wheel to scroll —
  // without swallowing the click that opens the site.
  const description = collectable.aiDescription ? (
    <div
      className={cn(
        "absolute left-0 top-0 z-30 aspect-square w-full overflow-hidden",
        "origin-center transition-transform duration-300 ease-out",
        "motion-reduce:transition-none",
      )}
      style={{
        transform:
          hoverRotation !== 0 ? `rotate(${hoverRotation}deg)` : undefined,
      }}
    >
      <div
        ref={descriptionRef}
        className={cn(
          // Stops short of the top so the type badge and the report button
          // stay clear of it; everything below reads through the frosting.
          "scrollbar-hide absolute inset-x-0 bottom-0 top-12 flex flex-col",
          "overflow-y-auto overscroll-contain",
          // The tint holds at 70% under the text and thins out over the last
          // third, so the panel dissolves into the artwork instead of ending
          // on an edge. The blur is even across the whole panel.
          "bg-gradient-to-t from-white/70 from-70% to-white/0 backdrop-blur",
          "transition-transform duration-300 ease-out",
          "motion-reduce:transition-none",
          isHovered ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* Pushed to the bottom, so a one-line description sits in the opaque
            part of the tint rather than floating in the faded top. */}
        <p className="mt-auto p-3 text-sm leading-snug text-neutral-700">
          {collectable.aiDescription}
        </p>
      </div>
    </div>
  ) : null;

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
          {collectable.ogImageUrl && !imageError ? (
            <Image
              src={collectable.ogImageUrl}
              alt={collectable.name}
              fill
              unoptimized
              className="object-contain p-16"
              onError={() => setImageError(true)}
            />
          ) : (
            <ImagePlaceholder name={collectable.name} />
          )}
        </div>

        {collectable.type && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 flex h-[22px] items-center rounded-full bg-foreground px-2 text-xs text-background">
            {collectable.type.charAt(0).toUpperCase() +
              collectable.type.slice(1)}
          </span>
        )}

        {collectable.tags && collectable.tags.length > 0 && (
          // Cleared on hover so the description slides into an empty frame
          // rather than cutting across the tag row.
          <div
            className={cn(
              "pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5",
              "transition-opacity duration-200 motion-reduce:transition-none",
              collectable.aiDescription && "group-hover:opacity-0",
            )}
          >
            {collectable.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-700"
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </span>
            ))}
          </div>
        )}
      </div>

      <h2 className="mt-3 text-center font-medium text-neutral-700">
        {collectable.name}
      </h2>

      {/* Covers the whole card — artwork and name are one click target. Sits
          above the media so it actually receives the click. */}
      {collectable.websiteUrl ? (
        <a
          href={collectable.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-20 cursor-none"
          aria-label={`Visit ${collectable.name}`}
        >
          {description}
        </a>
      ) : (
        description
      )}

      {/* Mirrors the frame's box and rotation so the button rides along with
          the tilt, while living outside the frame's z-0 stacking context —
          otherwise it would sit under the full-card link and be unclickable. */}
      {collectable.websiteUrl && (
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-0 z-30 aspect-square w-full",
            "origin-center transition-transform duration-300 ease-out",
            "motion-reduce:transition-none",
          )}
          style={{
            transform:
              hoverRotation !== 0 ? `rotate(${hoverRotation}deg)` : undefined,
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  "pointer-events-auto absolute right-3 top-3 flex h-[22px] w-[22px]",
                  "cursor-pointer items-center justify-center rounded-full",
                  "opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                  "text-neutral-400 hover:text-neutral-500",
                )}
                onClick={handleReportClick}
                disabled={reportMutation.isPending}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="sr-only">Report broken link.</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Report broken link.
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {collectable.websiteUrl && (
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
          Visit
        </span>
      )}
    </div>
  );
}
