import { router, projectProcedure } from "../server";
import { z } from "zod";

export const eventsRouter = router({
  getRawEvents: projectProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.event.findMany({
        where: {
          projectId: input.projectId,
          ...(input.startDate &&
            input.endDate && {
              timestamp: {
                gte: input.startDate,
                lte: input.endDate,
              },
            }),
        },
        orderBy: {
          timestamp: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.event.count({
        where: {
          projectId: input.projectId,
          ...(input.startDate &&
            input.endDate && {
              timestamp: {
                gte: input.startDate,
                lte: input.endDate,
              },
            }),
        },
      });

      return {
        events,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),
});

