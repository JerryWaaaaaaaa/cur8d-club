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

// A single blurred layer would start abruptly at whatever line it was masked
// to. These stack instead: each one blurs the result of the one beneath it,
// and their bands are offset so the blur accumulates gradually — untouched at
// the panel's top edge, fully frosted by the time the text begins.
const DESCRIPTION_BLUR_LAYERS = [
  { blur: 1, stops: "transparent 0%, #000 14%, #000 28%, transparent 42%" },
  { blur: 2, stops: "transparent 14%, #000 28%, #000 42%, transparent 56%" },
  { blur: 4, stops: "transparent 28%, #000 42%, #000 56%, transparent 70%" },
  { blur: 8, stops: "transparent 42%, #000 56%, #000 100%" },
] as const;

export function CollectableCard({ collectable }: CollectableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
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
  };

  const handleMouseLeave = () => {
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

    // Layout offsets rather than getBoundingClientRect, to stay in the same
    // coordinate space as the pointer position measured above.
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

  // Mirrors the frame's box and clips the panel, so it is out of sight below
  // the frame until it slides up. Rendered inside the full-card link where
  // there is one, so the panel can take the pointer — it needs to receive the
  // wheel to scroll — without swallowing the click that opens the site.
  const description = collectable.aiDescription ? (
    <div className="absolute left-0 top-0 z-30 aspect-square w-full overflow-hidden">
      <div
        className={cn(
          // Stops short of the top so the type badge and the report button
          // stay clear of it.
          "absolute inset-x-0 bottom-0 top-12",
          "transition-transform duration-300 ease-out",
          "motion-reduce:transition-none",
          isHovered ? "translate-y-0" : "translate-y-full",
        )}
      >
        {DESCRIPTION_BLUR_LAYERS.map(({ blur, stops }) => {
          const mask = `linear-gradient(to bottom, ${stops})`;
          return (
            <div
              key={blur}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                maskImage: mask,
                WebkitMaskImage: mask,
              }}
            />
          );
        })}

        {/* Rises with the blur rather than against it: nothing at the top,
            holding at 70% from halfway down, where the text sits. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            "bg-gradient-to-t from-white/70 from-50% to-white/0",
          )}
        />

        {/* Kept to the frosted half so no line is ever read against the sharp
            artwork. mt-auto holds a one-line description at the bottom. */}
        <div
          ref={descriptionRef}
          className={cn(
            "scrollbar-hide absolute inset-x-0 bottom-0 flex h-1/2 flex-col",
            "overflow-y-auto overscroll-contain",
          )}
        >
          <p className="mt-auto p-5 text-sm leading-snug text-neutral-700">
            {collectable.aiDescription}
          </p>
        </div>
      </div>
    </div>
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
      <div
        ref={coverRef}
        className="relative z-0 mb-3 aspect-square overflow-hidden bg-muted"
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

      {/* Mirrors the frame's box while living outside the frame's z-0 stacking
          context — otherwise the button would sit under the full-card link and
          the description panel, and be unclickable. */}
      {collectable.websiteUrl && (
        <div className="pointer-events-none absolute left-0 top-0 z-30 aspect-square w-full">
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
