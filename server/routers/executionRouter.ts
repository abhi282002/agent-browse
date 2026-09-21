import { z } from 'zod';
import { router, publicProcedure } from '@/server/trpc/trpc';
import { BrowserbaseService } from '@/server/services/browserbaseService';
import { TriggerDevService } from '@/server/services/triggerDevService';
import { AgentService } from '@/server/services/agentService';
import { EmailService } from '@/server/services/emailService';

import type { Context } from '@/server/trpc/context';

const executionInputSchema = z.object({
  workflowId: z.string(),
  workflowName: z.string(),
  targetUrl: z.string().optional().default(""),
  aiModel: z.string().optional(),
  userEmail: z.string().optional(),
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
    }),
  ),
});

type ExecutionInput = z.infer<typeof executionInputSchema>;

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
        .optional(),
    )
    .mutation(async ({ input }) => {
      return BrowserbaseService.createSandboxSession(input?.targetUrl);
    }),

  /**
   * Start durable background workflow execution orchestrated by Trigger.dev and Browserbase
   */

  startExecution: publicProcedure
    .input(executionInputSchema)
    .mutation(
      async ({ input, ctx }: { input: ExecutionInput; ctx: Context }) => {
        if (input.nodes.length === 0) {
          throw new Error('Workflow has no step nodes to execute.');
        }
        const resolvedEmail = input.userEmail || ctx.user?.email || undefined;
        return TriggerDevService.triggerWorkflow({
          ...input,
          userEmail: resolvedEmail,
        });
      },
    ),

  /**
   * Poll status of an active Trigger.dev run
   */
  getRunStatus: publicProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ input }) => {
      return TriggerDevService.getRunStatus(input.runId);
    }),

  /**
   * Dynamically schedule a workflow on Trigger.dev (defaults to 9:00 AM IST)
   */
  scheduleWorkflow: publicProcedure
    .input(
      z.object({
        workflowId: z.string(),
        cron: z.string().default('0 9 * * *'),
        timezone: z.string().default('Asia/Kolkata'),
      }),
    )
    .mutation(async ({ input }) => {
      return TriggerDevService.createWorkflowSchedule(input);
    }),

  /**
   * Retrieve active schedule details for a workflow
   */
  getWorkflowSchedule: publicProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input }) => {
      return TriggerDevService.getWorkflowSchedule(input.workflowId);
    }),

  /**
   * Cancel and delete a workflow schedule from Trigger.dev
   */
  deleteWorkflowSchedule: publicProcedure
    .input(z.object({ workflowId: z.string() }))
    .mutation(async ({ input }) => {
      return TriggerDevService.deleteWorkflowSchedule(input.workflowId);
    }),

  /**
   * Toggle active state (pause/resume) of a workflow schedule
   */
  toggleWorkflowSchedule: publicProcedure
    .input(z.object({ workflowId: z.string(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      return TriggerDevService.toggleWorkflowSchedule(
        input.workflowId,
        input.active,
      );
    }),
});
