import { router } from "@/server/trpc/trpc";
import { authRouter } from "./authRouter";
import { workflowRouter } from "./workflowRouter";
import { nodeTemplateRouter } from "./nodeTemplateRouter";

export const appRouter = router({
  auth: authRouter,
  workflow: workflowRouter,
  nodeTemplate: nodeTemplateRouter,
});

export type AppRouter = typeof appRouter;
