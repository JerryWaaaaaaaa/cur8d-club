"use client";

import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import { HelpCircle, MapPin } from "lucide-react";
import { type api as serverApi } from "@/trpc/server";
import { api } from "@/trpc/react";
import { ImagePlaceholder } from "./image-placeholder";
import { DesignerAvatar } from "./designer-avatar";
import { DescriptionPanel } from "./description-panel";
import { Highlight } from "./highlight";
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
  /**
   * The active search terms, marked wherever they appear. Only the columns the
   * router actually searches are marked — the location pill and the type badge
   * are left alone, since a query never matches on either and highlighting
   * them would claim a match that didn't happen.
   */
  terms: string[];
}

export function CollectableCard({ collectable, terms }: CollectableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  // Two flags rather than one: a screenshot that fails to load should fall
  // through to the OG image, not all the way past it to the initials tile.
  const [screenshotError, setScreenshotError] = useState(false);
  const [ogImageError, setOgImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Joined with a middot rather than "at", which reads badly against the
  // freelancers whose company is their own arrangement. Either half can be
  // missing, and a site that gives neither leaves the line off entirely. A
  // studio is its own employer, so a company echoing the name is dropped
  // rather than printed twice.
  const company =
    collectable.company?.toLowerCase() === collectable.name.toLowerCase()
      ? null
      : collectable.company;

  const roleLine = [collectable.title, company].filter(Boolean).join(" · ");

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
  //
  // The panel stops short of the frame's top so the avatar, the type badge and
  // the report button stay clear of it. All three are the same 22px tall, so
  // one measurement covers the row.
  const description = collectable.aiDescription ? (
    <DescriptionPanel
      text={collectable.aiDescription}
      terms={terms}
      isHovered={isHovered}
      panelClassName="top-12"
      className="aspect-square"
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
      <div
        ref={coverRef}
        className="relative z-0 mb-3 aspect-square overflow-hidden bg-muted"
      >
        {/* The designer's own site, then whatever artwork they published for
            sharing, then their initials. The first two are drawn the same way —
            inset, with the frame showing around them — on a 36px inset, tighter
            than the case study grid's, so the artwork carries the tile and the
            frame reads as a border. They stay separate branches only so a
            screenshot that fails to load falls through to the OG image rather
            than past it to the initials tile. */}
        {collectable.screenshotUrl && !screenshotError ? (
          <Image
            src={collectable.screenshotUrl}
            alt={collectable.name}
            fill
            unoptimized
            className="object-contain p-9"
            onError={() => setScreenshotError(true)}
          />
        ) : collectable.ogImageUrl && !ogImageError ? (
          <Image
            src={collectable.ogImageUrl}
            alt={collectable.name}
            fill
            unoptimized
            className="object-contain p-9"
            onError={() => setOgImageError(true)}
          />
        ) : (
          <ImagePlaceholder name={collectable.name} />
        )}

        {collectable.location && (
          // Cleared on hover so the description slides into an empty frame
          // rather than up over the location.
          <span
            className={cn(
              "pointer-events-none absolute bottom-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)]",
              "items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs",
              "font-medium text-neutral-700",
              "transition-opacity duration-200 motion-reduce:transition-none",
              collectable.aiDescription && "group-hover:opacity-0",
            )}
          >
            <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
            <span className="truncate">{collectable.location}</span>
          </span>
        )}
      </div>

      {/* The description is missing from this column on purpose: it now lives
          in the panel that slides up over the frame on hover. */}
      <div className="mt-3 flex flex-col items-center gap-1.5">
        <h2 className="text-center font-medium text-neutral-700">
          <Highlight text={collectable.name} terms={terms} />
        </h2>

        {roleLine && (
          <p className="text-center text-sm leading-snug text-neutral-500">
            <Highlight text={roleLine} terms={terms} />
          </p>
        )}

        {collectable.tags && collectable.tags.length > 0 && (
          // The extra margin buys back the tint's own padding. Measured to the
          // text, the gap above the tags already matches the one above the
          // role line, but the pill's fill starts before its text does, so the
          // eye reads the row as sitting closer than it is.
          <div className="mt-1 flex flex-wrap justify-center gap-1.5">
            {collectable.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600"
              >
                <Highlight
                  text={tag.charAt(0).toUpperCase() + tag.slice(1)}
                  terms={terms}
                />
              </span>
            ))}
          </div>
        )}
      </div>

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
          context — otherwise everything in here would sit under the full-card
          link and the description panel, and the avatar and the report button
          would both be unclickable.

          The type badge rides along rather than staying inside the frame: it
          now shares a line with the avatar, and coordinating their positions
          across two stacking contexts is how they end up overlapping. */}
      <div className="pointer-events-none absolute left-0 top-0 z-30 aspect-square w-full">
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <DesignerAvatar
            name={collectable.name}
            avatarUrl={collectable.avatarUrl}
            twitterHandle={collectable.twitterHandle}
          />

          {collectable.type && (
            <span className="flex h-[22px] items-center rounded-full bg-foreground px-2 text-xs text-background">
              {collectable.type.charAt(0).toUpperCase() +
                collectable.type.slice(1)}
            </span>
          )}
        </div>

        {collectable.websiteUrl && (
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
        )}
      </div>

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
