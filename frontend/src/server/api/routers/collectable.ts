import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { collectables } from "@/server/db/schema";

export const collectableRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const allCollectables = await ctx.db.query.collectables.findMany({
      orderBy: (collectables, { desc }) => [desc(collectables.createdAt)],
    });

    return allCollectables;
  }),
});
