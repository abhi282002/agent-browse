import { task, schedules, metadata } from '@trigger.dev/sdk';
import toposort from 'toposort';
import { ensureStagehandExtensionPath } from '@/server/services/stagehandUtils';
import { executeNode } from '@/server/services/nodeRegistry';
import type { WorkflowExecutionNode } from '@/server/services/nodes/types';
import { WorkflowService } from '@/server/services/workflowService';
import { toJsonSafeMetadata } from './workflowMetadataUtils';
import type {
  BrowserSessionLike,
  TriggerWorkflowPayload,
} from './workflowTypes';
import {
  BrowserbaseService,
  type WorkflowExecutionResult,
  type StepExecutionResult,
} from '@/server/services/browserbaseService';
import {
  browserbase,
  Stagehand,
  type StagehandBrowser,
  type Page,
} from '@browserbasehq/stagehand';

ensureStagehandExtensionPath();

/**
 * Reusable utility functions for managing real-time Trigger.dev execution metadata
 */
export const workflowMetadataUtils = {
  /**
   * Initializes workflow metadata at the start of pipeline execution
   */
  initWorkflow(data: {
    workflowId: string;
    workflowName: string;
    totalSteps: number;
    startedAt: string;
  }) {
    metadata.set('workflow', {
      id: data.workflowId,
      name: data.workflowName,
      status: 'running',
      totalSteps: data.totalSteps,
      startedAt: data.startedAt,
    });
  },

  /**
   * Records that a step has started executing
   */
  startStep(step: {
    stepId: string;
    stepNumber: number;
    title: string;
    startedAtMs: number;
  }) {
    metadata.set('activeStep', {
      stepId: step.stepId,
      stepNumber: step.stepNumber,
      title: step.title,
      status: 'executing',
      startedAt: new Date().toISOString(),
    });
    metadata.set(`step:${step.stepId}`, {
      stepId: step.stepId,
      status: 'executing',
      stepNumber: step.stepNumber,
      title: step.title,
      startedAtMs: step.startedAtMs,
      logs: [`Starting step ${step.stepNumber}: "${step.title}"...`],
    });
  },

  /**
   * Records that a step has completed successfully
   */
  completeStep(step: {
    stepId: string;
    stepNumber: number;
    title: string;
    durationMs: number;
    logs: string[];
    output?: Record<string, unknown> | null;
  }) {
    const metadataValue: Parameters<typeof metadata.set>[1] = {
      stepId: step.stepId,
      stepNumber: step.stepNumber,
      title: step.title,
      status: 'completed',
      durationMs: step.durationMs,
      logs: step.logs,
      error: null,
      outputSummary: step.output
        ? (toJsonSafeMetadata(step.output) as Parameters<
            typeof metadata.set
          >[1])
        : null,
    };

    metadata.set(`step:${step.stepId}`, metadataValue);
  },

  /**
   * Records that a step failed
   */
  failStep(step: {
    stepId: string;
    stepNumber: number;
    title: string;
    durationMs: number;
    errorMessage: string;
  }) {
    metadata.set(`step:${step.stepId}`, {
      stepId: step.stepId,
      stepNumber: step.stepNumber,
      title: step.title,
      status: 'failed',
      durationMs: step.durationMs,
      logs: [`Trigger step encountered error: ${step.errorMessage}`],
      error: step.errorMessage,
    });
  },

  /**
   * Records final status when the entire workflow completes or halts
   */
  finishWorkflow(data: {
    workflowId: string;
    workflowName: string;
    totalSteps: number;
    finalStatus: 'completed' | 'failed';
    stepResults: StepExecutionResult[];
  }) {
    metadata.set('activeStep', null);
    metadata.set('workflow', {
      id: data.workflowId,
      name: data.workflowName,
      status: data.finalStatus,
      totalSteps: data.totalSteps,
      successfulSteps: data.stepResults.filter((s) => s.status === 'completed')
        .length,
      completedAt: new Date().toISOString(),
      steps: data.stepResults.map((step) => ({
        stepId: step.stepId,
        stepNumber: step.stepNumber,
        title: step.title,
        status: step.status,
        durationMs: step.durationMs,
        logs: step.logs,
        error: step.error ?? null,
      })),
    });
  },
};

