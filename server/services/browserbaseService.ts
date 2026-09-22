import { executeNode } from './nodeRegistry';
import { pickFirstString } from './nodes/nodeUtils';
import { ensureStagehandExtensionPath } from './stagehandUtils';
import {
  browserbase,
  Stagehand,
  type StagehandBrowser,
} from '@browserbasehq/stagehand';
import { Browserbase } from '@browserbasehq/sdk';
import { prisma } from '@/lib/prisma';

export { ensureStagehandExtensionPath };

// Ensure env variable is initialized as soon as this module loads
ensureStagehandExtensionPath();

export interface BrowserbaseStatus {
  isConfigured: boolean;
  apiKeyPresent: boolean;
  projectIdPresent: boolean;
  provider: string;
}

export interface StepExecutionResult {
  stepId: string;
  stepNumber: number;
  title: string;
  status: 'completed' | 'failed' | 'skipped';
  durationMs: number;
  logs: string[];
  output?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  workflowName: string;
  targetUrl?: string;
  sessionId: string;
  liveViewUrl?: string;
  status: 'completed' | 'failed';
  startedAt: string;
  completedAt: string;
  totalSteps: number;
  successfulSteps: number;
  steps: StepExecutionResult[];
}

export interface StepExecutionPayload {
  workflowId: string;
  workflowName: string;
  sessionId?: string;
  stepIndex: number;
  totalSteps: number;
  node: {
    id: string;
    data: {
      stepNumber: number;
      title: string;
      category: string;
      badge: string;
      description: string;
      actionSummary: string;
      url?: string;
      archetype?: string;
      selector?: string;
      payload?: string;
      emailProvider?: 'resend' | 'nodemailer';
      metrics?: { label: string; value: string }[];
      [key: string]: unknown;
    };
  };
  targetUrl?: string;
  aiModel?: string;
  userEmail?: string;
  pipelineOutputs?: Record<string, unknown>;
  previousStepOutput?: Record<string, unknown>;
  workflowNodes?: Array<{
    id: string;
    data: {
      stepNumber: number;
      title: string;
      category: string;
      badge: string;
      description: string;
      actionSummary: string;
      url?: string;
      archetype?: string;
      [key: string]: unknown;
    };
  }>;
}

export interface StepExecutionResultOutput {
  sessionId: string;
  liveViewUrl?: string;
  targetUrl?: string;
  stepResult: StepExecutionResult;
  updatedPipelineOutputs: Record<string, unknown>;
  isLastStep: boolean;
}

interface ActiveSessionEntry {
  browser: StagehandBrowser;
  stagehand: Stagehand;
  page: unknown;
  lastUsed: number;
}

export class BrowserbaseService {
  private static activeSessions = new Map<string, ActiveSessionEntry>();

  /**
   * Close and clean up an active Browserbase session
   */
  static async closeSession(sessionId: string) {
    const entry = this.activeSessions.get(sessionId);
    if (entry) {
      this.activeSessions.delete(sessionId);
      try {
        if (entry.stagehand) await entry.stagehand.close().catch(() => {});
        if (entry.browser) await entry.browser.close().catch(() => {});
      } catch (e) {
        console.warn(
          `[BrowserbaseService] Error closing session ${sessionId}:`,
          e,
        );
      }
    }
  }

  static async fetchSessionPages(sessionId: string) {
    if (!sessionId || !process.env.BROWSERBASE_API_KEY) {
      return [];
    }

    try {
      const bb = new Browserbase({
        apiKey: process.env.BROWSERBASE_API_KEY!,
      });
      const data = await bb.sessions.replays.retrieve(sessionId);
      return data.pages ?? [];
    } catch (e: any) {
      if (e?.status === 404 || e?.message?.includes('404')) {
        return [];
      }
      console.warn(`[BrowserbaseService] Replay pages retrieval for ${sessionId}:`, e?.message || e);
      return [];
    }
  }

