import { router, protectedProcedure, publicProcedure } from "../server";
import { z } from "zod";

export const authRouter = router({
  getSession: publicProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      isAuthenticated: !!ctx.user,
    };
  }),

  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    // Better Auth handles sign out via API route
    // This is just a placeholder for tRPC consistency
    return { success: true };
  }),
});