export async function executeWorkflowPipelineRun(
  payload: TriggerWorkflowPayload,
): Promise<WorkflowExecutionResult> {
  ensureStagehandExtensionPath();
  console.log(
    `[Trigger.dev] Starting workflow pipeline for: "${payload.workflowName}" (${payload.workflowId})`,
  );

  console.log(
    '[Trigger.dev] Credential field presence:',
    payload.nodes
      .filter((node) =>
        ['authentication', 'auth'].includes(
          node.data.archetype?.toLowerCase() || '',
        ),
      )
      .map((node) => ({
        nodeId: node.id,
        hasAuthEmail: Boolean(node.data.authEmail?.trim()),
        hasAuthPassword: Boolean(node.data.authPassword),
      })),
  );

  // Topologically sort nodes using toposort library with fallback to stepNumber
  const nodeIds = payload.nodes.map((node) => node.id);
  let sortedNodeIds: string[] = [];
  try {
    const graphEdges: ReadonlyArray<[string, string]> = (payload.edges || [])
      .filter(
        (edge) =>
          nodeIds.includes(edge.source) && nodeIds.includes(edge.target),
      )
      .map((edge) => [edge.source, edge.target]);

    if (graphEdges.length > 0) {
      sortedNodeIds = toposort.array(nodeIds, graphEdges);
    } else {
      sortedNodeIds = [...payload.nodes]
        .sort(
          (nodeA, nodeB) =>
            (nodeA.data.stepNumber || 0) - (nodeB.data.stepNumber || 0),
        )
        .map((node) => node.id);
    }
  } catch (toposortError) {
    console.warn(
      '[Trigger.dev] Cycle detected in workflow graph or toposort failed. Falling back to stepNumber order:',
      toposortError,
    );
    sortedNodeIds = [...payload.nodes]
      .sort(
        (nodeA, nodeB) =>
          (nodeA.data.stepNumber || 0) - (nodeB.data.stepNumber || 0),
      )
      .map((node) => node.id);
  }

  const nodeMap = new Map(payload.nodes.map((node) => [node.id, node]));
  const orderedNodes = sortedNodeIds
    .map((id) => nodeMap.get(id))
    .filter((node): node is (typeof payload.nodes)[number] => Boolean(node));

  const startTime = new Date().toISOString();
  let sessionId = `trigger-${Date.now().toString(36)}`;
  let currentTargetUrl = payload.targetUrl || '';
  const pipelineOutputs: Record<string, unknown> = {};
  let previousStepOutput: Record<string, unknown> | undefined = undefined;
  const stepResults: StepExecutionResult[] = [];
  let anyStepFailed = false;

  // 1. Initial Trigger.dev Run Metadata
  workflowMetadataUtils.initWorkflow({
    workflowId: payload.workflowId,
    workflowName: payload.workflowName,
    totalSteps: orderedNodes.length,
    startedAt: startTime,
  });

  const status = BrowserbaseService.getStatus();
  let browser: StagehandBrowser | undefined;
  let stagehand: Stagehand | undefined;
  let page: Page | undefined;
  let browserInitError: string | undefined;

  if (!status.isConfigured) {
    browserInitError = `Browserbase is not configured: BROWSERBASE_API_KEY=${status.apiKeyPresent ? 'present' : 'MISSING'}, BROWSERBASE_PROJECT_ID=${status.projectIdPresent ? 'present' : 'MISSING'}. Add both to Trigger.dev Environment Variables at cloud.trigger.dev.`;
    console.error('[Trigger.dev] Browser not configured:', browserInitError);
  } else {
    try {
      let contextId = payload.contextId;
      if (!contextId && payload.workflowId) {
        try {
          contextId = await BrowserbaseService.getOrCreateWorkflowContext(
            payload.workflowId,
          );
        } catch (e) {
          console.warn('[Trigger.dev] Could not resolve workflow context:', e);
        }
      }

      browser = await BrowserbaseService.launchSafeBrowser({
        contextId,
        workflowId: payload.workflowId,
      });

      const bbSessionId =
        browser?.sessionId ||
        (browser as BrowserSessionLike | undefined)?.id ||
        undefined;
      if (bbSessionId) {
        sessionId = bbSessionId;
        metadata.set('browserbase', {
          sessionId: bbSessionId,
          contextId: contextId || null,
          liveViewUrl: `https://browserbase.com/sessions/${bbSessionId}`,
        });
      }

      stagehand = await Stagehand.create({
        browser,
        domSettleTimeoutMs: 10_000,
        selfHeal: true,
      });
      const pages = await browser.context.pages();
      page = pages[0];
    } catch (err) {
      // Capture the real error so it surfaces in step failure messages
      browserInitError = err instanceof Error ? err.message : String(err);
      console.error(
        '[Trigger.dev] Browser initialization failed:',
        browserInitError,
      );
    }
  }

  try {
    for (let index = 0; index < orderedNodes.length; index++) {
      const currentNode = orderedNodes[index];
      const stepNumber = currentNode.data.stepNumber || index + 1;
      const stepStartMs = Date.now();

      // 2. Real-time Trigger.dev Metadata: Node starts executing
      workflowMetadataUtils.startStep({
        stepId: currentNode.id,
        stepNumber,
        title: currentNode.data.title,
        startedAtMs: stepStartMs,
      });

      try {
        if (currentNode.data?.url && currentNode.data.url.startsWith('http')) {
          currentTargetUrl = currentNode.data.url;
        }

        const activePage =
          (await browser?.context.activePage().catch(() => undefined)) || page;

        const isNonBrowserArchetype = [
          'email',
          'webhook',
          'summarization',
          'news_summary',
        ].includes(currentNode.data.archetype?.toLowerCase() || '');

        if (!isNonBrowserArchetype && (!stagehand || !activePage)) {
          throw new Error(
            browserInitError
              ? `Browser automation failed to initialize: ${browserInitError}`
              : 'Browser automation context is not available.',
          );
        }

        const nodeExecution = await executeNode(currentNode, {
          stagehand: stagehand as Stagehand,
          page: activePage as Page,
          targetUrl: currentTargetUrl,
          aiModel: payload.aiModel,
          userEmail: payload.userEmail,
          organization: payload.organization,
          pipelineOutputs,
          previousStepOutput,
          workflowNodes: orderedNodes as WorkflowExecutionNode[],
        });

        if (nodeExecution.output) {
          if (
            typeof nodeExecution.output.targetUrl === 'string' &&
            nodeExecution.output.targetUrl.startsWith('http')
          ) {
            currentTargetUrl = nodeExecution.output.targetUrl;
          } else if (!nodeExecution.output.targetUrl && currentTargetUrl) {
            nodeExecution.output.targetUrl = currentTargetUrl;
          }
          pipelineOutputs[currentNode.id] = nodeExecution.output;
          previousStepOutput = nodeExecution.output;
        }

        const durationMs = Date.now() - stepStartMs;
        const stepResult: StepExecutionResult = {
          stepId: currentNode.id,
          stepNumber,
          title: currentNode.data.title,
          status: 'completed',
          durationMs,
          logs: nodeExecution.logs,
          output: nodeExecution.output,
        };
        stepResults.push(stepResult);

        // 3. Real-time Trigger.dev Metadata: Node finished (completed) + duration
        workflowMetadataUtils.completeStep({
          stepId: currentNode.id,
          stepNumber,
          title: currentNode.data.title,
          durationMs,
          logs: nodeExecution.logs,
          output: nodeExecution.output,
        });
      } catch (stepError) {
        anyStepFailed = true;
        const errorMessage =
          stepError instanceof Error ? stepError.message : String(stepError);
        const durationMs = Date.now() - stepStartMs;

        const failedStepResult: StepExecutionResult = {
          stepId: currentNode.id,
          stepNumber,
          title: currentNode.data.title,
          status: 'failed',
          durationMs,
          logs: [`Trigger step encountered error: ${errorMessage}`],
          error: errorMessage,
        };
        stepResults.push(failedStepResult);

        workflowMetadataUtils.failStep({
          stepId: currentNode.id,
          stepNumber,
          title: currentNode.data.title,
          durationMs,
          errorMessage,
        });

        console.error(
          `[Trigger.dev] Step ${stepNumber} failed: "${currentNode.data.title}". Aborting remaining steps.`,
        );
        // Abort execution: do not execute subsequent nodes
        break;
      }
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  const finalStatus = anyStepFailed ? 'failed' : 'completed';
  workflowMetadataUtils.finishWorkflow({
    workflowId: payload.workflowId,
    workflowName: payload.workflowName,
    totalSteps: orderedNodes.length,
    finalStatus,
    stepResults,
  });

  console.log(
    `[Trigger.dev] Finished workflow execution: Status = ${finalStatus}`,
  );

  return {
    workflowId: payload.workflowId,
    workflowName: payload.workflowName,
    targetUrl: currentTargetUrl,
    sessionId,
    liveViewUrl: `https://browserbase.com/sessions/${sessionId}`,
    status: finalStatus,
    startedAt: startTime,
    completedAt: new Date().toISOString(),
    totalSteps: orderedNodes.length,
    successfulSteps: stepResults.filter((s) => s.status === 'completed').length,
    steps: stepResults,
  };
}

export const executeWorkflowPipelineTask = task({
  id: 'execute-workflow-pipeline',
  run: executeWorkflowPipelineRun,
});

/**
 * Scheduled workflow task triggered dynamically by Trigger.dev schedules.
 */
export const executeScheduledWorkflowTask = schedules.task({
  id: 'execute-scheduled-workflow',
  run: async (payload): Promise<WorkflowExecutionResult> => {
    ensureStagehandExtensionPath();
    const workflowId = payload.externalId;
    console.log(
      `[Trigger.dev Schedule] Fired task for workflow ID "${workflowId}" at ${payload.timestamp} (${payload.timezone})`,
    );

    if (!workflowId) {
      throw new Error(
        'executeScheduledWorkflowTask received run without externalId (workflowId)',
      );
    }

    const workflow = await WorkflowService.getById(workflowId);
    if (!workflow) {
      throw new Error(
        `Scheduled workflow ID "${workflowId}" was not found in database.`,
      );
    }

    console.log(
      `[Trigger.dev Schedule] Executing workflow: "${workflow.name}"`,
    );
    const resolvedTargetUrl =
      (workflow.targetUrl && workflow.targetUrl.startsWith('http')
        ? workflow.targetUrl
        : undefined) ||
      workflow.nodes.find(
        (node) =>
          typeof node?.data?.url === 'string' &&
          node.data.url.startsWith('http'),
      )?.data.url ||
      '';

    const normalizedPayload: TriggerWorkflowPayload = {
      workflowId: workflow.id,
      workflowName: workflow.name,
      targetUrl: resolvedTargetUrl || undefined,
      aiModel: workflow.aiModel,
      organization: workflow.organization
        ? {
            id: workflow.organization.id,
            name: workflow.organization.name,
            aiInstructions: workflow.organization.aiInstructions || undefined,
            defaultAiModel: workflow.organization.defaultAiModel || undefined,
          }
        : undefined,
      nodes: workflow.nodes as TriggerWorkflowPayload['nodes'],
      edges: workflow.edges as TriggerWorkflowPayload['edges'],
    };

    const result = await executeWorkflowPipelineRun(normalizedPayload);

    console.log(
      `[Trigger.dev Schedule] Workflow "${workflow.name}" completed with status: ${result.status}`,
    );
    return result;
  },
});
