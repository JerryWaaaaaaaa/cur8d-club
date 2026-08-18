"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Highlight } from "@/components/highlight";
import { SourceAvatar } from "@/components/source-avatar";
import { CopyInstallButtons } from "@/components/copy-install-buttons";
import { accentForUseCase } from "@/lib/set-accents";
import { useSkillSetSelection } from "@/hooks/params-parsers/use-skill-set-filter-params";
import type { SkillSet } from "@/components/skill-set-grid";

/**
 * What the cover fits at its tightest — a 290px square at the four-column
 * breakpoint, measured with 12px to spare. Every set today holds eight or nine
 * skills, so this hides nothing; it is here so a longer set added later
 * summarises its tail rather than having a row sliced in half by the clip.
 */
const MAX_ROWS = 9;

/** Clears the avatar and its gap, so the summary lines up with the names. */
const ROW_TEXT_INSET = 26;

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
 * The cover is the contents. A designer card shows the work; a set's work is
 * the skills it collects, so the cover lists them: each one's owner and its
 * name, in the order the detail view will show them. Two earlier attempts made
 * artwork out of the owners' avatars instead, first as sampled colour and then
 * as the avatars themselves tiled across a grid, and both were decoration that
 * told you nothing — the name of a set says what it is for, but only the list
 * says what you are actually installing.
 *
 * Every set holds eight or nine skills, which is few enough to show whole. The
 * list is clipped rather than scrolled: the card is one click target, and a
 * scrollable region inside it would swallow the page's scroll on touch.
 */
export function SkillSetCard({ skillSet, terms }: SkillSetCardProps) {
  const [, setSelection] = useSkillSetSelection();
  const [isHovered, setIsHovered] = useState(false);
  const accent = accentForUseCase(skillSet.useCase);

  const overflows = skillSet.skills.length > MAX_ROWS;
  // One row short of the cap when it overflows, since the summary needs a row
  // of its own to sit in.
  const shown = overflows
    ? skillSet.skills.slice(0, MAX_ROWS - 1)
    : skillSet.skills;
  const hidden = skillSet.skills.length - shown.length;

  return (
    <div
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* The designer card's own neutral, so the three grids share a frame. */}
      <div className="relative z-0 mb-3 aspect-square overflow-hidden bg-muted">
        {/* Inset to clear the chip above and the count pill below, so the list
            occupies the frame without either of them landing on a row, and
            centred in what is left the way the designer card centres artwork —
            a one-column cover is much taller than nine rows need. Centring is
            only safe because MAX_ROWS keeps the list shorter than the frame:
            content that overflowed would spill past both ends instead of one. */}
        <ul className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-center gap-1 overflow-hidden px-3 pb-10 pt-11">
          {shown.map((skill) => (
            <li key={skill.id} className="flex items-center gap-2">
              <SourceAvatar
                author={skill.author}
                avatarUrl={skill.authorAvatarUrl}
                size={18}
              />
              {/* `min-w-0` is what lets a long name truncate: a flex child
                  refuses to shrink below its content width without it, and the
                  row would push its own avatar out of the frame instead. */}
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-700">
                <Highlight text={skill.name} terms={terms} />
              </span>
            </li>
          ))}

          {hidden > 0 && (
            <li
              className="text-xs text-neutral-500"
              style={{ paddingLeft: ROW_TEXT_INSET }}
            >
              +{hidden} more
            </li>
          )}
        </ul>

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
              hard line across the list. The designer card solves the same
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
