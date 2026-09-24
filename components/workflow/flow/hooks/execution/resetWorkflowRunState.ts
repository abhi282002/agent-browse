import type { WorkflowBlueprint, StepNodeStatus } from '../../types';
import type { WorkflowUpdateCallbacks } from './types';

interface ResetRunStateParams extends WorkflowUpdateCallbacks {
  activeWorkflow: WorkflowBlueprint;
}

export function resetWorkflowRunState({
  activeWorkflow,
  setLocalWorkflows,
  serverWorkflows,
  onStepStatusChange,
  onNodesBatchUpdate,
}: ResetRunStateParams) {
  const resetBatch = activeWorkflow.nodes.map((node) => ({
    id: node.id,
    data: {
      status: 'idle' as StepNodeStatus,
      durationMs: undefined,
      errorMessage: undefined,
      logLines: [],
    },
  }));

  onNodesBatchUpdate?.(resetBatch);
  activeWorkflow.nodes.forEach((node) =>
    onStepStatusChange?.(node.id, 'idle', []),
  );

  setLocalWorkflows((previousWorkflows) => {
    const base =
      previousWorkflows ??
      (serverWorkflows as unknown as WorkflowBlueprint[]) ??
      [];
    return base.map((wf) => {
      if (wf.id !== activeWorkflow.id) return wf;
      const updatedNodes = wf.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: 'idle' as StepNodeStatus,
          durationMs: undefined,
          errorMessage: undefined,
          logLines: [],
        },
      }));
      return { ...wf, nodes: updatedNodes, status: 'running' as const };
    });
  });
}
