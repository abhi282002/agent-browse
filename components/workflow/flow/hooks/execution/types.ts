import type { WorkflowBlueprint, StepNodeStatus } from '../../types';
import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';

export interface WorkflowUpdateCallbacks {
  setLocalWorkflows: React.Dispatch<
    React.SetStateAction<WorkflowBlueprint[] | null>
  >;
  serverWorkflows?: unknown[];
  onStepStatusChange?: (
    nodeId: string,
    status: StepNodeStatus,
    logs?: string[],
  ) => void;
  onNodesBatchUpdate?: (
    updates: Array<{
      id: string;
      data: Partial<WorkflowBlueprint['nodes'][number]['data']>;
    }>,
  ) => void;
}

export interface RunContext {
  startTime: string;
  currentSessionId: string;
  currentTargetUrl: string;
  initialResult: WorkflowExecutionResult;
}

export interface PollBackgroundRunParams extends WorkflowUpdateCallbacks {
  activeWorkflow: WorkflowBlueprint;
  runId: string;
  context: RunContext;
  utils: any;
  activeSessionIdRef: React.MutableRefObject<string | null>;
  isAbortedRef: React.MutableRefObject<boolean>;
  setExecutionResult: (res: WorkflowExecutionResult) => void;
}
