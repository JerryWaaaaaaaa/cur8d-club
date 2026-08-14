"use client";

import { Highlight } from "@/components/highlight";
import { SourceAvatar } from "@/components/source-avatar";
import { CopyInstallButtons } from "@/components/copy-install-buttons";
import { accentForUseCase } from "@/lib/set-accents";
import { useSkillSetSelection } from "@/hooks/params-parsers/use-skill-set-filter-params";
import type { SkillSet } from "@/components/skill-set-grid";

/** How many faces the stack shows before it starts counting instead. */
const MAX_AVATARS = 4;

interface SkillSetCardProps {
  skillSet: SkillSet;
  terms: string[];
}

/**
 * A set, on the index.
 *
 * There is no cover image, and not for want of trying: a skill has no artwork,
 * and a grid of image cards with nothing in them reads as broken rather than
 * as restrained. The category badge and the rule above it carry the card
 * instead, which also makes the colour the thing you scan for.
 *
 * The copy button is on the card because most visits end here — you know which
 * set you want, and opening it only to press the same button is a step for
 * nothing. Opening it is for when you want to see what is inside first.
 */
export function SkillSetCard({ skillSet, terms }: SkillSetCardProps) {
  const [, setSelection] = useSkillSetSelection();
  const accent = accentForUseCase(skillSet.useCase);

  const owners = [...new Set(skillSet.skills.map((skill) => skill.author))]
    .filter((author): author is string => !!author)
    .slice(0, MAX_AVATARS);

  return (
    // Full height, so the footer below can be pushed to the bottom of the grid
    // cell rather than sitting wherever a two- or three-line description
    // happens to end — otherwise the avatars and copy buttons stagger across a
    // row.
    <div className="group relative flex h-full flex-col">
      {/* The accent, readable before the badge below it is. */}
      <span
        aria-hidden
        className="h-0.5 w-full rounded-full"
        style={{ backgroundColor: accent.fill }}
      />

      <button
        type="button"
        onClick={() => void setSelection({ set: skillSet.slug })}
        className="flex flex-1 flex-col items-start pt-4 text-left focus:outline-none"
        aria-label={`Open ${skillSet.name}`}
      >
        {skillSet.useCase && (
          <span
            className="flex h-[22px] items-center rounded-full px-2 text-xs"
            style={{ backgroundColor: accent.fill, color: accent.ink }}
          >
            {skillSet.useCase}
          </span>
        )}

        <h3 className="mt-3 text-base text-neutral-900">
          <Highlight text={skillSet.name} terms={terms} />
        </h3>

        {skillSet.description && (
          <p className="mt-1 line-clamp-3 text-sm text-neutral-500">
            <Highlight text={skillSet.description} terms={terms} />
          </p>
        )}
      </button>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="flex items-center gap-2">
          {/* Overlapped, so a set drawn from six repos still fits the row. */}
          <div className="flex -space-x-1.5">
            {owners.map((owner) => (
              <SourceAvatar
                key={owner}
                author={owner}
                avatarUrl={
                  skillSet.skills.find((skill) => skill.author === owner)
                    ?.authorAvatarUrl ?? null
                }
                size={20}
                className="ring-2 ring-background"
              />
            ))}
          </div>
          <span className="text-xs text-neutral-500">
            {skillSet.skills.length} skills
          </span>
        </div>

        <CopyInstallButtons
          skills={skillSet.skills}
          promptIntro={skillSet.promptIntro}
          variant="prompt-only"
        />
      </div>
    </div>
  );
}
