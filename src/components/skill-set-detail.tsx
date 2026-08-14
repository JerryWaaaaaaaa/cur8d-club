"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { motion } from "motion/react";

import { Highlight } from "@/components/highlight";
import { SkillRow } from "@/components/skill-row";
import { CopyInstallButtons } from "@/components/copy-install-buttons";
import { accentForUseCase } from "@/lib/set-accents";
import { useSkillSetSelection } from "@/hooks/params-parsers/use-skill-set-filter-params";
import type { SkillSet } from "@/components/skill-set-grid";

interface SkillSetDetailProps {
  skillSet: SkillSet;
  terms: string[];
}

/**
 * One set, opened.
 *
 * Still the same page and the same param — `?set=` — rather than a route of
 * its own, which keeps it shareable without introducing the app's first path
 * segment. What it adds over the card is the membership, so you can see what
 * the prompt will install before you paste it somewhere that runs commands.
 */
export function SkillSetDetail({ skillSet, terms }: SkillSetDetailProps) {
  const [, setSelection] = useSkillSetSelection();
  const accent = accentForUseCase(skillSet.useCase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      // Left-aligned rather than centred: the nav above is aligned to the
      // container, and a centred column would start a third of the way across
      // the page from the tab you just pressed. The width cap is only there to
      // keep the rows a readable measure.
      className="max-w-2xl"
    >
      <button
        type="button"
        onClick={() => void setSelection({ set: null })}
        className="flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" />
        All sets
      </button>

      <div className="mt-8">
        {skillSet.useCase && (
          <span
            className="flex h-[22px] w-fit items-center rounded-full px-2 text-xs"
            style={{ backgroundColor: accent.fill, color: accent.ink }}
          >
            {skillSet.useCase}
          </span>
        )}

        <h1 className="mt-3 text-2xl text-neutral-900">
          <Highlight text={skillSet.name} terms={terms} />
        </h1>

        {skillSet.description && (
          <p className="mt-2 text-sm text-neutral-500">
            <Highlight text={skillSet.description} terms={terms} />
          </p>
        )}
      </div>

      <CopyInstallButtons
        skills={skillSet.skills}
        promptIntro={skillSet.promptIntro}
        className="mt-6"
      />

      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm text-neutral-900">
            {skillSet.skills.length} skills
          </h2>
          {skillSet.submitterHandle && (
            <span className="text-xs text-neutral-500">
              submitted by{" "}
              <a
                href={`https://github.com/${skillSet.submitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                @{skillSet.submitterHandle}
              </a>
            </span>
          )}
        </div>

        <div className="mt-2">
          {skillSet.skills.map((skill) => (
            <SkillRow key={skill.id} skill={skill} terms={terms} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
