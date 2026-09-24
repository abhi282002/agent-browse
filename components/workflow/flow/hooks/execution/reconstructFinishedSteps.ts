import type { WorkflowBlueprint } from '../../types';
import type { StepExecutionResult } from '@/server/services/browserbaseService';

export function reconstructFinishedSteps(
  nodes: WorkflowBlueprint['nodes'],
  metadata: Record<string, unknown>,
  isSuccess: boolean,
): StepExecutionResult[] {
  return nodes.map((node, nodeIndex) => {
    const stepMetadata = metadata[`step:${node.id}`] as StepExecutionResult | undefined;
    return {
      stepId: node.id,
      stepNumber: node.data.stepNumber || nodeIndex + 1,
      title: node.data.title,
      status: stepMetadata?.status || (isSuccess ? 'completed' : 'failed'),
      durationMs: stepMetadata?.durationMs || 0,
      logs: stepMetadata?.logs || (stepMetadata?.error ? [stepMetadata.error] : []),
      error: stepMetadata?.error || undefined,
      output: stepMetadata?.output || undefined,
    } as StepExecutionResult;
  });
}