  static async fetchSessionReplay(sessionId: string, pageId: string) {
    const bb = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY!,
    });
    const playlist = await bb.sessions.replays.retrievePage(sessionId, pageId);
    return await playlist.text();
  }

  static async listSessions(limit = 10, status?: string) {
    if (!process.env.BROWSERBASE_API_KEY) return [];
    try {
      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
      const sessions = await bb.sessions.list(
        status ? { status: status as 'RUNNING' | 'ERROR' | 'TIMED_OUT' | 'COMPLETED' } : undefined,
      );
      return sessions.slice(0, limit).map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    } catch (e) {
      console.warn('[BrowserbaseService] Error listing sessions:', e);
      return [];
    }
  }


  /**
   * Create a new persistent Browserbase Context for saving cookies, local storage, and auth state
   */
  static async createContext(projectId?: string): Promise<{ id: string }> {
    const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
    const context = await bb.contexts.create({
      projectId: projectId || process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined,
    });
    return { id: context.id };
  }

  /**
   * Retrieve or automatically initialize a persistent Browserbase Context for a workflow
   */
  static async getOrCreateWorkflowContext(workflowId: string): Promise<string> {
    if (!workflowId || !process.env.BROWSERBASE_API_KEY) return '';
    try {
      const wf = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { id: true, sandboxEnv: true },
      });

      // If already stored as context:UUID
      if (wf?.sandboxEnv?.startsWith('context:')) {
        return wf.sandboxEnv.replace('context:', '').trim();
      }

      // Create new persistent context in Browserbase
      const newCtx = await this.createContext();
      if (newCtx?.id) {
        await prisma.workflow.update({
          where: { id: workflowId },
          data: { sandboxEnv: `context:${newCtx.id}` },
        });
        return newCtx.id;
      }
    } catch (err) {
      console.warn(
        `[BrowserbaseService] Error resolving workflow context for ${workflowId}:`,
        err,
      );
    }
    return '';
  }

  /**
   * Cleanup sessions inactive for more than 10 minutes
   */
  private static cleanupStaleSessions() {
    const now = Date.now();
    for (const [id, entry] of this.activeSessions.entries()) {
      if (now - entry.lastUsed > 10 * 60 * 1000) {
        this.closeSession(id).catch(() => {});
      }
    }
  }
  /**
   * Check configuration status of Browserbase credentials
   */
  static getStatus(): BrowserbaseStatus {
    const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
    const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim();

    return {
      isConfigured: Boolean(apiKey && apiKey.length > 5),
      apiKeyPresent: Boolean(apiKey),
      projectIdPresent: Boolean(projectId),
      provider: 'Browserbase Cloud Chromium (CDP & Stagehand V4)',
    };
  }

  /**
   * Launch a standalone browser sandbox session on Browserbase
   */
  static async createSandboxSession(
    targetUrl: string = 'https://example.com',
    options?: { contextId?: string; persist?: boolean },
  ) {
    const status = this.getStatus();

    if (!status.isConfigured) {
      // Graceful fallback simulation when API key is not yet set
      const mockSessionId = `bb-sim-${Date.now().toString(36)}`;
      return {
        sessionId: mockSessionId,
        liveViewUrl: `https://browserbase.com/sessions/${mockSessionId}`,
        targetUrl,
        status: 'connected',
        mode: 'simulation' as const,
        message:
          'Simulated sandbox active. Set BROWSERBASE_API_KEY in .env for live cloud Chromium.',
      };
    }

    try {
      const contextId = options?.contextId;
      const browser = await browserbase.launch({
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined,
        browserSettings: {
          blockAds: true,
          ...(contextId
            ? {
                context: {
                  id: contextId,
                  persist: options?.persist ?? true,
                },
              }
            : {}),
        },
      });

      const [page] = await browser.context.pages();
      if (page) {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      }

      // Safe session details
      const sessionId =
        (browser as unknown as { id?: string; sessionId?: string }).sessionId ||
        (browser as unknown as { id?: string }).id ||
        `bb-live-${Date.now().toString(36)}`;

      return {
        sessionId,
        liveViewUrl: `https://browserbase.com/sessions/${sessionId}`,
        targetUrl,
        status: 'active',
        mode: 'live' as const,
        message: 'Browserbase Cloud Chromium VM allocated with CDP streaming.',
      };
    } catch (error) {
      console.error(
        '[BrowserbaseService] Error launching cloud sandbox:',
        error,
      );
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to launch Browserbase cloud browser',
      );
    }
  }

  /**
   * Execute an automated workflow using Stagehand V4 on Browserbase
   */
  static async executeWorkflow(payload: {
    workflowId: string;
    workflowName: string;
    targetUrl?: string;
    aiModel?: string;
    userEmail?: string;
    nodes: Array<{
      id: string;
      data: {
        stepNumber: number;
        title: string;
        category: string;
        badge: string;
        description: string;
        actionSummary: string;
        url?: string;
        archetype?: string;
        selector?: string;
        payload?: string;
        emailProvider?: 'resend' | 'nodemailer';
        authEmail?: string;
        authPassword?: string;
        aiModel?: string;
        metrics?: { label: string; value: string }[];
      };
    }>;
    contextId?: string;
  }): Promise<WorkflowExecutionResult> {
    const startTime = new Date().toISOString();
    const status = this.getStatus();

    if (!status.isConfigured) {
      throw new Error(
        'Browserbase API key not configured. Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID environment variables.',
      );
    }

    let contextId = payload.contextId;
    if (!contextId && payload.workflowId) {
      try {
        contextId = await this.getOrCreateWorkflowContext(payload.workflowId);
      } catch (e) {
        console.warn('[BrowserbaseService] Error resolving workflow context:', e);
      }
    }

    // Live Execution on Browserbase Cloud via Stagehand
    let browser: StagehandBrowser | undefined;
    let stagehand: Stagehand | undefined;

    try {
      browser = await browserbase.launch({
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined,
        browserSettings: {
          blockAds: true,
          ...(contextId
            ? {
                context: {
                  id: contextId,
                  persist: true,
                },
              }
            : {}),
        },
      });

      stagehand = await Stagehand.create({
        browser,
        domSettleTimeoutMs: 10_000,
        selfHeal: true,
      });

      const [page] = await browser.context.pages();

      if (!page) {
        throw new Error('Browserbase launched without an active page');
      }

      const stepResults: StepExecutionResult[] = [];
      const pipelineOutputs: Record<string, unknown> = {};
      let previousStepOutput: Record<string, unknown> | undefined = undefined;

      let currentTargetUrl =
        (payload.targetUrl && payload.targetUrl.startsWith('http')
          ? payload.targetUrl
          : undefined) ||
        payload.nodes.find((n) => n.data?.url && n.data.url.startsWith('http'))
          ?.data.url ||
        '';

      for (let i = 0; i < payload.nodes.length; i++) {
        const node = payload.nodes[i];
        const stepNum = i + 1;
        const totalSteps = payload.nodes.length;
        const stepStart = Date.now();
        console.log(
          `[Workflow] Step ${stepNum}/${totalSteps}: "${node.data.title}" starting...`,
        );
        const logs: string[] = [`Starting step: ${node.data.title}`];

        try {
          if (node.data?.url && node.data.url.startsWith('http')) {
            currentTargetUrl = node.data.url;
          }

          // Dynamically resolve the active page in case a prior step opened a new tab, redirected, or navigated
          const activePage =
            (await browser.context.activePage().catch(() => undefined)) || page;

          // Execute node using the modular Node Registry with accumulated outputs
          const nodeExecution = await executeNode(node, {
            stagehand,
            page: activePage,
            targetUrl: currentTargetUrl,
            aiModel: payload.aiModel,
            userEmail: payload.userEmail,
            pipelineOutputs,
            previousStepOutput,
            workflowNodes: payload.nodes,
          });

          logs.push(...nodeExecution.logs);
          if (nodeExecution.output) {
            if (
              typeof nodeExecution.output.targetUrl === 'string' &&
              nodeExecution.output.targetUrl.startsWith('http')
            ) {
              currentTargetUrl = nodeExecution.output.targetUrl;
            } else if (!nodeExecution.output.targetUrl && currentTargetUrl) {
              nodeExecution.output.targetUrl = currentTargetUrl;
            }
            pipelineOutputs[node.id] = nodeExecution.output;
            previousStepOutput = nodeExecution.output;
          }

          const durationMs = Date.now() - stepStart;
          console.log(
            `[Workflow] Step ${stepNum}/${totalSteps}: "${node.data.title}" completed (${durationMs}ms)`,
          );

          stepResults.push({
            stepId: node.id,
            stepNumber: node.data.stepNumber,
            title: node.data.title,
            status: 'completed',
            durationMs,
            logs,
            output: nodeExecution.output,
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(
            `[Workflow] Step ${stepNum}/${totalSteps}: "${node.data.title}" failed:`,
            errMsg,
          );
          logs.push(`Step warning/error: ${errMsg}`);
          stepResults.push({
            stepId: node.id,
            stepNumber: node.data.stepNumber,
            title: node.data.title,
            status: 'failed',
            durationMs: Date.now() - stepStart,
            logs,
            error: errMsg,
          });
          // Abort execution: do not execute subsequent nodes
          break;
        }
      }

      const sessionId = browser?.sessionId || `bb-${Date.now().toString(36)}`;

      return {
        workflowId: payload.workflowId,
        workflowName: payload.workflowName,
        targetUrl: currentTargetUrl || payload.targetUrl,
        sessionId,
        liveViewUrl: `https://browserbase.com/sessions/${sessionId}`,
        status: stepResults.some((s) => s.status === 'failed')
          ? 'failed'
          : 'completed',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        totalSteps: payload.nodes.length,
        successfulSteps: stepResults.filter((s) => s.status === 'completed')
          .length,
        steps: stepResults,
      };
    } finally {
      if (stagehand) {
        await stagehand.close().catch(() => {});
      }
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}
