import { toast } from '@/components/ui/toast';
import { buildFinishedRunResult } from './buildFinishedRunResult';
import type { WorkflowBlueprint } from '../../types';
import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';
import type { WorkflowUpdateCallbacks, RunContext } from './types';

interface HandleFinishedRunParams extends WorkflowUpdateCallbacks {
  activeWorkflow: WorkflowBlueprint;
  runData: { output?: unknown; startedAt?: string; finishedAt?: string };
  metadata: Record<string, unknown>;
  browserbaseMeta?: { sessionId?: string; liveViewUrl?: string };
  currentStatus: string;
  runId: string;
  context: RunContext;
  setExecutionResult: (res: WorkflowExecutionResult) => void;
}

export function handleFinishedBackgroundRun({
  activeWorkflow,
  runData,
  metadata,
  browserbaseMeta,
  currentStatus,
  runId,
  context,
  setExecutionResult,
  setLocalWorkflows,
  serverWorkflows,
}: HandleFinishedRunParams) {
  const isSuccess = currentStatus === 'COMPLETED';
  const result = buildFinishedRunResult(activeWorkflow, runData, metadata, browserbaseMeta, runId, context, isSuccess);
  setExecutionResult(result);

  setLocalWorkflows((previousWorkflows) => {
    const base = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
    return base.map((workflow) => (workflow.id === activeWorkflow.id ? { ...workflow, status: (isSuccess ? 'completed' : 'idle') as any } : workflow));
  });

  if (isSuccess) {
    toast.success('Workflow Finished', { description: `"${activeWorkflow.name}" completed successfully.` });
  } else {
    toast.error('Workflow Failed', { description: `"${activeWorkflow.name}" execution ${currentStatus.toLowerCase()}.` });
  }
}
