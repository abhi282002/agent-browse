import { executeNode } from './nodeRegistry';
import { ensureStagehandExtensionPath } from './stagehandUtils';
import {
  browserbase,
  Stagehand,
  type StagehandBrowser,
  type Page,
} from '@browserbasehq/stagehand';
import { Browserbase } from '@browserbasehq/sdk';
import { prisma } from '@/lib/prisma';

export { ensureStagehandExtensionPath };

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
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string;
  totalSteps: number;
  successfulSteps: number;
  steps: StepExecutionResult[];
}

export interface WorkflowExecutionNodeData {
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
  [key: string]: unknown;
}

export interface WorkflowExecutionNodeItem {
  id: string;
  data: WorkflowExecutionNodeData;
}

export interface StepExecutionPayload {
  workflowId: string;
  workflowName: string;
  sessionId?: string;
  stepIndex: number;
  totalSteps: number;
  node: WorkflowExecutionNodeItem;
  targetUrl?: string;
  aiModel?: string;
  userEmail?: string;
  pipelineOutputs?: Record<string, unknown>;
  previousStepOutput?: Record<string, unknown>;
  workflowNodes?: WorkflowExecutionNodeItem[];
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
      console.warn(
        `[BrowserbaseService] Replay pages retrieval for ${sessionId}:`,
        e?.message || e,
      );
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
        status
          ? { status: status as 'RUNNING' | 'ERROR' | 'TIMED_OUT' | 'COMPLETED' }
          : undefined,
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

  static async verifyContext(contextId: string): Promise<boolean> {
    if (!contextId || !process.env.BROWSERBASE_API_KEY) return false;
    try {
      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
      await bb.contexts.retrieve(contextId);
      return true;
    } catch {
      return false;
    }
  }

  static async createContext(projectId?: string): Promise<{ id: string }> {
    const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
    const context = await bb.contexts.create({
      projectId:
        projectId || process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined,
    });
    return { id: context.id };
  }

  static async getOrCreateWorkflowContext(workflowId: string): Promise<string> {
    if (!workflowId || !process.env.BROWSERBASE_API_KEY) return '';
    try {
      const wf = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { id: true, sandboxEnv: true },
      });

      if (wf?.sandboxEnv?.startsWith('context:')) {
        const storedContextId = wf.sandboxEnv.replace('context:', '').trim();
        const isValid = await this.verifyContext(storedContextId);
        if (isValid) {
          return storedContextId;
        }
        console.warn(
          `[BrowserbaseService] Stored context ${storedContextId} is invalid or expired. Generating replacement.`,
        );
      }

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

  static cleanupStaleSessions() {
    const now = Date.now();
    for (const [id, entry] of this.activeSessions.entries()) {
      if (now - entry.lastUsed > 10 * 60 * 1000) {
        this.closeSession(id).catch(() => {});
      }
    }
  }

  static getStatus(): BrowserbaseStatus {
    const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
    const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim();

    return {
      isConfigured: Boolean(apiKey && apiKey.length > 5 && projectId && projectId.length > 3),
      apiKeyPresent: Boolean(apiKey),
      projectIdPresent: Boolean(projectId),
      provider: 'Browserbase Cloud Chromium (CDP & Stagehand V4)',
    };
  }

  static async launchSafeBrowser(options?: {
    contextId?: string;
    persist?: boolean;
    workflowId?: string;
  }): Promise<StagehandBrowser> {
    const apiKey = process.env.BROWSERBASE_API_KEY!;
    const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined;
    let contextId = options?.contextId;

    if (contextId) {
      const isValid = await this.verifyContext(contextId);
      if (!isValid) {
        console.warn(
          `[BrowserbaseService] Context ${contextId} is invalid or expired. Resetting.`,
        );
        contextId = undefined;
        if (options?.workflowId) {
          await prisma.workflow
            .update({
              where: { id: options.workflowId },
              data: { sandboxEnv: 'Chromium 128 (CDP Protocol)' },
            })
            .catch(() => {});
        }
      }
    }

    if (contextId) {
      try {
        return await browserbase.launch({
          apiKey,
          projectId,
          browserSettings: {
            blockAds: true,
            context: {
              id: contextId,
              persist: options?.persist ?? true,
            },
          },
        });
      } catch (launchErr) {
        console.warn(
          `[BrowserbaseService] Launch failed with context ${contextId}. Falling back to clean session:`,
          launchErr,
        );
        if (options?.workflowId) {
          await prisma.workflow
            .update({
              where: { id: options.workflowId },
              data: { sandboxEnv: 'Chromium 128 (CDP Protocol)' },
            })
            .catch(() => {});
        }
      }
    }

    return await browserbase.launch({
      apiKey,
      projectId,
      browserSettings: {
        blockAds: true,
      },
    });
  }

