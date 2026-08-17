"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Highlight } from "@/components/highlight";
import { SourceAvatar } from "@/components/source-avatar";
import { CopyInstallButtons } from "@/components/copy-install-buttons";
import { accentForUseCase } from "@/lib/set-accents";
import { useSkillSetSelection } from "@/hooks/params-parsers/use-skill-set-filter-params";
import type { SkillSet } from "@/components/skill-set-grid";

/** Nine fills a 3×3 block; no set in the data comes close to needing the cap. */
const MAX_OWNERS = 9;
const AVATAR_PX = 52;
const AVATAR_GAP_PX = 14;

/** Ramps the frost in over its first 28px, so the panel has no hard top edge. */
const FROST_MASK = "linear-gradient(to bottom, transparent 0px, #000 28px)";

interface SkillSetCardProps {
  skillSet: SkillSet;
  terms: string[];
}

/**
 * A set, on the index.
 *
 * Built on the designer card's anatomy — square cover, chip at its top left,
 * pill at its bottom left, a panel that slides up over it on hover — so the
 * three grids read as one site.
 *
 * The cover is the part that needed inventing. A set has no artwork of its own,
 * and a square of nothing would look like a card whose image failed rather than
 * a card that never had one. So it is built from the thing the set does have:
 * the faces of the people whose repositories the skills come from, which is
 * both different for every set and a fair answer to "whose code is this".
 */
export function SkillSetCard({ skillSet, terms }: SkillSetCardProps) {
  const [, setSelection] = useSkillSetSelection();
  const [isHovered, setIsHovered] = useState(false);
  const accent = accentForUseCase(skillSet.useCase);

  // By owner, not by skill: three skills from anthropics are one face, not the
  // same picture three times.
  const owners: { author: string; avatarUrl: string | null }[] = [];
  for (const skill of skillSet.skills) {
    if (!skill.author) continue;
    if (owners.some((owner) => owner.author === skill.author)) continue;
    owners.push({ author: skill.author, avatarUrl: skill.authorAvatarUrl });
    if (owners.length === MAX_OWNERS) break;
  }

  // Square-ish rather than one long row: four owners read as a 2×2 block and
  // eight as 3/3/2. The width is what does the wrapping, because flex centres a
  // partial last row where grid would strand it against the left edge.
  const columns = Math.max(1, Math.ceil(Math.sqrt(owners.length)));
  const mosaicWidth = columns * AVATAR_PX + (columns - 1) * AVATAR_GAP_PX;

  return (
    <div
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative z-0 mb-3 aspect-square overflow-hidden"
        // A wash rather than the designer card's flat `bg-muted`, so the four
        // sets sharing a category still read as a family. Kept faint: the chip
        // is what states the colour, this only tints the room it sits in.
        style={{ backgroundColor: `${accent.fill}14` }}
      >
        <div className="flex h-full w-full items-center justify-center p-6">
          <div
            className="flex flex-wrap justify-center"
            style={{ width: mosaicWidth, gap: AVATAR_GAP_PX }}
          >
            {owners.map((owner) => (
              <SourceAvatar
                key={owner.author}
                author={owner.author}
                avatarUrl={owner.avatarUrl}
                size={AVATAR_PX}
              />
            ))}
          </div>
        </div>

        {/* Cleared on hover so the panel slides into an empty frame rather than
            up over the count, which is the designer card's move with its
            location pill. */}
        <span
          className={cn(
            "pointer-events-none absolute bottom-3 left-3 z-10 flex items-center",
            "rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-700",
            "transition-opacity duration-200 motion-reduce:transition-none",
            "group-hover:opacity-0",
          )}
        >
          {skillSet.skills.length} skills
        </span>
      </div>

      <div className="mt-3 flex flex-col items-center gap-1.5">
        <h2 className="text-center font-medium text-neutral-700">
          <Highlight text={skillSet.name} terms={terms} />
        </h2>

        {skillSet.description && (
          <p className="line-clamp-3 text-center text-sm leading-snug text-neutral-500">
            <Highlight text={skillSet.description} terms={terms} />
          </p>
        )}
      </div>

      {/* Covers the whole card, so the cover and the title are one target.
          Deliberately a sibling of the panel below rather than its parent: the
          copy controls are buttons too, and a button inside a button is invalid
          markup React will complain about at runtime. */}
      <button
        type="button"
        onClick={() => void setSelection({ set: skillSet.slug })}
        className="absolute inset-0 z-20 focus:outline-none"
        aria-label={`Open ${skillSet.name}`}
      />

      {/* Mirrors the cover's box and clips the panel, so it is parked out of
          sight below the frame until it slides up. */}
      <div className="pointer-events-none absolute left-0 top-0 z-30 aspect-square w-full overflow-hidden">
        <div
          className={cn(
            // Stops short of the top so the category chip stays clear of it,
            // matching the 22px chip row the designer card leaves alone.
            "absolute inset-x-0 bottom-0 top-12",
            "flex items-end p-4",
            "transition-transform duration-300 ease-out motion-reduce:transition-none",
            isHovered ? "translate-y-0" : "translate-y-full",
          )}
        >
          {/* Masked at the top so the frost fades in rather than starting on a
              hard line across the mosaic. The designer card solves the same
              problem with four offset blur layers, which is worth it for text
              that scrolls under them and overkill for two buttons. */}
          <div
            aria-hidden
            className="absolute inset-0 backdrop-blur-[6px]"
            style={{
              backgroundColor: "rgb(255 255 255 / 0.72)",
              maskImage: FROST_MASK,
              WebkitMaskImage: FROST_MASK,
            }}
          />

          {/* Only takes the pointer once it has arrived, so a card at rest
              passes clicks through to the full-card button underneath. */}
          <div
            className={cn(
              "relative w-full",
              isHovered ? "pointer-events-auto" : "pointer-events-none",
            )}
          >
            <CopyInstallButtons
              skills={skillSet.skills}
              promptIntro={skillSet.promptIntro}
              orientation="stacked"
            />
          </div>
        </div>
      </div>

      {/* Outside the cover's stacking context, so it stays above both the
          full-card button and the panel. */}
      {skillSet.useCase && (
        <div className="pointer-events-none absolute left-0 top-0 z-40 aspect-square w-full">
          <span
            className="absolute left-3 top-3 flex h-[22px] items-center rounded-full px-2 text-xs"
            style={{ backgroundColor: accent.fill, color: accent.ink }}
          >
            {skillSet.useCase}
          </span>
        </div>
      )}
    </div>
  );
}
