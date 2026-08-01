"use client";

import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import { HelpCircle } from "lucide-react";
import { type api as serverApi } from "@/trpc/server";
import { api } from "@/trpc/react";
import { ImagePlaceholder } from "./image-placeholder";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
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
  const badgeRef = useRef<HTMLSpanElement>(null);
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

  const handleMouseEnter = () => {
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
  // move, and re-rendering the card that often is wasteful.
  const handleMouseMove = (event: React.MouseEvent) => {
    const container = containerRef.current;
    const badge = badgeRef.current;
    if (!container || !badge) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    badge.style.transform = `translate3d(${x + 14}px, ${y + 14}px, 0)`;
  };

  return (
    <div
      ref={containerRef}
      // Lifted while hovered so the tilted frame and the cursor badge, which
      // both spill past the card's bounds, aren't painted over by the
      // neighbouring card.
      className={cn("group relative block", isHovered && "z-30")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div
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
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
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
      {collectable.websiteUrl && (
        <a
          href={collectable.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-20"
          aria-label={`Visit ${collectable.name}`}
        />
      )}

      {/* Above the overlay so reporting stays clickable. */}
      {collectable.websiteUrl && (
        <div className="absolute right-3 top-3 z-30">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-[22px] w-[22px] items-center justify-center rounded-full",
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
            "transition-opacity duration-200",
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
