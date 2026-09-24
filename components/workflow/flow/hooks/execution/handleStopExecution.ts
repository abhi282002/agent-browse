import { toast } from '@/components/ui/toast';
import { appendUserStopStep } from './appendUserStopStep';
import type { WorkflowBlueprint, StepNodeStatus } from '../../types';
import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';
import type { WorkflowUpdateCallbacks } from './types';

export interface StopExecutionParams extends WorkflowUpdateCallbacks {
  activeWorkflow: WorkflowBlueprint | null;
  activeSessionId: string | null;
  stopMutation: { mutate: (params: { sessionId: string }) => void };
  setExecutionResult: React.Dispatch<
    React.SetStateAction<WorkflowExecutionResult | null>
  >;
}

export function handleStopExecution({
  activeWorkflow,
  activeSessionId,
  stopMutation,
  setExecutionResult,
  setLocalWorkflows,
  serverWorkflows,
  onStepStatusChange,
}: StopExecutionParams) {
  if (activeSessionId) {
    stopMutation.mutate({ sessionId: activeSessionId });
  }

  if (activeWorkflow) {
    const runningNode = activeWorkflow.nodes.find((node) => node.data.status === 'running');
    if (runningNode) onStepStatusChange?.(runningNode.id, 'idle', ['Execution stopped by user.']);

    setLocalWorkflows((previousWorkflows) => {
      const base = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
      return base.map((workflow) => {
        if (workflow.id !== activeWorkflow.id) return workflow;
        const nodes = workflow.nodes.map((node) =>
          node.data.status === 'running'
            ? { ...node, data: { ...node.data, status: 'idle' as StepNodeStatus, logLines: [...(node.data.logLines || []), 'Execution stopped by user.'] } }
            : node,
        );
        return { ...workflow, nodes, status: 'idle' as const };
      });
    });
  }

  setExecutionResult(appendUserStopStep);
  toast.warning('Workflow Stopped', { description: `Execution of "${activeWorkflow?.name || 'workflow'}" was stopped.` });
}
