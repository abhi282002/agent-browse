import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc/trpc";
import { WorkflowService } from "@/server/services/workflowService";

export const workflowRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return WorkflowService.list(ctx.user?.id);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return WorkflowService.getById(input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Workflow name is required"),
        description: z.string().optional(),
        category: z.string().default("Custom Automation"),
        targetUrl: z.string().optional().default(""),
        aiModel: z.string().optional(),
        sandboxEnv: z.string().optional(),
        nodes: z.array(z.any()).default([]),
        edges: z.array(z.any()).default([]),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return WorkflowService.create(input, ctx.user.id);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        targetUrl: z.string().optional(),
        aiModel: z.string().optional(),
        sandboxEnv: z.string().optional(),
        nodes: z.array(z.any()).optional(),
        edges: z.array(z.any()).optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return WorkflowService.update(id, data, ctx.user.id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return WorkflowService.delete(input.id, ctx.user.id);
    }),
});
