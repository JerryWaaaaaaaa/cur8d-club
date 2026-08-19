"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Highlight } from "@/components/highlight";
import { SourceAvatar } from "@/components/source-avatar";
import { CopyInstallButtons } from "@/components/copy-install-buttons";
import { accentForUseCase } from "@/lib/set-accents";
import { useSkillSetSelection } from "@/hooks/params-parsers/use-skill-set-filter-params";
import type { SkillSet } from "@/components/skill-set-grid";

/** Three circles read as a stack; a fourth starts crowding the label. */
const STACK_FACES = 3;

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
 * something small at its bottom left, a panel that slides up over it on hover —
 * so the three grids read as one site.
 *
 * The cover holds the set's own name and description. Three earlier versions
 * put artwork there instead — colour sampled from the owners' avatars, then
 * those avatars tiled, then the list of skill names — while the name and
 * description sat underneath in the designer card's caption slot. The words
 * were always the thing worth showing; the cover was inventing a picture to
 * avoid saying them.
 *
 * Everything is on one left edge: the chip's fill, the text, and the stack of
 * owner avatars in the corner, which says whose repositories a set draws on
 * without listing nine of them. The count beside it is the whole inventory the
 * card needs to give — the detail view is one click away and lists every skill.
 */
export function SkillSetCard({ skillSet, terms }: SkillSetCardProps) {
  const [, setSelection] = useSkillSetSelection();
  const [isHovered, setIsHovered] = useState(false);
  const accent = accentForUseCase(skillSet.useCase);

  // By owner, not by skill: a set drawing three skills from anthropics shows
  // one face, not the same face three times.
  const faces = useMemo(() => {
    const seen: { author: string; avatarUrl: string | null }[] = [];

    for (const skill of skillSet.skills) {
      if (!skill.author) continue;
      if (seen.some((owner) => owner.author === skill.author)) continue;
      seen.push({ author: skill.author, avatarUrl: skill.authorAvatarUrl });
      if (seen.length === STACK_FACES) break;
    }

    return seen;
  }, [skillSet.skills]);

  return (
    <div
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* The designer card's own neutral, so the three grids share a frame. */}
      <div className="relative z-0 aspect-square overflow-hidden bg-muted">
        {/* Inset to clear the chip above and the avatar stack below, and
            padded to `px-3` so the text starts on the same left edge as both
            of them rather than on a third one of its own. */}
        <div className="absolute inset-0 flex flex-col justify-center px-3 pb-14 pt-12">
          <h2 className="font-medium text-neutral-800">
            <Highlight text={skillSet.name} terms={terms} />
          </h2>

          {skillSet.description && (
            <p className="mt-1.5 line-clamp-5 text-sm leading-snug text-neutral-500">
              <Highlight text={skillSet.description} terms={terms} />
            </p>
          )}
        </div>

        {/* Cleared on hover so the panel slides into an empty frame rather than
            up over the count, which is the designer card's move with its
            location pill. */}
        <div
          className={cn(
            "pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2",
            "transition-opacity duration-200 motion-reduce:transition-none",
            "group-hover:opacity-0",
          )}
        >
          {faces.length > 0 && (
            // Ringed in the cover's own colour rather than in white, so the
            // overlap reads as each circle cut out of the surface. White is
            // the usual idiom and is nearly invisible against this grey.
            <div className="flex -space-x-2">
              {faces.map((owner) => (
                <SourceAvatar
                  key={owner.author}
                  author={owner.author}
                  avatarUrl={owner.avatarUrl}
                  size={22}
                  className="ring-2 ring-muted"
                />
              ))}
            </div>
          )}

          <span className="text-xs font-medium text-neutral-700">
            {skillSet.skills.length} skills
          </span>
        </div>
      </div>

      {/* Covers the whole card. Deliberately a sibling of the panel below
          rather than its parent: the copy controls are buttons too, and a
          button inside a button is invalid markup React will complain about at
          runtime. */}
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
            // Starts at half height so the set's name stays sharp underneath
            // it. The name is the card's only identifying text now that
            // nothing sits below the cover, and a full-height panel blurred it
            // away entirely. Measured across all twenty sets, the lowest title
            // ends 131px into a 290px cover, so half clears every one of them
            // by 14px — and both the text block and this panel are positioned
            // as fractions of the cover, so that margin holds at every size.
            "absolute inset-x-0 bottom-0 top-1/2",
            "flex items-end p-4",
            "transition-transform duration-300 ease-out motion-reduce:transition-none",
            isHovered ? "translate-y-0" : "translate-y-full",
          )}
        >
          {/* Masked at the top so the frost fades in rather than starting on a
              hard line across the text. The designer card solves the same
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
