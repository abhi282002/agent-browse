import path from 'path';
import fs from 'fs';
import { executeNode } from './nodeRegistry';
import type { Stagehand, StagehandBrowser } from '@browserbasehq/stagehand';

export function ensureStagehandExtensionPath(): string | undefined {
  if (
    process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH &&
    fs.existsSync(process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH)
  ) {
    return process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH;
  }

  const candidatePaths = [
    path.resolve(
      process.cwd(),
      'node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
    ),
    path.resolve(
      __dirname,
      '../../node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
    ),
    path.resolve(
      __dirname,
      '../node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
    ),
    'C:\\agentbrowse\\node_modules\\@browserbasehq\\stagehand\\dist\\assets\\stagehand-extension.zip',
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH = candidate;
      return candidate;
    }
  }

  return undefined;
}

// Ensure env variable is initialized as soon as this module loads
ensureStagehandExtensionPath();

async function getStagehandModule() {
  ensureStagehandExtensionPath();
  return await import('@browserbasehq/stagehand');
}

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

export class BrowserbaseService {
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
  static async createSandboxSession(targetUrl: string = 'https://example.com') {
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
      const { browserbase } = await getStagehandModule();
      const browser = await browserbase.launch({
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined,
        browserSettings: {
          blockAds: true,
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
      };
    }>;
  }): Promise<WorkflowExecutionResult> {
    const startTime = new Date().toISOString();
    const status = this.getStatus();

    // If API key is not configured, perform reliable simulation
    if (!status.isConfigured) {
      const stepResults: StepExecutionResult[] = payload.nodes.map((node) => ({
        stepId: node.id,
        stepNumber: node.data.stepNumber,
        title: node.data.title,
        status: 'completed',
        durationMs: Math.floor(Math.random() * 400) + 300,
        logs: [
          `Allocated simulated worker for "${node.data.title}"`,
          `User Context: ${payload.userEmail || 'anonymous'}`,
          `Target: ${node.data.url || payload.targetUrl}`,
          `Action: ${node.data.actionSummary}`,
          `Completed step successfully.`,
        ],
      }));

      const mockSessionId = `sim-wf-${Date.now().toString(36)}`;
      return {
        workflowId: payload.workflowId,
        workflowName: payload.workflowName,
        targetUrl: payload.targetUrl,
        sessionId: mockSessionId,
        liveViewUrl: `https://browserbase.com/sessions/${mockSessionId}`,
        status: 'completed',
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        totalSteps: payload.nodes.length,
        successfulSteps: payload.nodes.length,
        steps: stepResults,
      };
    }

    // Live Execution on Browserbase Cloud via Stagehand
    let browser: StagehandBrowser | undefined;
    let stagehand: Stagehand | undefined;

    try {
      const { browserbase, Stagehand } = await getStagehandModule();
      browser = await browserbase.launch({
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined,
        browserSettings: {
          blockAds: true,
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
          // Continue execution with graceful logging
          stepResults.push({
            stepId: node.id,
            stepNumber: node.data.stepNumber,
            title: node.data.title,
            status: 'failed',
            durationMs: Date.now() - stepStart,
            logs,
            error: errMsg,
          });
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
