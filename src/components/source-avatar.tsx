"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  colorForName,
  initialsFor,
  inkForBackground,
} from "@/lib/name-visuals";

interface SourceAvatarProps {
  /** The repository owner — "anthropics", "pbakaus". */
  author: string | null;
  /** The Blob mirror, when the import managed to make one. */
  avatarUrl: string | null;
  size?: number;
  className?: string;
}

/**
 * The face on a skill: whoever publishes the repository it comes from.
 *
 * Falls through the mirror to GitHub's own avatar endpoint before giving up on
 * initials. That second step is what lets the tab look right on a machine with
 * no Blob token — the import warns and moves on rather than failing, so in
 * development every `authorAvatarUrl` is null and a mirror-only chain would
 * draw sixty-five grey circles.
 */
export function SourceAvatar({
  author,
  avatarUrl,
  size = 22,
  className,
}: SourceAvatarProps) {
  const [failed, setFailed] = useState(false);

  const name = author ?? "?";
  const source =
    avatarUrl ?? (author ? `https://github.com/${author}.png` : null);
  const backgroundColor = colorForName(name);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      style={{
        height: size,
        width: size,
        ...(source && !failed ? {} : { backgroundColor }),
      }}
      title={author ?? undefined}
    >
      {source && !failed ? (
        <Image
          src={source}
          alt={name}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="text-[9px] font-medium leading-none tracking-tight"
          style={{ color: inkForBackground(backgroundColor) }}
        >
          {initialsFor(name)}
        </span>
      )}
    </span>
  );
}
