/**
 * The text a skill set exists to hand over. Two audiences want the same set
 * spelled differently — a terminal wants only the commands, an agent wants to
 * be told what it is installing and why — so both come from here rather than
 * from two places that can drift apart.
 */

export type InstallFormat = "cli" | "agent";

/**
 * What the builder needs off a skill row. Deliberately structural rather than
 * the drizzle row type: it keeps this file pure, and lets a submission whose
 * URLs have been parsed but not yet stored produce text the same way.
 */
export interface InstallableSkill {
  name: string;
  sourceRepo?: string | null;
  skillKey?: string | null;
  installCommand?: string | null;
  sourceUrl?: string | null;
  description?: string | null;
}

const DEFAULT_INTRO = "Help me install the following skills for this project:";

const TRAILER =
  "Install them into this project rather than globally, then confirm each " +
  "SKILL.md landed in the right directory for this agent.";

/** `npx skills add` takes this shorthand, and it reads shorter than the URL. */
const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const REPO_SHORTHAND = /^[\w.-]+\/[\w.-]+$/;

export interface SkillSource {
  sourceRepo: string;
  skillKey: string | null;
}

/**
 * Resolve a pasted reference to the pair `npx skills add` actually takes.
 *
 * Accepts the shorthand, a repository URL, and a link to a skill's own
 * directory inside a repository — the three shapes a person is likely to copy
 * out of a browser. A skill directory is the last path segment, whatever the
 * layout above it, since repositories disagree about whether skills live at
 * the root or under `skills/`.
 *
 * Returns null rather than guessing for anything that isn't GitHub. Those
 * exist — GitLab remotes, direct downloads — but they cannot be expressed as a
 * repo/key pair, so they belong in `installCommand` instead.
 */
export function parseSkillSource(reference: string): SkillSource | null {
  const trimmed = reference.trim().replace(/\/+$/, "");
  if (trimmed === "") return null;

  if (REPO_SHORTHAND.test(trimmed)) {
    return { sourceRepo: trimmed.replace(/\.git$/, ""), skillKey: null };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!GITHUB_HOSTS.has(url.hostname)) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const [owner, repo, ...rest] = segments;
  if (!owner || !repo) return null;

  const sourceRepo = `${owner}/${repo.replace(/\.git$/, "")}`;

  // `/tree/<ref>/<...path>` — the skill is the directory the link points at.
  if (rest[0] === "tree" && rest.length >= 3) {
    return { sourceRepo, skillKey: rest[rest.length - 1] ?? null };
  }

  return { sourceRepo, skillKey: null };
}

/** The repo URL a skill falls back to when no deeper link is known. */
export function skillHref(skill: InstallableSkill): string | null {
  if (skill.sourceUrl) return skill.sourceUrl;
  if (skill.sourceRepo) return `https://github.com/${skill.sourceRepo}`;

  return null;
}

/**
 * The install commands for a set, one line each.
 *
 * Grouped by repository, because `--skill` repeats: the sets in this app
 * average nine skills drawn from about five repositories, so grouping is the
 * difference between five lines to paste and nine. Repositories keep the order
 * they first appear in, so the commands read in the same order as the list
 * above them.
 */
export function buildInstallCommands(skills: InstallableSkill[]): string[] {
  const byRepo = new Map<string, { keyed: string[]; bare: boolean }>();
  const verbatim: string[] = [];

  for (const skill of skills) {
    // A stored command is for sources the pair cannot describe, so it is
    // emitted as given rather than folded into a group.
    if (skill.installCommand) {
      verbatim.push(skill.installCommand);
      continue;
    }

    if (!skill.sourceRepo) continue;

    const group = byRepo.get(skill.sourceRepo) ?? { keyed: [], bare: false };
    if (skill.skillKey) {
      group.keyed.push(skill.skillKey);
    } else {
      // No key means the repository is itself the skill.
      group.bare = true;
    }
    byRepo.set(skill.sourceRepo, group);
  }

  const commands: string[] = [];

  for (const [repo, group] of byRepo) {
    if (group.keyed.length > 0) {
      const flags = group.keyed.map((key) => ` --skill ${key}`).join("");
      commands.push(`npx skills add ${repo}${flags}`);
    }
    if (group.bare) {
      commands.push(`npx skills add ${repo}`);
    }
  }

  return [...commands, ...verbatim];
}

function describe(skill: InstallableSkill): string {
  const source = skill.sourceRepo ?? skillHref(skill);
  const head = source ? `${skill.name} (${source})` : skill.name;

  // The description is a nicety, not a requirement: an agent reads each
  // SKILL.md as it installs it, so a set without descriptions still produces a
  // prompt that works.
  return skill.description ? `${head} — ${skill.description}` : head;
}

export interface BuildInstallTextOptions {
  skills: InstallableSkill[];
  format: InstallFormat;
  /** Replaces the default lead-in of the agent prompt. Ignored for "cli". */
  intro?: string | null;
}

/**
 * The copyable text for a set. Returns an empty string when there is nothing
 * installable, which is what the copy buttons check before enabling.
 */
export function buildInstallText({
  skills,
  format,
  intro,
}: BuildInstallTextOptions): string {
  const commands = buildInstallCommands(skills);

  if (format === "cli") return commands.join("\n");

  if (skills.length === 0) return "";

  const sections = [
    intro?.trim() ?? DEFAULT_INTRO,
    skills.map((skill) => `- ${describe(skill)}`).join("\n"),
  ];

  if (commands.length > 0) {
    sections.push("You can install them with:", commands.join("\n"), TRAILER);
  }

  return sections.join("\n\n");
}
