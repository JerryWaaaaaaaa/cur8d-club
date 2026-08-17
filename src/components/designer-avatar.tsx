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

// Matches the report button's `h-[22px]` in the opposite corner, so the two
// controls on the cover read as one row rather than as two unrelated marks.
const SIZE_PX = 22;

/**
 * The designer, in the corner of their own work.
 *
 * Their X picture where the sync found one, otherwise the same initials-on-a-
 * colour treatment the empty cover uses, so a card without an avatar still
 * reads as a card rather than as a card with a hole in it.
 *
 * No ring around it: the cover is drawn inset, so the corner is the frame's
 * own flat background rather than whatever colour the screenshot happens to be
 * at that spot, and there is nothing left to separate the avatar from.
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
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      style={{
        height: SIZE_PX,
        width: SIZE_PX,
        ...(avatarUrl && !imageError ? {} : { backgroundColor }),
      }}
    >
      {avatarUrl && !imageError ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={SIZE_PX}
          height={SIZE_PX}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        // Two initials inside 22px, so the type ramps down with the circle and
        // tightens up rather than touching the edges.
        <span
          className="text-[9px] font-medium leading-none tracking-tight"
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
