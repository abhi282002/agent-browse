import { task, schedules } from '@trigger.dev/sdk';
import {
  BrowserbaseService,
  ensureStagehandExtensionPath,
  type WorkflowExecutionResult,
} from '@/server/services/browserbaseService';

// Ensure Stagehand extension path is prepared in Trigger.dev environment
ensureStagehandExtensionPath();

export interface TriggerWorkflowPayload {
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
}

export const executeWorkflowPipelineTask = task({
  id: 'execute-workflow-pipeline',
  run: async (
    payload: TriggerWorkflowPayload,
  ): Promise<WorkflowExecutionResult> => {
    ensureStagehandExtensionPath();
    console.log(
      `[Trigger.dev] Starting workflow execution for: "${payload.workflowName}" (${payload.workflowId})`,
    );
    const result = await BrowserbaseService.executeWorkflow(payload);
    console.log(
      `[Trigger.dev] Finished workflow execution: Status = ${result.status}`,
    );
    return result;
  },
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

    // Lazy load WorkflowService to avoid circular dependencies in Trigger worker bundle
    const { WorkflowService } =
      await import('@/server/services/workflowService');
    const workflow = await WorkflowService.getById(workflowId);
    if (!workflow) {
      throw new Error(
        `Scheduled workflow ID "${workflowId}" was not found in database.`,
      );
    }

    console.log(
      `[Trigger.dev Schedule] Executing workflow: "${workflow.name}"`,
    );
    const result = await BrowserbaseService.executeWorkflow({
      workflowId: workflow.id,
      workflowName: workflow.name,
      aiModel: workflow.aiModel,
      nodes: workflow.nodes,
    });

    console.log(
      `[Trigger.dev Schedule] Workflow "${workflow.name}" completed with status: ${result.status}`,
    );
    return result;
  },
});
