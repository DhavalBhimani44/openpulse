import { router } from "./server";
import { authRouter } from "./routers/auth";
import { projectRouter } from "./routers/project";
import { metricsRouter } from "./routers/metrics";
import { eventsRouter } from "./routers/events";

export const appRouter = router({
  auth: authRouter,
  project: projectRouter,
  metrics: metricsRouter,
  events: eventsRouter,
});

export type AppRouter = typeof appRouter;

