import { router, protectedProcedure } from "../server";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

const getProjectSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
});

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const projectRouter = router({
  create: protectedProcedure.input(createProjectSchema).mutation(async ({ ctx, input }) => {
    const baseSlug = generateSlug(input.name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await ctx.db.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const project = await ctx.db.project.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        userId: ctx.user.id,
      },
    });

    return project;
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
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
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            events: true,
            analyticsSessions: true,
          },
        },
      },
    });

    return projects;
  }),

  getById: protectedProcedure.input(getProjectSchema).query(async ({ ctx, input }) => {
    if (!input.id && !input.slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either id or slug must be provided",
      });
    }

    const project = await ctx.db.project.findFirst({
      where: {
        AND: [
          {
            OR: [
              { id: input.id },
              { slug: input.slug },
            ],
          },
          {
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
        ],
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    return project;
  }),

  getProjectId: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return project.id;
    }),

  update: protectedProcedure.input(updateProjectSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    // Verify ownership
    const project = await ctx.db.project.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this project",
      });
    }

    const updated = await ctx.db.project.update({
      where: { id },
      data,
    });

    return updated;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this project",
        });
      }

      await ctx.db.project.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

