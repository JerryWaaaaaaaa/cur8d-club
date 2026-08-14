"use client";

import { Check, Copy } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
  buildInstallText,
  type InstallableSkill,
} from "@/lib/skill-install-text";

interface CopyInstallButtonsProps {
  skills: InstallableSkill[];
  promptIntro?: string | null;
  /** The card only offers the prompt; the set view offers both. */
  variant?: "both" | "prompt-only";
  className?: string;
}

/**
 * The two ways to take a set away with you.
 *
 * A terminal wants the bare commands and an agent wants to be told what it is
 * installing, so these are two different strings rather than one string with a
 * button beside it. The labels name the destination instead of the format,
 * because "prompt" and "command" only mean something once you already know the
 * difference — and the toast repeats the destination, since the text itself is
 * never shown on the page.
 */
export function CopyInstallButtons({
  skills,
  promptIntro,
  variant = "both",
  className,
}: CopyInstallButtonsProps) {
  const prompt = useCopyToClipboard();
  const command = useCopyToClipboard();

  const promptText = buildInstallText({
    skills,
    format: "agent",
    intro: promptIntro,
  });
  const commandText = buildInstallText({ skills, format: "cli" });

  const base =
    "flex h-9 items-center gap-2 rounded-full px-4 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={cn("flex flex-wrap items-start gap-2", className)}>
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          disabled={promptText === ""}
          onClick={(event) => {
            // Card-level copy sits inside the link that opens the set.
            event.preventDefault();
            event.stopPropagation();
            void prompt.copy(
              promptText,
              "Prompt copied — paste it into your agent",
            );
          }}
          className={cn(base, "bg-foreground text-background hover:bg-black")}
        >
          {prompt.copied ? (
            <Check weight="bold" className="h-4 w-4" />
          ) : (
            <Copy weight="regular" className="h-4 w-4" />
          )}
          {prompt.copied ? "Copied" : "Copy prompt"}
        </button>
        {variant === "both" && (
          <span className="text-xs text-neutral-500">for your agent</span>
        )}
      </div>

      {variant === "both" && (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            disabled={commandText === ""}
            onClick={() =>
              void command.copy(
                commandText,
                "Command copied — paste it into your terminal",
              )
            }
            className={cn(
              base,
              "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
            )}
          >
            {command.copied ? (
              <Check weight="bold" className="h-4 w-4" />
            ) : (
              <Copy weight="regular" className="h-4 w-4" />
            )}
            {command.copied ? "Copied" : "Copy command"}
          </button>
          <span className="text-xs text-neutral-500">for your terminal</span>
        </div>
      )}
    </div>
  );
}
