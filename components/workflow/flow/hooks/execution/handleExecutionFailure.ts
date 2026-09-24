import { toast } from '@/components/ui/toast';
import type { WorkflowBlueprint } from '../../types';

interface HandleFailureParams {
  error: unknown;
  activeWorkflow: WorkflowBlueprint;
  setExecutionError: (msg: string | null) => void;
  setLocalWorkflows: React.Dispatch<
    React.SetStateAction<WorkflowBlueprint[] | null>
  >;
  serverWorkflows?: unknown[];
}

export function handleExecutionFailure({
  error,
  activeWorkflow,
  setExecutionError,
  setLocalWorkflows,
  serverWorkflows,
}: HandleFailureParams) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  setExecutionError(errorMessage);
  console.error('[useWorkflowExecution] Execution error:', errorMessage);

  toast.error('Workflow Failed', {
    description: errorMessage || 'An unexpected error occurred during execution.',
  });

  setLocalWorkflows((previousWorkflows) => {
    const base = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
    return base.map((workflow) => {
      if (workflow.id !== activeWorkflow.id) return workflow;
      return { ...workflow, status: 'idle' as const };
    });
  });
}
