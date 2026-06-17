"use client";

import Image from "next/image";
import { Globe } from "@phosphor-icons/react";
import { HelpCircle } from "lucide-react";
import { type api as serverApi } from "@/trpc/server";
import { api } from "@/trpc/react";
import { ImagePlaceholder } from "./image-placeholder";
import { useState } from "react";
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seed =
      HOVER_ROTATION_SEEDS[
        Math.floor(Math.random() * HOVER_ROTATION_SEEDS.length)
      ]!;
    setHoverRotation(seed);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoverRotation(0);
  };

  return (
    <div
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
        {collectable.websiteUrl && (
          <a
            href={collectable.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-0"
            aria-label={`Visit ${collectable.name}`}
          />
        )}

        {collectable.type && (
          <span className="absolute left-3 top-3 z-10 flex h-[22px] items-center rounded-full bg-foreground px-2 text-xs text-background">
            {collectable.type.charAt(0).toUpperCase() +
              collectable.type.slice(1)}
          </span>
        )}

        {collectable.websiteUrl && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
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
            <a
              href={collectable.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex h-[22px] cursor-pointer items-center overflow-hidden rounded-full",
                "bg-neutral-200 transition-all duration-200 ease-out hover:bg-neutral-300",
                "w-[22px] group-hover:w-[54px]",
              )}
            >
              <div className="flex w-[22px] flex-shrink-0 items-center justify-center">
                <Globe className="h-3.5 w-3.5 text-neutral-700" />
              </div>
              <span className="whitespace-nowrap pl-0 text-xs text-neutral-700">
                Visit
              </span>
              <span className="sr-only">Visit</span>
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

        {collectable.tags && collectable.tags.length > 0 && (
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
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

      {collectable.websiteUrl ? (
        <a
          href={collectable.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block cursor-pointer"
        >
          <h2 className="mt-3 text-center font-medium text-neutral-700">
            {collectable.name}
          </h2>
        </a>
      ) : (
        <h2 className="mt-3 text-center font-medium text-neutral-700">
          {collectable.name}
        </h2>
      )}
    </div>
  );
}
