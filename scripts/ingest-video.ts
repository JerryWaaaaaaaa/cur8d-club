/**
 * Pulls a demo video into Vercel Blob and records it on a Notion case study.
 *
 * Run this locally, not on Vercel. X blocks requests from data-centre IP
 * ranges, so extraction only works from an ordinary residential connection —
 * which is the whole reason this step lives outside the cron.
 *
 *   npm run ingest:video -- <tweet-url|video-url|file-path> --page <notion-page-id>
 *
 * Writes the resulting Blob URLs into the page's Video / Poster properties and
 * the tweet copy into Source Text. Notion stays the source of truth; the cron
 * picks the row up on its next run.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { Client as NotionClient } from "@notionhq/client";
import { config } from "dotenv";
import { uploadFileToBlob } from "../src/lib/blob-storage";

config();

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

interface Args {
  source: string;
  pageId: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const pageFlag = argv.indexOf("--page");

  const source = argv.find((arg) => !arg.startsWith("--") && arg !== argv[pageFlag + 1]);
  const pageId = pageFlag === -1 ? undefined : argv[pageFlag + 1];

  if (!source || !pageId) {
    console.error(
      "Usage: npm run ingest:video -- <tweet-url|video-url|file-path> --page <notion-page-id>",
    );
    process.exit(1);
  }

  return { source, pageId };
}

function isRemote(source: string) {
  return source.startsWith("http://") || source.startsWith("https://");
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: ["ignore", "pipe", "inherit"] });

  if (result.error) {
    throw new Error(
      `Could not run \`${command}\`. Install it first (brew install yt-dlp).`,
    );
  }
  if (result.status !== 0) {
    throw new Error(`\`${command}\` exited with code ${result.status}`);
  }

  return result.stdout.toString().trim();
}

/** Downloads the video, its poster frame, and the post text via yt-dlp. */
function extractWithYtDlp(url: string, workDir: string) {
  console.log("Extracting media with yt-dlp…");

  run("yt-dlp", [
    "--no-playlist",
    "--write-thumbnail",
    "--convert-thumbnails",
    "jpg",
    "--merge-output-format",
    "mp4",
    "-o",
    join(workDir, "media.%(ext)s"),
    url,
  ]);

  const description = run("yt-dlp", [
    "--no-playlist",
    "--skip-download",
    "--print",
    "%(description)s",
    url,
  ]);

  const files = readdirSync(workDir);
  const videoFile = files.find((file) => file.endsWith(".mp4"));
  const posterFile = files.find((file) => /\.(jpe?g|png|webp)$/i.test(file));

  if (!videoFile) {
    throw new Error("yt-dlp did not produce a video file for this URL.");
  }

  return {
    videoPath: join(workDir, videoFile),
    posterPath: posterFile ? join(workDir, posterFile) : null,
    sourceText: description === "NA" ? null : description,
  };
}

async function main() {
  const { source, pageId } = parseArgs();
  const notion = new NotionClient({ auth: process.env.NOTION_API_KEY });

  const workDir = mkdtempSync(join(tmpdir(), "cur8d-ingest-"));

  try {
    const media = isRemote(source)
      ? extractWithYtDlp(source, workDir)
      : { videoPath: source, posterPath: null, sourceText: null };

    console.log("Uploading video to Blob…");
    const videoUrl = await uploadFileToBlob(
      readFileSync(media.videoPath),
      `case-studies/${pageId}/${basename(media.videoPath)}`,
      "video/mp4",
    );

    let posterUrl: string | null = null;
    if (media.posterPath) {
      console.log("Uploading poster to Blob…");
      const extension = extname(media.posterPath).toLowerCase();
      posterUrl = await uploadFileToBlob(
        readFileSync(media.posterPath),
        `case-studies/${pageId}/${basename(media.posterPath)}`,
        IMAGE_CONTENT_TYPES[extension] ?? "image/jpeg",
      );
    }

    console.log("Writing URLs back to Notion…");
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Video: { url: videoUrl },
        ...(posterUrl ? { Poster: { url: posterUrl } } : {}),
        ...(media.sourceText
          ? {
              "Source Text": {
                rich_text: [{ text: { content: media.sourceText.slice(0, 2000) } }],
              },
            }
          : {}),
      },
    });

    console.log("\nDone.");
    console.log("  Video: ", videoUrl);
    if (posterUrl) console.log("  Poster:", posterUrl);
    console.log("\nRun GET /api/case-study-sync to pull it through to the site.");
  } finally {
    if (isRemote(source)) rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("\nIngest failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
