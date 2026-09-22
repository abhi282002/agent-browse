"use client";

import { useWorkflow } from "./useWorkflow";
import {
  useWorkflowExecution,
  type UseWorkflowExecutionOptions,
} from "./useWorkflowExecution";
import type { StepNodeStatus } from "../types";

export interface UseWorkflowManagerOptions {
  onStepStatusChange?: (
    nodeId: string,
    status: StepNodeStatus,
    logs?: string[],
  ) => void;
  onNodesBatchUpdate?: (
    updates: Array<{
      id: string;
      data: Partial<any>;
    }>,
  ) => void;
}

/**
 * Orchestration hook that composes canvas workflow state (useWorkflow)
 * with pipeline execution and abort controls (useWorkflowExecution).
 */
export function useWorkflowManager(options?: UseWorkflowManagerOptions) {
  const canvas = useWorkflow();
  const execution = useWorkflowExecution({
    activeWorkflow: canvas.activeWorkflow,
    currentUser: canvas.currentUser,
    serverWorkflows: canvas.serverWorkflows,
    setLocalWorkflows: canvas.setLocalWorkflows,
    onStepStatusChange: options?.onStepStatusChange,
    onNodesBatchUpdate: options?.onNodesBatchUpdate,
  });

  return {
    ...canvas,
    ...execution,
  };
}

export { useWorkflow, useWorkflowExecution };
export type { UseWorkflowExecutionOptions };
