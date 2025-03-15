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
          <span className="absolute left-2 top-2 z-10 flex h-[22px] items-center rounded-full bg-foreground px-2 text-xs text-background">
            {collectable.type.charAt(0).toUpperCase() +
              collectable.type.slice(1)}
          </span>
        )}

        {collectable.websiteUrl && (
          <div className="absolute right-2 top-2 z-10 flex items-center">
            <div
              className={cn(
                `flex h-[22px] cursor-pointer items-center overflow-hidden rounded-full`,
                `bg-neutral-200 transition-all duration-200 ease-out hover:bg-neutral-300`,
                "w-[22px] group-hover:w-[54px]",
              )}
            >
              <div className="flex w-[22px] flex-shrink-0 items-center justify-center">
                <Globe className="h-3.5 w-3.5 text-gray-600" />
              </div>
              <span className="whitespace-nowrap pl-0 text-xs text-gray-600">
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
            className="object-contain p-8"
            onError={() => setImageError(true)}
          />
        ) : (
          <ImagePlaceholder name={collectable.name} />
        )}
      </div>
      <div className="space-y-0">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{collectable.name}</h2>
        </div>
        {collectable.tags && (
          <div className="text-sm text-gray-600">
            {collectable.tags.join(", ")}
          </div>
        )}
      </div>
    </a>
  );
}
