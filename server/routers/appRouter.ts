import { router } from "@/server/trpc/trpc";
import { authRouter } from "./authRouter";
import { workflowRouter } from "./workflowRouter";

export const appRouter = router({
  auth: authRouter,
  workflow: workflowRouter,
});

export type AppRouter = typeof appRouter;
