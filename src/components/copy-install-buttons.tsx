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
  /**
   * "row" is the set view: buttons side by side, each captioned with where its
   * text is meant to go. "stacked" is the card's hover panel, which has room
   * for neither the second column nor the captions — the labels already
   * differ, and the toast still names the destination.
   */
  orientation?: "row" | "stacked";
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
  orientation = "row",
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

  const stacked = orientation === "stacked";

  const base = cn(
    "flex h-9 items-center gap-2 rounded-full text-sm transition-colors",
    "focus:outline-none disabled:cursor-not-allowed disabled:opacity-40",
    stacked ? "w-full justify-center px-3" : "px-4",
  );

  return (
    <div
      className={cn(
        stacked
          ? "flex w-full flex-col gap-2"
          : "flex flex-wrap items-start gap-2",
        className,
      )}
    >
      <div className={cn("flex flex-col items-center gap-1", stacked && "w-full")}>
        <button
          type="button"
          disabled={promptText === ""}
          onClick={(event) => {
            // The card lays a full-size button underneath this one to open the
            // set, so the copy has to keep the click to itself.
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
        {variant === "both" && !stacked && (
          <span className="text-xs text-neutral-500">for your agent</span>
        )}
      </div>

      {variant === "both" && (
        <div
          className={cn("flex flex-col items-center gap-1", stacked && "w-full")}
        >
          <button
            type="button"
            disabled={commandText === ""}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void command.copy(
                commandText,
                "Command copied — paste it into your terminal",
              );
            }}
            className={cn(
              base,
              stacked
                ? "bg-white text-neutral-900 hover:bg-neutral-100"
                : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
            )}
          >
            {command.copied ? (
              <Check weight="bold" className="h-4 w-4" />
            ) : (
              <Copy weight="regular" className="h-4 w-4" />
            )}
            {command.copied ? "Copied" : "Copy command"}
          </button>
          {!stacked && (
            <span className="text-xs text-neutral-500">for your terminal</span>
          )}
        </div>
      )}
    </div>
  );
}
