import { toast } from '@/components/ui/toast';
import type { WorkflowBlueprint, StepNodeStatus } from '../../types';
import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';
import type { WorkflowUpdateCallbacks } from './types';

interface HandleSyncParams extends WorkflowUpdateCallbacks {
  activeWorkflow: WorkflowBlueprint;
  result: WorkflowExecutionResult;
  setExecutionResult: (res: WorkflowExecutionResult) => void;
}

export function handleSyncExecution({
  activeWorkflow,
  result,
  setExecutionResult,
  setLocalWorkflows,
  serverWorkflows,
  onStepStatusChange,
  onNodesBatchUpdate,
}: HandleSyncParams) {
  setExecutionResult(result);
  const nodeBatchUpdates: Array<{ id: string; data: Partial<WorkflowBlueprint['nodes'][number]['data']> }> = [];

  setLocalWorkflows((previousWorkflows) => {
    const base = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
    return base.map((workflow) => {
      if (workflow.id !== activeWorkflow.id) return workflow;
      const nodes = workflow.nodes.map((node) => {
        const step = result.steps.find((resultStep) => resultStep.stepId === node.id);
        if (!step) return node;
        const status = (step.status === 'completed' ? 'completed' : 'failed') as StepNodeStatus;
        onStepStatusChange?.(node.id, status, step.logs);
        const nodeData = { status, durationMs: step.durationMs, errorMessage: step.error || undefined, logLines: [...(node.data.logLines || []), ...step.logs] };
        nodeBatchUpdates.push({ id: node.id, data: nodeData });
        return { ...node, data: { ...node.data, ...nodeData } };
      });
      return { ...workflow, nodes, status: (result.status as any) || 'completed' };
    });
  });

  if (nodeBatchUpdates.length > 0) onNodesBatchUpdate?.(nodeBatchUpdates);
  const failedStep = result.steps.find((step) => step.status === 'failed');
  const isSuccess = result.status === 'completed' && !failedStep;

  if (isSuccess) {
    toast.success('Workflow Finished', { description: `"${activeWorkflow.name}" completed successfully (${result.successfulSteps}/${result.totalSteps} steps).` });
  } else {
    toast.error('Workflow Failed', { description: `"${activeWorkflow.name}" execution failed: ${failedStep?.error || 'One or more steps failed.'}` });
  }
}
