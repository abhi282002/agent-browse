import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { NodeTemplateService } from "@/server/services/nodeTemplateService";

export const nodeTemplateRouter = router({
  getAll: publicProcedure.query(async () => {
    return NodeTemplateService.list();
  }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        category: z.string().min(1, "Category is required"),
        badge: z.string().min(1, "Badge is required"),
        archetype: z.string().default("action"),
        description: z.string().min(1, "Description is required"),
        actionSummary: z.string().min(1, "Action summary is required"),
        isPremium: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      return NodeTemplateService.create(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        category: z.string().optional(),
        badge: z.string().optional(),
        archetype: z.string().optional(),
        description: z.string().optional(),
        actionSummary: z.string().optional(),
        isPremium: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return NodeTemplateService.update(id, data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return NodeTemplateService.delete(input.id);
    }),
});
