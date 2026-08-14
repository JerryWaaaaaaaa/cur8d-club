/**
 * Loads the curated skill sets from `data/design-skill-sets.csv` into the
 * database.
 *
 *   npm run import:skill-sets
 *   npm run import:skill-sets -- --overwrite
 *
 * This is an import, not a sync. Unlike the designer and case study tables,
 * nothing upstream owns these rows once they land — the database is the source
 * of truth — so the default is insert-only and a re-run leaves existing rows
 * alone. `--overwrite` is the explicit way to push edited CSV values over the
 * top of what is already stored.
 *
 * Ids are derived from the data rather than generated, so re-running is an
 * update of the same rows instead of a second copy of everything.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { mirrorToBlob } from "../src/lib/blob-storage";
import { parseSkillSource } from "../src/lib/skill-install-text";
import { skillSets, skills } from "../src/server/db/schema";

config();

const CSV_PATH = join(process.cwd(), "data", "design-skill-sets.csv");

/**
 * A minimal RFC 4180 reader. The file has quoted fields containing both commas
 * and newlines — the install column is a whole block of shell lines — so
 * splitting on delimiters would tear rows apart, and a dependency for one file
 * read is not worth it.
 */
function parseCsv(text: string): string[][] {
  // Excel writes a BOM, which would otherwise ride along on the first header.
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;

    if (inQuotes) {
      if (char !== '"') {
        field += char;
      } else if (input[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = false;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/**
 * A stable 36-character id from the row's natural key. Random ids would make
 * every re-run insert a duplicate set of everything, since nothing else about
 * a row is unique enough for the database to recognise it.
 */
function deterministicId(key: string): string {
  const hash = createHash("sha1").update(key).digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The comma-separated skill-name columns, used only to tell the two apart. */
function splitNames(cell: string): Set<string> {
  return new Set(
    cell
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== ""),
  );
}

interface ParsedSkill {
  id: string;
  name: string;
  sourceRepo: string;
  skillKey: string | null;
  kind: "domain" | "universal";
  author: string;
}

/**
 * Reads the install column rather than the two name columns, because it is the
 * only one carrying a repository and a skill key together — the name columns
 * alone cannot say which of thirteen repositories `polish` came from.
 */
function parseInstallBlock(
  block: string,
  universalNames: Set<string>,
): ParsedSkill[] {
  const parsed: ParsedSkill[] = [];

  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (line === "") continue;

    const match = /^npx\s+skills\s+add\s+(\S+)(.*)$/.exec(line);
    if (!match) {
      throw new Error(`Unrecognised install line: ${line}`);
    }

    const source = parseSkillSource(match[1]!);
    if (!source) {
      throw new Error(`Could not resolve a repository from: ${line}`);
    }

    const keys = [...(match[2] ?? "").matchAll(/--skill\s+(\S+)/g)].map(
      (flag) => flag[1]!,
    );
    // A line with no --skill flag means the repository is itself one skill.
    const skillKeys = keys.length > 0 ? keys : [source.skillKey];
    const author = source.sourceRepo.split("/")[0]!;

    for (const skillKey of skillKeys) {
      const name = skillKey ?? source.sourceRepo.split("/")[1]!;

      parsed.push({
        id: deterministicId(`${source.sourceRepo}#${skillKey ?? ""}`),
        name,
        sourceRepo: source.sourceRepo,
        skillKey,
        kind: universalNames.has(name) ? "universal" : "domain",
        author,
      });
    }
  }

  return parsed;
}

async function main() {
  const overwrite = process.argv.includes("--overwrite");

  const rows = parseCsv(readFileSync(CSV_PATH, "utf8"));
  const header = rows.shift();
  if (!header) throw new Error(`${CSV_PATH} is empty`);

  const columnOf = (label: string) => {
    const index = header.findIndex((cell) => cell.trim() === label);
    if (index === -1) throw new Error(`Missing column: ${label}`);
    return index;
  };

  const NAME = columnOf("Skillset Name");
  const TYPE = columnOf("Type");
  const COUNT = columnOf("Skill Count");
  const PURPOSE = columnOf("What It's For");
  const UNIVERSAL = columnOf("Skills (Universal)");
  const INSTALL = columnOf("Install (all skills)");

  // Keyed by id, so a skill shared by several sets is written once.
  const skillsById = new Map<string, ParsedSkill>();
  const setRows: (typeof skillSets.$inferInsert)[] = [];
  const now = new Date();

  rows.forEach((cells, index) => {
    const name = cells[NAME]!.trim();
    const parsedSkills = parseInstallBlock(
      cells[INSTALL] ?? "",
      splitNames(cells[UNIVERSAL] ?? ""),
    );

    // The count is the CSV's own claim about itself. Disagreeing with it means
    // a line failed to parse, and a set that silently lost a skill would go on
    // producing install text that is quietly wrong.
    const claimed = Number.parseInt(cells[COUNT] ?? "", 10);
    if (Number.isFinite(claimed) && claimed !== parsedSkills.length) {
      throw new Error(
        `"${name}" claims ${claimed} skills but ${parsedSkills.length} parsed`,
      );
    }

    for (const skill of parsedSkills) {
      if (!skillsById.has(skill.id)) skillsById.set(skill.id, skill);
    }

    const slug = slugify(name);
    setRows.push({
      id: deterministicId(`set#${slug}`),
      createdAt: now,
      updatedAt: now,
      name,
      slug,
      description: cells[PURPOSE]?.trim() || null,
      useCase: cells[TYPE]?.trim() || null,
      skillIds: parsedSkills.map((skill) => skill.id),
      sortOrder: index,
    });
  });

  console.log(
    `Parsed ${setRows.length} sets and ${skillsById.size} distinct skills.`,
  );

  // One avatar per repository owner, not per skill: these sets reference nine
  // skills from anthropics alone, and mirroring the same image nine times
  // would store nine copies of it.
  const owners = [...new Set([...skillsById.values()].map((s) => s.author))];
  const avatarByOwner = new Map<string, string>();

  for (const owner of owners) {
    const mirrored = await mirrorToBlob(
      `https://github.com/${owner}.png`,
      `skills/${owner}/avatar`,
    );
    if (mirrored) avatarByOwner.set(owner, mirrored);
  }

  console.log(
    `Mirrored ${avatarByOwner.size} of ${owners.length} owner avatars.`,
  );

  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema: { skills, skillSets } });

  try {
    const skillRows = [...skillsById.values()].map((skill) => ({
      id: skill.id,
      createdAt: now,
      updatedAt: now,
      name: skill.name,
      sourceRepo: skill.sourceRepo,
      skillKey: skill.skillKey,
      kind: skill.kind,
      author: skill.author,
      authorAvatarUrl: avatarByOwner.get(skill.author) ?? null,
      authorAvatarLastFetchedAt: avatarByOwner.has(skill.author) ? now : null,
    }));

    // `excluded` is the row that failed to insert — i.e. the CSV's value.
    // Naming the column instead would set it to what is already stored, which
    // reads like an update and does nothing.
    const skillInsert = db.insert(skills).values(skillRows);
    await (overwrite
      ? skillInsert.onConflictDoUpdate({
          target: skills.id,
          set: {
            updatedAt: now,
            name: sql`excluded.name`,
            kind: sql`excluded.kind`,
            author: sql`excluded.author`,
            authorAvatarUrl: sql`excluded.author_avatar_url`,
            authorAvatarLastFetchedAt: sql`excluded.author_avatar_last_fetched_at`,
          },
        })
      : skillInsert.onConflictDoNothing());

    const setInsert = db.insert(skillSets).values(setRows);
    await (overwrite
      ? setInsert.onConflictDoUpdate({
          target: skillSets.id,
          set: {
            updatedAt: now,
            name: sql`excluded.name`,
            description: sql`excluded.description`,
            useCase: sql`excluded.use_case`,
            skillIds: sql`excluded.skill_ids`,
            sortOrder: sql`excluded.sort_order`,
          },
        })
      : setInsert.onConflictDoNothing());

    console.log(
      overwrite
        ? "Imported, overwriting existing rows."
        : "Imported. Existing rows were left untouched — pass --overwrite to replace them.",
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
