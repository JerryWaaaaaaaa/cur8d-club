"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Highlight } from "@/components/highlight";
import { CopyInstallButtons } from "@/components/copy-install-buttons";
import { accentForUseCase } from "@/lib/set-accents";
import { MOSAIC_SIZE, buildMosaic } from "@/lib/avatar-mosaic";
import { useAvatarPalettes } from "@/hooks/use-avatar-palettes";
import { useSkillSetSelection } from "@/hooks/params-parsers/use-skill-set-filter-params";
import type { SkillSet } from "@/components/skill-set-grid";

/** Nine owners is already more variety than 64 tiles can show apart. */
const MAX_OWNERS = 9;

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
 * the avatars of the people whose repositories the skills come from — not shown
 * as faces, but read down to their colours and rewoven as a 64-tile mosaic.
 * Different for every set, and still a fair answer to "whose code is this".
 */
export function SkillSetCard({ skillSet, terms }: SkillSetCardProps) {
  const [, setSelection] = useSkillSetSelection();
  const [isHovered, setIsHovered] = useState(false);
  const accent = accentForUseCase(skillSet.useCase);

  // By owner, not by skill: three skills from anthropics contribute one
  // palette, not the same sixteen colours three times over.
  const owners = useMemo(() => {
    const seen: { author: string; avatarUrl: string | null }[] = [];

    for (const skill of skillSet.skills) {
      if (!skill.author) continue;
      if (seen.some((owner) => owner.author === skill.author)) continue;
      seen.push({ author: skill.author, avatarUrl: skill.authorAvatarUrl });
      if (seen.length === MAX_OWNERS) break;
    }

    return seen;
  }, [skillSet.skills]);

  const palettes = useAvatarPalettes(owners);
  const tiles = useMemo(() => buildMosaic(palettes), [palettes]);

  return (
    <div
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* The designer card's own neutral, so the three grids share a frame. */}
      <div className="relative z-0 mb-3 aspect-square overflow-hidden bg-muted">
        {/* Inset the way the designer card insets artwork, so the neutral reads
            as a border rather than as a gap the mosaic failed to fill. */}
        <div className="flex h-full w-full items-center justify-center p-9">
          {tiles.length > 0 && (
            <svg
              viewBox={`0 0 ${MOSAIC_SIZE} ${MOSAIC_SIZE}`}
              className="h-full w-full"
              // Rects on integer coordinates, so tiles meet exactly. Div
              // backgrounds would leave hairline seams wherever a tile edge
              // fell on a fractional pixel, which is the one thing "no gaps"
              // rules out.
              shapeRendering="crispEdges"
              aria-hidden
            >
              {tiles.map((color, index) => (
                <rect
                  key={index}
                  x={index % MOSAIC_SIZE}
                  y={Math.floor(index / MOSAIC_SIZE)}
                  width={1}
                  height={1}
                  fill={color}
                />
              ))}
            </svg>
          )}
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
