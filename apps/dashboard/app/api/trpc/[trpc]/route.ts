import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@openpulse/trpc";
import { createContext } from "@/server/context";
import { auth } from "@/lib/auth";

const handler = async (req: Request) => {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      return {
        user: session?.user || null,
        db: (await import("@openpulse/db")).db,
      };
    },
  });
};

export { handler as GET, handler as POST };

