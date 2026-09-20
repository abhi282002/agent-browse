import { task } from "@trigger.dev/sdk";
import {
  BrowserbaseService,
  ensureStagehandExtensionPath,
  type WorkflowExecutionResult,
} from "@/server/services/browserbaseService";

// Ensure Stagehand extension path is prepared in Trigger.dev environment
ensureStagehandExtensionPath();

export interface TriggerWorkflowPayload {
  workflowId: string;
  workflowName: string;
  targetUrl: string;
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
  id: "execute-workflow-pipeline",
  run: async (payload: TriggerWorkflowPayload): Promise<WorkflowExecutionResult> => {
    ensureStagehandExtensionPath();
    console.log(`[Trigger.dev] Starting workflow execution for: "${payload.workflowName}" (${payload.workflowId})`);
    const result = await BrowserbaseService.executeWorkflow(payload);
    console.log(`[Trigger.dev] Finished workflow execution: Status = ${result.status}`);
    return result;
  },
});
