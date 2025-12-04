import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@openpulse/db";
import type { User } from "@openpulse/db";

export interface Context {
  user: User | null;
  db: typeof db;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type narrowing
    },
  });
});

// Project access procedure - requires user to own or be member of project
export const projectProcedure = protectedProcedure.use(async ({ ctx, next, input }) => {
  const projectId = (input as { projectId?: string })?.projectId;
  if (!projectId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Project ID is required",
    });
  }

  // Check if user owns the project or is a member
  const project = await ctx.db.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { userId: ctx.user.id },
        {
          members: {
            some: {
              userId: ctx.user.id,
            },
          },
        },
      ],
    },
  });

  if (!project) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this project",
    });
  }

  return next({
    ctx: {
      ...ctx,
      project,
    },
  });
});

