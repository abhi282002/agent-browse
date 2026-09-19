import { router } from "@/server/trpc/trpc";
import { authRouter } from "./authRouter";
import { workflowRouter } from "./workflowRouter";
import { nodeTemplateRouter } from "./nodeTemplateRouter";
import { executionRouter } from "./executionRouter";

export const appRouter = router({
  auth: authRouter,
  workflow: workflowRouter,
  nodeTemplate: nodeTemplateRouter,
  execution: executionRouter,
});

export type AppRouter = typeof appRouter;
