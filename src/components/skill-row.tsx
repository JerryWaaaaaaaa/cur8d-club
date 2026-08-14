"use client";

import { ArrowUpRight, Check, Copy } from "@phosphor-icons/react";

import { Highlight } from "@/components/highlight";
import { SourceAvatar } from "@/components/source-avatar";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
  buildInstallText,
  skillHref,
  type InstallableSkill,
} from "@/lib/skill-install-text";

export interface SkillRowSkill extends InstallableSkill {
  id: string;
  kind: string | null;
  author: string | null;
  authorAvatarUrl: string | null;
}

interface SkillRowProps {
  skill: SkillRowSkill;
  terms: string[];
}

/**
 * One skill inside a set.
 *
 * A row rather than a card, because a skill has no image and nine of them in a
 * grid would be nine boxes of text pretending to be artwork. The row is also
 * the only place the domain/universal split shows, and only the universal side
 * is marked: a set is about its domain skills, so seven of nine rows carrying
 * a "Domain" chip would be labelling the default. An unmarked row reads as
 * what you came for, which is right.
 */
export function SkillRow({ skill, terms }: SkillRowProps) {
  const { copy, copied } = useCopyToClipboard();
  const href = skillHref(skill);

  return (
    <div className="group flex items-center gap-3 border-b border-neutral-100 py-3 last:border-b-0">
      <SourceAvatar author={skill.author} avatarUrl={skill.authorAvatarUrl} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-900">
            <Highlight text={skill.name} terms={terms} />
          </span>
          {skill.kind === "universal" && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
              Universal
            </span>
          )}
        </div>
        {skill.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
            {skill.description}
          </p>
        )}
      </div>

      {skill.sourceRepo && (
        <span className="hidden shrink-0 text-xs text-neutral-400 sm:block">
          <Highlight text={skill.sourceRepo} terms={terms} />
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() =>
            void copy(
              buildInstallText({ skills: [skill], format: "cli" }),
              `Command for ${skill.name} copied`,
            )
          }
          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          aria-label={`Copy the install command for ${skill.name}`}
        >
          {copied ? (
            <Check weight="bold" className="h-3.5 w-3.5" />
          ) : (
            <Copy weight="regular" className="h-3.5 w-3.5" />
          )}
        </button>

        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={`${skill.name} on GitHub`}
          >
            <ArrowUpRight weight="bold" className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
