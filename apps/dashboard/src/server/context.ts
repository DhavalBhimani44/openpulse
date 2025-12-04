import { db } from "@openpulse/db";
import { auth } from "@/lib/auth";
import type { Context } from "@openpulse/trpc";

export async function createContext(): Promise<Context> {
  // Get session from Better Auth
  // In a real implementation, you'd get the session from the request headers/cookies
  // For now, we'll return null - this will be properly implemented in the API route
  const session = await auth.api.getSession({
    headers: new Headers(),
  });

  return {
    user: session?.user || null,
    db,
  };
}