  static async createSandboxSession(
    targetUrl: string = 'https://example.com',
    options?: { contextId?: string; persist?: boolean },
  ) {
    const status = this.getStatus();

    if (!status.isConfigured) {
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
      const browser = await this.launchSafeBrowser(options);
      const [page] = await browser.context.pages();
      if (page) {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      }

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

  private static async executeSingleNode(params: {
    node: WorkflowExecutionNodeItem;
    stepNum: number;
    totalSteps: number;
    browser: StagehandBrowser;
    stagehand: Stagehand;
    page: Page;
    currentTargetUrl: string;
    aiModel?: string;
    userEmail?: string;
    pipelineOutputs: Record<string, unknown>;
    previousStepOutput?: Record<string, unknown>;
    workflowNodes: WorkflowExecutionNodeItem[];
  }): Promise<{
    stepResult: StepExecutionResult;
    updatedTargetUrl: string;
    output?: Record<string, unknown>;
  }> {
    const {
      node,
      stepNum,
      totalSteps,
      browser,
      stagehand,
      page,
      aiModel,
      userEmail,
      pipelineOutputs,
      previousStepOutput,
      workflowNodes,
    } = params;

    let targetUrl = params.currentTargetUrl;
    const stepStart = Date.now();
    console.log(
      `[Workflow] Step ${stepNum}/${totalSteps}: "${node.data.title}" starting...`,
    );
    const logs: string[] = [`Starting step: ${node.data.title}`];

    try {
      if (node.data?.url && node.data.url.startsWith('http')) {
        targetUrl = node.data.url;
      }

      const activePage =
        (await (browser.context as { activePage?: () => Promise<Page> })
          .activePage?.()
          .catch(() => undefined)) || page;

      const nodeExecution = await executeNode(node as any, {
        stagehand,
        page: activePage,
        targetUrl,
        aiModel,
        userEmail,
        pipelineOutputs,
        previousStepOutput,
        workflowNodes: workflowNodes as any,
      });

      logs.push(...nodeExecution.logs);
      let output = nodeExecution.output;

      if (output) {
        if (
          typeof output.targetUrl === 'string' &&
          output.targetUrl.startsWith('http')
        ) {
          targetUrl = output.targetUrl;
        } else if (!output.targetUrl && targetUrl) {
          output = { ...output, targetUrl };
        }
      }

      const durationMs = Date.now() - stepStart;
      console.log(
        `[Workflow] Step ${stepNum}/${totalSteps}: "${node.data.title}" completed (${durationMs}ms)`,
      );

      return {
        stepResult: {
          stepId: node.id,
          stepNumber: node.data.stepNumber,
          title: node.data.title,
          status: 'completed',
          durationMs,
          logs,
          output,
        },
        updatedTargetUrl: targetUrl,
        output,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(
        `[Workflow] Step ${stepNum}/${totalSteps}: "${node.data.title}" failed:`,
        errMsg,
      );
      logs.push(`Step warning/error: ${errMsg}`);

      return {
        stepResult: {
          stepId: node.id,
          stepNumber: node.data.stepNumber,
          title: node.data.title,
          status: 'failed',
          durationMs: Date.now() - stepStart,
          logs,
          error: errMsg,
        },
        updatedTargetUrl: targetUrl,
      };
    }
  }

  static async executeWorkflow(payload: {
    workflowId: string;
    workflowName: string;
    targetUrl?: string;
    aiModel?: string;
    userEmail?: string;
    nodes: WorkflowExecutionNodeItem[];
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

    let browser: StagehandBrowser | undefined;
    let stagehand: Stagehand | undefined;

    try {
      browser = await this.launchSafeBrowser({
        contextId,
        workflowId: payload.workflowId,
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

        const {
          stepResult,
          updatedTargetUrl,
          output,
        } = await this.executeSingleNode({
          node,
          stepNum,
          totalSteps,
          browser,
          stagehand,
          page,
          currentTargetUrl,
          aiModel: payload.aiModel,
          userEmail: payload.userEmail,
          pipelineOutputs,
          previousStepOutput,
          workflowNodes: payload.nodes,
        });

        currentTargetUrl = updatedTargetUrl;
        stepResults.push(stepResult);

        if (stepResult.status === 'failed') {
          break;
        }

        if (output) {
          pipelineOutputs[node.id] = output;
          previousStepOutput = output;
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
