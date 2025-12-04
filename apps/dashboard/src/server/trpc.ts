import { appRouter } from "@openpulse/trpc";
import { createContext } from "./context";

export const trpcServer = appRouter.createCallerFactory(createContext);

