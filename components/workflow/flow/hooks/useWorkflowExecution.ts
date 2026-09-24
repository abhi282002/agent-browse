'use client';

import { useState, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/components/ui/toast';
import { initializeRunContext } from './execution/runContext';
import { resetWorkflowRunState } from './execution/resetWorkflowRunState';
import { buildExecutionPayload } from './execution/buildExecutionPayload';
import { handleSyncExecution } from './execution/handleSyncExecution';
import { pollBackgroundRun } from './execution/pollBackgroundRun';
import { handleExecutionFailure } from './execution/handleExecutionFailure';
import { handleStopExecution } from './execution/handleStopExecution';
import type { WorkflowBlueprint, StepNodeStatus } from '../types';
import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';
import type { WorkflowUpdateCallbacks } from './execution/types';

export interface UseWorkflowExecutionOptions extends WorkflowUpdateCallbacks {
  activeWorkflow: WorkflowBlueprint | null;
  currentUser?: { email?: string | null; [key: string]: unknown } | null;
}

export function useWorkflowExecution({
  activeWorkflow,
  currentUser,
  serverWorkflows,
  setLocalWorkflows,
  onStepStatusChange,
  onNodesBatchUpdate,
}: UseWorkflowExecutionOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<WorkflowExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const isAbortedRef = useRef(false);
  const activeSessionIdRef = useRef<string | null>(null);

  const utils = trpc.useUtils();
  const startExecutionMutation = trpc.execution.startExecution.useMutation();
  const stopExecutionMutation = trpc.execution.stopExecution.useMutation();

  const stopPipeline = useCallback(() => {
    isAbortedRef.current = true;
    setIsRunning(false);

    handleStopExecution({
      activeWorkflow,
      activeSessionId: activeSessionIdRef.current,
      stopMutation: stopExecutionMutation,
      setExecutionResult,
      setLocalWorkflows,
      serverWorkflows,
      onStepStatusChange,
    });
  }, [
    activeWorkflow,
    serverWorkflows,
    stopExecutionMutation,
    onStepStatusChange,
    setLocalWorkflows,
  ]);

  const runPipeline = useCallback(async () => {
    if (!activeWorkflow || isRunning) return;
    if (activeWorkflow.nodes.length === 0) {
      const emptyMsg =
        'Workflow has no step nodes to execute. Please add at least one node to run.';
      setExecutionError(emptyMsg);
      toast.warning('Workflow Has No Steps', { description: emptyMsg });
      return;
    }

    isAbortedRef.current = false;
    setIsRunning(true);
    setExecutionError(null);

    toast.info('Workflow Started', {
      description: `Executing "${activeWorkflow.name}"...`,
    });

    const context = initializeRunContext(activeWorkflow);

    activeSessionIdRef.current = context.currentSessionId;

    setExecutionResult(context.initialResult);

    const callbacks = {
      activeWorkflow,
      setLocalWorkflows,
      serverWorkflows,
      onStepStatusChange,
      onNodesBatchUpdate,
    };

    resetWorkflowRunState(callbacks);

    try {
      
      const response = await startExecutionMutation.mutateAsync(
        buildExecutionPayload(activeWorkflow, context, currentUser),
      );

      if (isAbortedRef.current) {
        setIsRunning(false);
        return;
      }

      if (response && 'result' in response && response.result) {
        handleSyncExecution({
          ...callbacks,
          result: response.result as WorkflowExecutionResult,
          setExecutionResult,
        });
      } else if (response?.runId && response.isBackground) {
        await pollBackgroundRun({
          ...callbacks,
          runId: response.runId,
          context,
          utils,
          activeSessionIdRef,
          isAbortedRef,
          setExecutionResult,
        });
      }
    } catch (error) {
      handleExecutionFailure({
        error,
        activeWorkflow,
        setExecutionError,
        setLocalWorkflows,
        serverWorkflows,
      });
    } finally {
      setIsRunning(false);
    }
  }, [
    activeWorkflow,
    isRunning,
    currentUser,
    serverWorkflows,
    startExecutionMutation,
    utils,
    onStepStatusChange,
    onNodesBatchUpdate,
    setLocalWorkflows,
  ]);

  return {
    isRunning: isRunning || startExecutionMutation.isPending,
    executionResult,
    executionError,
    setExecutionError,
    clearExecutionError: () => setExecutionError(null),
    runPipeline,
    stopPipeline,
  };
}
