import { reconstructFinishedSteps } from './reconstructFinishedSteps';
import type { WorkflowBlueprint } from '../../types';
import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';
import type { RunContext } from './types';

export function buildFinishedRunResult(
  activeWorkflow: WorkflowBlueprint,
  runData: { output?: unknown; startedAt?: string; finishedAt?: string },
  metadata: Record<string, unknown>,
  browserbaseMeta?: { sessionId?: string; liveViewUrl?: string },
  runId?: string,
  context?: RunContext,
  isSuccess: boolean = false,
): WorkflowExecutionResult {
  if (runData.output) return runData.output as WorkflowExecutionResult;
  const steps = reconstructFinishedSteps(activeWorkflow.nodes, metadata, isSuccess);
  const sessionId = browserbaseMeta?.sessionId || (runData.output as any)?.sessionId || runId || '';
  const liveViewUrl = browserbaseMeta?.liveViewUrl || (runData.output as any)?.liveViewUrl || `https://browserbase.com/sessions/${sessionId}`;

  return {
    workflowId: activeWorkflow.id,
    workflowName: activeWorkflow.name,
    targetUrl: context?.currentTargetUrl || '',
    sessionId,
    liveViewUrl,
    status: isSuccess ? 'completed' : 'failed',
    startedAt: runData.startedAt || context?.startTime || new Date().toISOString(),
    completedAt: runData.finishedAt || new Date().toISOString(),
    totalSteps: activeWorkflow.nodes.length,
    successfulSteps: steps.filter((step) => step.status === 'completed').length,
    steps,
  };
}
