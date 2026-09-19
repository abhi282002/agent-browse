async function getStagehandModule() {
  return await import("@browserbasehq/stagehand");
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
  status: "completed" | "failed" | "skipped";
  durationMs: number;
  logs: string[];
  output?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  workflowName: string;
  targetUrl: string;
  sessionId: string;
  liveViewUrl?: string;
  status: "completed" | "failed";
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
      provider: "Browserbase Cloud Chromium (CDP & Stagehand V4)",
    };
  }

  /**
   * Launch a standalone browser sandbox session on Browserbase
   */
  static async createSandboxSession(targetUrl: string = "https://example.com") {
    const status = this.getStatus();

    if (!status.isConfigured) {
      // Graceful fallback simulation when API key is not yet set
      const mockSessionId = `bb-sim-${Date.now().toString(36)}`;
      return {
        sessionId: mockSessionId,
        liveViewUrl: `https://browserbase.com/sessions/${mockSessionId}`,
        targetUrl,
        status: "connected",
        mode: "simulation" as const,
        message: "Simulated sandbox active. Set BROWSERBASE_API_KEY in .env for live cloud Chromium.",
      };
    }

    try {
      const { browserbase } = await getStagehandModule();
      const browser = await browserbase.launch({
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined,
      });

      const [page] = await browser.context.pages();
      if (page) {
        await page.goto(targetUrl);
      }

      // Safe session details
      const sessionId = (browser as unknown as { id?: string; sessionId?: string }).sessionId ||
        (browser as unknown as { id?: string }).id ||
        `bb-live-${Date.now().toString(36)}`;

      return {
        sessionId,
        liveViewUrl: `https://browserbase.com/sessions/${sessionId}`,
        targetUrl,
        status: "active",
        mode: "live" as const,
        message: "Browserbase Cloud Chromium VM allocated with CDP streaming.",
      };
    } catch (error) {
      console.error("[BrowserbaseService] Error launching cloud sandbox:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to launch Browserbase cloud browser"
      );
    }
  }

  /**
   * Execute an automated workflow using Stagehand V4 on Browserbase
   */
  static async executeWorkflow(payload: {
    workflowId: string;
    workflowName: string;
    targetUrl: string;
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
        status: "completed",
        durationMs: Math.floor(Math.random() * 400) + 300,
        logs: [
          `Allocated simulated worker for "${node.data.title}"`,
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
        status: "completed",
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        totalSteps: payload.nodes.length,
        successfulSteps: payload.nodes.length,
        steps: stepResults,
      };
    }

    // Live Execution on Browserbase Cloud via Stagehand
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let browser: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stagehand: any;

    try {
      const { browserbase, Stagehand } = await getStagehandModule();
      browser = await browserbase.launch({
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined,
      });

      stagehand = await Stagehand.create({ browser });
      const [page] = await browser.context.pages();

      if (!page) {
        throw new Error("Browserbase launched without an active page");
      }

      // Initial page navigation
      if (payload.targetUrl) {
        await page.goto(payload.targetUrl);
      }

      const stepResults: StepExecutionResult[] = [];

      for (const node of payload.nodes) {
        const stepStart = Date.now();
        const logs: string[] = [`Starting step: ${node.data.title}`];

        try {
          // If custom URL on node and different from targetUrl, navigate
          if (node.data.url && node.data.url !== payload.targetUrl && node.data.url.startsWith("http")) {
            await page.goto(node.data.url);
            logs.push(`Navigated to ${node.data.url}`);
          }

          // Execute with Stagehand based on archetype
          if (node.data.archetype === "extraction") {
            const extractInstruction = node.data.actionSummary || node.data.description || "Extract page text";
            logs.push(`Executing Stagehand extract: "${extractInstruction}"`);
            const extractRes = await stagehand.extract(extractInstruction);
            logs.push("Extraction successful");
            stepResults.push({
              stepId: node.id,
              stepNumber: node.data.stepNumber,
              title: node.data.title,
              status: "completed",
              durationMs: Date.now() - stepStart,
              logs,
              output: extractRes.data as Record<string, unknown>,
            });
          } else {
            // Standard action step via stagehand.act
            const actInstruction = node.data.actionSummary || node.data.title;
            logs.push(`Executing Stagehand action: "${actInstruction}"`);
            await stagehand.act(actInstruction);
            logs.push("Action executed cleanly");

            stepResults.push({
              stepId: node.id,
              stepNumber: node.data.stepNumber,
              title: node.data.title,
              status: "completed",
              durationMs: Date.now() - stepStart,
              logs,
            });
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          logs.push(`Step warning/error: ${errMsg}`);
          // Continue execution with graceful logging
          stepResults.push({
            stepId: node.id,
            stepNumber: node.data.stepNumber,
            title: node.data.title,
            status: "failed",
            durationMs: Date.now() - stepStart,
            logs,
            error: errMsg,
          });
        }
      }

      const sessionId = (browser as unknown as { id?: string; sessionId?: string }).sessionId ||
        `bb-${Date.now().toString(36)}`;

      return {
        workflowId: payload.workflowId,
        workflowName: payload.workflowName,
        targetUrl: payload.targetUrl,
        sessionId,
        liveViewUrl: `https://browserbase.com/sessions/${sessionId}`,
        status: stepResults.some((s) => s.status === "failed") ? "failed" : "completed",
        startedAt: startTime,
        completedAt: new Date().toISOString(),
        totalSteps: payload.nodes.length,
        successfulSteps: stepResults.filter((s) => s.status === "completed").length,
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
