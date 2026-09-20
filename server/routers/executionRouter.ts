import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc/trpc";
import { BrowserbaseService } from "@/server/services/browserbaseService";
import { TriggerDevService } from "@/server/services/triggerDevService";
import { AgentService } from "@/server/services/agentService";
import { EmailService } from "@/server/services/emailService";

export const executionRouter = router({
  /**
   * Get configuration status of Browserbase, Trigger.dev, AI Agent & Email integrations
   */
  getIntegrationsStatus: publicProcedure.query(() => {
    return {
      browserbase: BrowserbaseService.getStatus(),
      triggerDev: TriggerDevService.getStatus(),
      agents: AgentService.getStatus(),
      email: EmailService.getStatus(),
    };
  }),

  /**
   * Launch a standalone cloud Chromium sandbox on Browserbase
   */
  launchSandbox: publicProcedure
    .input(
      z
        .object({
          targetUrl: z.string().optional(),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      return BrowserbaseService.createSandboxSession(input?.targetUrl);
    }),

  /**
   * Start durable background workflow execution orchestrated by Trigger.dev and Browserbase
   */
  startExecution: publicProcedure
    .input(
      z.object({
        workflowId: z.string(),
        workflowName: z.string(),
        targetUrl: z.string(),
        aiModel: z.string().optional(),
        nodes: z.array(
          z.object({
            id: z.string(),
            data: z.object({
              stepNumber: z.number(),
              title: z.string(),
              category: z.string(),
              badge: z.string(),
              description: z.string(),
              actionSummary: z.string(),
              url: z.string().optional(),
              archetype: z.string().optional(),
            }),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return TriggerDevService.triggerWorkflow(input);
    }),

  /**
   * Poll status of an active Trigger.dev run
   */
  getRunStatus: publicProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ input }) => {
      return TriggerDevService.getRunStatus(input.runId);
    }),
});
