import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NOTION_DATABASE_ID: z.string(),
    NOTION_API_KEY: z.string(),

    // Case study support is optional: the site builds and serves the designer
    // view without any of these. Missing credentials disable the case study
    // sync rather than failing the build.
    NOTION_CASE_STUDY_DATABASE_ID: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_CASE_STUDY_DATABASE_ID: process.env.NOTION_CASE_STUDY_DATABASE_ID,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
