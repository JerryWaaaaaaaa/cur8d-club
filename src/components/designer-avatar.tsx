"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  colorForName,
  initialsFor,
  inkForBackground,
} from "@/lib/name-visuals";

interface DesignerAvatarProps {
  name: string;
  avatarUrl: string | null;
  twitterHandle: string | null;
  className?: string;
}

/**
 * The designer, in the corner of their own work.
 *
 * Their X picture where the sync found one, otherwise the same initials-on-a-
 * colour treatment the empty cover uses, so a card without an avatar still
 * reads as a card rather than as a card with a hole in it. The ring is what
 * keeps either version legible over a screenshot, which can be any colour at
 * all right where the avatar sits.
 */
export function DesignerAvatar({
  name,
  avatarUrl,
  twitterHandle,
  className,
}: DesignerAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const backgroundColor = colorForName(name);

  const circle = (
    <span
      className={cn(
        "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full",
        "ring-2 ring-white/90",
        className,
      )}
      style={avatarUrl && !imageError ? undefined : { backgroundColor }}
    >
      {avatarUrl && !imageError ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={44}
          height={44}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span
          className="text-sm font-medium"
          style={{ color: inkForBackground(backgroundColor) }}
        >
          {initialsFor(name)}
        </span>
      )}
    </span>
  );

  // Rendered inside the card's pointer-events-none overlay, so the anchor has
  // to take the pointer back for itself. Without a handle there is nothing to
  // link to and the circle stays inert, letting the full-card link underneath
  // have the click.
  if (!twitterHandle) return circle;

  return (
    <a
      href={`https://x.com/${twitterHandle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="pointer-events-auto cursor-pointer rounded-full"
      onClick={(event) => event.stopPropagation()}
      aria-label={`${name} on X`}
    >
      {circle}
    </a>
  );
}
