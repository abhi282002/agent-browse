import { resolveStepStatus } from '../resolveStepStatus';
import type { WorkflowBlueprint } from '../../types';
import type { WorkflowUpdateCallbacks } from './types';

interface SyncProgressParams extends WorkflowUpdateCallbacks {
  activeWorkflow: WorkflowBlueprint;
  metadata: Record<string, unknown>;
  activeStepId: string | null;
  activeIndex: number;
  isFinishedRun: boolean;
}

export function syncBackgroundProgress({
  activeWorkflow,
  metadata,
  activeStepId,
  activeIndex,
  isFinishedRun,
  setLocalWorkflows,
  serverWorkflows,
  onStepStatusChange,
  onNodesBatchUpdate,
}: SyncProgressParams) {
  const nodeBatchUpdates: Array<{ id: string; data: Partial<WorkflowBlueprint['nodes'][number]['data']> }> = [];

  setLocalWorkflows((previousWorkflows) => {
    const base = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
    return base.map((workflow) => {
      if (workflow.id !== activeWorkflow.id) return workflow;
      const nodes = workflow.nodes.map((node, nodeIndex) => {
        const stepMeta = metadata[`step:${node.id}`] as { status?: string; durationMs?: number; error?: string | null; logs?: string[] } | undefined;
        const status = resolveStepStatus({
          metaStatus: stepMeta?.status,
          isFinishedRun,
          isActiveStep: activeStepId === node.id,
          nodeIndex,
          activeIndex,
          currentStatus: node.data.status,
        });
        const logs = stepMeta?.logs?.length ? Array.from(new Set([...(node.data.logLines || []), ...stepMeta.logs])) : node.data.logLines;
        const nodeData = { status, durationMs: stepMeta?.durationMs ?? node.data.durationMs, errorMessage: stepMeta?.error || node.data.errorMessage, logLines: logs };

        if (status !== node.data.status || stepMeta?.logs?.length) {
          nodeBatchUpdates.push({ id: node.id, data: nodeData });
          onStepStatusChange?.(node.id, status, stepMeta?.logs);
        }
        return { ...node, data: { ...node.data, ...nodeData } };
      });
      return { ...workflow, nodes };
    });
  });

  if (nodeBatchUpdates.length > 0) onNodesBatchUpdate?.(nodeBatchUpdates);
}
