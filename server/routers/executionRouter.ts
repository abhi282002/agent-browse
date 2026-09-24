import { z } from 'zod';
import { router, publicProcedure } from '@/server/trpc/trpc';
import { BrowserbaseService } from '@/server/services/browserbaseService';
import { TriggerDevService } from '@/server/services/triggerDevService';
import { AgentService } from '@/server/services/agentService';
import { EmailService } from '@/server/services/emailService';
import { prisma } from '@/lib/prisma';

import type { Context } from '@/server/trpc/context';
import { WorkflowService } from '../services/workflowService';

const executionInputSchema = z.object({
  workflowId: z.string(),
  workflowName: z.string(),
  targetUrl: z.string().optional().default(''),
  aiModel: z.string().optional(),
  userEmail: z.string().optional(),
  contextId: z.string().optional(),
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
        selector: z.string().optional(),
        payload: z.string().optional(),
        emailProvider: z.enum(['resend', 'nodemailer']).optional(),
        authEmail: z.string().optional(),
        authPassword: z.string().optional(),
        aiModel: z.string().optional(),
        metrics: z
          .array(z.object({ label: z.string(), value: z.string() }))
          .optional(),
      }),
    }),
  ),
  edges: z
    .array(
      z.object({
        source: z.string(),
        target: z.string(),
      }),
    )
    .optional(),
  organization: z
    .object({
      id: z.string(),
      name: z.string(),
      aiInstructions: z.string().optional(),
      defaultAiModel: z.string().optional(),
    })
    .optional(),
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
   * Get or create a persistent Browserbase context for a workflow
   */
  getWorkflowContext: publicProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input }) => {
      const contextId = await BrowserbaseService.getOrCreateWorkflowContext(
        input.workflowId,
      );
      return { contextId };
    }),

  /**
   * Stop an active workflow execution and terminate associated Browserbase session
   */
  stopExecution: publicProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.sessionId) {
        await BrowserbaseService.closeSession(input.sessionId);
      }
      return { success: true, message: 'Execution halted.' };
    }),

  //fetch the pages of a session id
  fetchSessionPages: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return BrowserbaseService.fetchSessionPages(input.sessionId);
    }),

  fetchSessionReplay: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        pageId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return BrowserbaseService.fetchSessionReplay(
        input.sessionId,
        input.pageId,
      );
    }),

  /**
   * List recent Browserbase sessions for session replay selection
   */
  listRecentSessions: publicProcedure
    .input(
      z
        .object({
          limit: z.number().optional().default(10),
          status: z
            .enum(['RUNNING', 'ERROR', 'TIMED_OUT', 'COMPLETED'])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return BrowserbaseService.listSessions(input?.limit, input?.status);
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
        const resolvedTargetUrl =
          (input.targetUrl && input.targetUrl.startsWith('http')
            ? input.targetUrl
            : undefined) ||
          input.nodes.find((n) => n.data?.url && n.data.url.startsWith('http'))
            ?.data.url ||
          '';
        const resolvedEmail =
          input.userEmail ||
          ctx.user?.email ||
          input.nodes.find((n) => n.data?.url?.includes('@'))?.data.url ||
          undefined;

        let resolvedOrg = input.organization;
        if (!resolvedOrg && input.workflowId) {
          try {
            const workflow = await WorkflowService.getById(input.workflowId);
            if (workflow?.organization) {
              resolvedOrg = {
                id: workflow.organization.id,
                name: workflow.organization.name,
                aiInstructions:
                  workflow.organization.aiInstructions || undefined,
                defaultAiModel:
                  workflow.organization.defaultAiModel || undefined,
              };
            }
          } catch {}
        }

        return TriggerDevService.triggerWorkflow({
          ...input,
          targetUrl: resolvedTargetUrl,
          userEmail: resolvedEmail,
          organization: resolvedOrg,
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
