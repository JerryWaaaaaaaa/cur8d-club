"use client";

import type React from "react";

import Image from "next/image";
import { Globe } from "@phosphor-icons/react";
import { type api as serverApi } from "@/trpc/server";
import { ImagePlaceholder } from "./image-placeholder";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Collectable = Awaited<
  ReturnType<(typeof serverApi)["collectable"]["getInfiniteScroll"]>
>["items"][number];

interface CollectableCardProps {
  collectable: Collectable;
}

export function CollectableCard({ collectable }: CollectableCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={collectable.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block cursor-pointer"
    >
      <div className="relative mb-3 aspect-square overflow-hidden bg-muted">
        {/* Collectable type */}
        {collectable.type && (
          <span className="absolute left-3 top-3 z-10 flex h-[22px] items-center rounded-full bg-foreground px-2 text-xs text-background">
            {collectable.type.charAt(0).toUpperCase() +
              collectable.type.slice(1)}
          </span>
        )}

        {collectable.websiteUrl && (
          <div className="absolute right-3 top-3 z-10 flex items-center">
            <div
              className={cn(
                `flex h-[22px] cursor-pointer items-center overflow-hidden rounded-full`,
                `bg-neutral-200 transition-all duration-200 ease-out hover:bg-neutral-300`,
                "w-[22px] group-hover:w-[54px]",
              )}
            >
              <div className="flex w-[22px] flex-shrink-0 items-center justify-center">
                <Globe className="h-3.5 w-3.5 text-gray-700" />
              </div>
              <span className="whitespace-nowrap pl-0 text-xs text-gray-700">
                Visit
              </span>
              <span className="sr-only">Visit</span>
            </div>
          </div>
        )}
        
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
        {/* Expertise/tags as chips in bottom left of card */}
        {collectable.tags && collectable.tags.length > 0 && (
          <div className="absolute left-3 bottom-3 z-10 flex flex-wrap gap-1.5">
            {collectable.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-700"
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-0">
        <div className="flex items-center justify-center">
          <h2 className="mt-3 font-medium text-center text-gray-700">{collectable.name}</h2>
        </div>
      </div>
    </a>
  );
}
