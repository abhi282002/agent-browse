'use client';

import { useState, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import toposort from 'toposort';
import type { WorkflowBlueprint, StepNodeStatus } from '../types';
import type {
  StepExecutionResult,
  WorkflowExecutionResult,
} from '@/server/services/browserbaseService';

export interface UseWorkflowExecutionOptions {
  activeWorkflow: WorkflowBlueprint | null;
  currentUser?: { email?: string | null; [key: string]: unknown } | null;
  serverWorkflows?: unknown[];
  setLocalWorkflows: React.Dispatch<
    React.SetStateAction<WorkflowBlueprint[] | null>
  >;
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

    if (activeSessionIdRef.current) {
      stopExecutionMutation.mutate({ sessionId: activeSessionIdRef.current });
    }

    if (activeWorkflow) {
      const runningNode = activeWorkflow.nodes.find(
        (node) => node.data.status === 'running',
      );
      if (runningNode) {
        onStepStatusChange?.(runningNode.id, 'idle', [
          'Execution stopped by user.',
        ]);
      }

      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows =
          previousWorkflows ??
          (serverWorkflows as unknown as WorkflowBlueprint[]) ??
          [];
        return baseWorkflows.map((workflow) => {
          if (workflow.id !== activeWorkflow.id) return workflow;
          return {
            ...workflow,
            nodes: workflow.nodes.map((node) =>
              node.data.status === 'running'
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: 'idle' as StepNodeStatus,
                      logLines: [
                        ...(node.data.logLines || []),
                        'Execution stopped by user.',
                      ],
                    },
                  }
                : node,
            ),
            status: 'idle' as const,
          };
        });
      });
    }

    setExecutionResult((previousResult) =>
      previousResult
        ? {
            ...previousResult,
            status: 'failed',
            completedAt: new Date().toISOString(),
            steps: [
              ...previousResult.steps,
              {
                stepId: 'user-stop',
                stepNumber: previousResult.steps.length + 1,
                title: 'Execution Stopped',
                status: 'failed',
                durationMs: 0,
                logs: ['Execution halted by user.'],
                error: 'Execution stopped by user.',
              },
            ],
          }
        : null,
    );
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
      setExecutionError(
        'Workflow has no step nodes to execute. Please add at least one node to run.',
      );
      return;
    }

    isAbortedRef.current = false;
    setIsRunning(true);
    setExecutionError(null);

    // Sort nodes in topological order using toposort (fallback to stepNumber)
    const nodeIds = activeWorkflow.nodes.map((node) => node.id);
    let sortedNodeIds: string[] = [];

    try {
      const graphEdges: ReadonlyArray<[string, string]> = (
        activeWorkflow.edges || []
      )
        .filter(
          (edge) =>
            nodeIds.includes(edge.source) && nodeIds.includes(edge.target),
        )
        .map((edge) => [edge.source, edge.target]);

      if (graphEdges.length > 0) {
        sortedNodeIds = toposort.array(nodeIds, graphEdges);
      } else {
        sortedNodeIds = [...activeWorkflow.nodes]
          .sort(
            (nodeA, nodeB) =>
              (nodeA.data.stepNumber || 0) - (nodeB.data.stepNumber || 0),
          )
          .map((node) => node.id);
      }
    } catch (toposortError) {
      console.warn(
        '[useWorkflowExecution] Cycle detected or toposort failed. Falling back to stepNumber order:',
        toposortError,
      );
      sortedNodeIds = [...activeWorkflow.nodes]
        .sort(
          (nodeA, nodeB) =>
            (nodeA.data.stepNumber || 0) - (nodeB.data.stepNumber || 0),
        )
        .map((node) => node.id);
    }

    const nodeMap = new Map(
      activeWorkflow.nodes.map((node) => [node.id, node]),
    );
    const orderedNodes = sortedNodeIds
      .map((id) => nodeMap.get(id))
      .filter((node): node is (typeof activeWorkflow.nodes)[number] =>
        Boolean(node),
      );

    const startTime = new Date().toISOString();
    const currentSessionId = `wf-run-${Date.now().toString(36)}`;
    activeSessionIdRef.current = currentSessionId;
    const currentTargetUrl = activeWorkflow.targetUrl || '';

    const initialResult: WorkflowExecutionResult = {
      workflowId: activeWorkflow.id,
      workflowName: activeWorkflow.name,
      targetUrl: currentTargetUrl,
      sessionId: currentSessionId,
      liveViewUrl: `https://browserbase.com/sessions/${currentSessionId}`,
      status: 'completed',
      startedAt: startTime,
      completedAt: '',
      totalSteps: orderedNodes.length,
      successfulSteps: 0,
      steps: [],
    };
    setExecutionResult({ ...initialResult });

    // Reset all nodes to idle initially and workflow status to running
    const initialResetBatch = orderedNodes.map((node) => ({
      id: node.id,
      data: {
        status: 'idle' as StepNodeStatus,
        durationMs: undefined,
        errorMessage: undefined,
        logLines: [],
      },
    }));
    onNodesBatchUpdate?.(initialResetBatch);
    orderedNodes.forEach((node) => onStepStatusChange?.(node.id, 'idle', []));

    setLocalWorkflows((previousWorkflows) => {
      const baseWorkflows =
        previousWorkflows ??
        (serverWorkflows as unknown as WorkflowBlueprint[]) ??
        [];
      return baseWorkflows.map((workflow) => {
        if (workflow.id !== activeWorkflow.id) return workflow;
        const updatedNodes = workflow.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            status: 'idle' as StepNodeStatus,
            durationMs: undefined,
            errorMessage: undefined,
            logLines: [],
          },
        }));
        return { ...workflow, nodes: updatedNodes, status: 'running' as const };
      });
    });

    try {
      console.log('orderedNodes', JSON.stringify(orderedNodes, null, 2));
      const response = await startExecutionMutation.mutateAsync({
        workflowId: activeWorkflow.id,
        workflowName: activeWorkflow.name,
        targetUrl: currentTargetUrl,
        aiModel: activeWorkflow.aiModel,
        userEmail: currentUser?.email || undefined,
        nodes: orderedNodes.map((node) => ({
          id: node.id,
          data: {
            stepNumber: node.data.stepNumber,
            title: node.data.title,
            category: node.data.category,
            badge: node.data.badge,
            description: node.data.description,
            actionSummary: node.data.actionSummary,
            url: node.data.url,
            archetype: node.data.archetype,
            selector: node.data.selector,
            payload: node.data.payload,
            emailProvider: node.data.emailProvider,
            authEmail: node.data.authEmail,
            authPassword: node.data.authPassword,
            aiModel: node.data.aiModel,
            metrics: node.data.metrics,
          },
        })),
        edges: (activeWorkflow.edges || []).map((edge) => ({
          source: edge.source,
          target: edge.target,
        })),
      });

      if (isAbortedRef.current) {
        setIsRunning(false);
        return;
      }

      if (response && 'result' in response && response.result) {
        // Direct execution completed synchronously
        const result = response.result as WorkflowExecutionResult;
        setExecutionResult(result);

        const directBatch: Array<{
          id: string;
          data: Partial<WorkflowBlueprint['nodes'][number]['data']>;
        }> = [];

        setLocalWorkflows((previousWorkflows) => {
          const baseWorkflows =
            previousWorkflows ??
            (serverWorkflows as unknown as WorkflowBlueprint[]) ??
            [];
          return baseWorkflows.map((workflow) => {
            if (workflow.id !== activeWorkflow.id) return workflow;
            const updatedNodes = workflow.nodes.map((node) => {
              const stepResult = result.steps.find(
                (step) => step.stepId === node.id,
              );
              if (stepResult) {
                const finalStatus = (
                  stepResult.status === 'completed' ? 'completed' : 'failed'
                ) as StepNodeStatus;
                onStepStatusChange?.(node.id, finalStatus, stepResult.logs);
                const dataUpdate = {
                  status: finalStatus,
                  durationMs: stepResult.durationMs,
                  errorMessage: stepResult.error || undefined,
                  logLines: [...(node.data.logLines || []), ...stepResult.logs],
                };
                directBatch.push({ id: node.id, data: dataUpdate });
                return {
                  ...node,
                  data: {
                    ...node.data,
                    ...dataUpdate,
                  },
                };
              }
              return node;
            });
            return {
              ...workflow,
              nodes: updatedNodes,
              status:
                (result.status as
                  'idle' | 'running' | 'completed' | 'paused') || 'completed',
            };
          });
        });

        if (directBatch.length > 0) {
          onNodesBatchUpdate?.(directBatch);
        }
      } else if (response?.runId && response.isBackground) {
        // Background execution on Trigger.dev - poll real-time status and metadata
        activeSessionIdRef.current = response.runId;
        const pollIntervalMs = 1000;
        const terminalStatuses = new Set([
          'COMPLETED',
          'FAILED',
          'CANCELED',
          'CRASHED',
          'INTERRUPTED',
          'SYSTEM_FAILURE',
          'EXPIRED',
          'TIMED_OUT',
        ]);

        let isFinished = false;
        let consecutiveErrors = 0;

        while (!isFinished && !isAbortedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
          if (isAbortedRef.current) break;

          try {
            const rawRunData = await utils.execution.getRunStatus.fetch({
              runId: response.runId,
            });
            const runData = rawRunData as {
              id: string;
              status: string;
              output?: unknown;
              error?: unknown;
              startedAt?: string;
              finishedAt?: string;
              metadata?: Record<string, unknown> | null;
            };
            consecutiveErrors = 0;

            const metadata = (runData.metadata || {}) as Record<
              string,
              unknown
            >;
            const browserbaseMeta = metadata.browserbase as
              { sessionId?: string; liveViewUrl?: string } | undefined;

            if (
              browserbaseMeta?.sessionId &&
              activeSessionIdRef.current !== browserbaseMeta.sessionId
            ) {
              activeSessionIdRef.current = browserbaseMeta.sessionId;
            }

            const activeStep = metadata.activeStep as
              { stepId?: string; title?: string; status?: string } | undefined;
            const currentStatus = (runData.status || '').toUpperCase();
            const isFinishedRun = terminalStatuses.has(currentStatus);

            const activeStepId = activeStep?.stepId || null;
            const activeIndex = activeStepId
              ? orderedNodes.findIndex((n) => n.id === activeStepId)
              : -1;

            const batchCanvasUpdates: Array<{
              id: string;
              data: Partial<WorkflowBlueprint['nodes'][number]['data']>;
            }> = [];

            // Sync real-time step progress to local workflow canvas & state
            setLocalWorkflows((previousWorkflows) => {
              const baseWorkflows =
                previousWorkflows ??
                (serverWorkflows as unknown as WorkflowBlueprint[]) ??
                [];
              return baseWorkflows.map((workflow) => {
                if (workflow.id !== activeWorkflow.id) return workflow;
                const updatedNodes = workflow.nodes.map((node, nodeIdx) => {
                  const stepMeta = metadata[`step:${node.id}`] as
                    | {
                        status?: string;
                        durationMs?: number;
                        error?: string | null;
                        logs?: string[];
                      }
                    | undefined;

                  let stepStatus: StepNodeStatus = node.data.status;

                  if (isFinishedRun) {
                    if (stepMeta?.status === 'completed') {
                      stepStatus = 'completed';
                    } else if (stepMeta?.status === 'failed') {
                      stepStatus = 'failed';
                    } else {
                      stepStatus =
                        node.data.status === 'running'
                          ? 'failed'
                          : node.data.status;
                    }
                  } else if (stepMeta?.status === 'completed') {
                    stepStatus = 'completed';
                  } else if (stepMeta?.status === 'failed') {
                    stepStatus = 'failed';
                  } else if (
                    stepMeta?.status === 'executing' ||
                    activeStepId === node.id
                  ) {
                    stepStatus = 'running';
                  } else if (activeIndex !== -1) {
                    if (nodeIdx < activeIndex) {
                      stepStatus =
                        node.data.status === 'failed' ? 'failed' : 'completed';
                    } else if (nodeIdx > activeIndex) {
                      stepStatus = 'idle';
                    }
                  }

                  const updatedLogLines =
                    stepMeta?.logs && stepMeta.logs.length > 0
                      ? Array.from(
                          new Set([
                            ...(node.data.logLines || []),
                            ...stepMeta.logs,
                          ]),
                        )
                      : node.data.logLines;

                  const dataUpdate: Partial<
                    WorkflowBlueprint['nodes'][number]['data']
                  > = {
                    status: stepStatus,
                    durationMs: stepMeta?.durationMs ?? node.data.durationMs,
                    errorMessage: stepMeta?.error || node.data.errorMessage,
                    logLines: updatedLogLines,
                  };

                  if (
                    stepStatus !== node.data.status ||
                    (stepMeta?.logs && stepMeta.logs.length > 0)
                  ) {
                    batchCanvasUpdates.push({
                      id: node.id,
                      data: dataUpdate,
                    });
                    onStepStatusChange?.(node.id, stepStatus, stepMeta?.logs);
                  }

                  return {
                    ...node,
                    data: {
                      ...node.data,
                      ...dataUpdate,
                    },
                  };
                });
                return { ...workflow, nodes: updatedNodes };
              });
            });

            if (batchCanvasUpdates.length > 0) {
              onNodesBatchUpdate?.(batchCanvasUpdates);
            }

            // Check if Trigger.dev run has finished
            if (isFinishedRun) {
              isFinished = true;
              const isSuccess = currentStatus === 'COMPLETED';

              if (runData.output) {
                const finalResult = runData.output as WorkflowExecutionResult;
                setExecutionResult(finalResult);
              } else {
                const reconstructedSteps = orderedNodes.map((node, idx) => {
                  const sMeta = metadata[`step:${node.id}`] as
                    StepExecutionResult | undefined;
                  return {
                    stepId: node.id,
                    stepNumber: node.data.stepNumber || idx + 1,
                    title: node.data.title,
                    status:
                      sMeta?.status || (isSuccess ? 'completed' : 'failed'),
                    durationMs: sMeta?.durationMs || 0,
                    logs: sMeta?.logs || (sMeta?.error ? [sMeta.error] : []),
                    error: sMeta?.error || undefined,
                    output: sMeta?.output || undefined,
                  };
                });

                const resolvedSessionId =
                  browserbaseMeta?.sessionId ||
                  (runData.output as any)?.sessionId ||
                  response?.runId ||
                  '';
                const resolvedLiveViewUrl =
                  browserbaseMeta?.liveViewUrl ||
                  (runData.output as any)?.liveViewUrl ||
                  `https://browserbase.com/sessions/${resolvedSessionId}`;

                setExecutionResult({
                  workflowId: activeWorkflow.id,
                  workflowName: activeWorkflow.name,
                  targetUrl: currentTargetUrl,
                  sessionId: resolvedSessionId,
                  liveViewUrl: resolvedLiveViewUrl,
                  status: isSuccess ? 'completed' : 'failed',
                  startedAt: runData.startedAt || startTime,
                  completedAt: runData.finishedAt || new Date().toISOString(),
                  totalSteps: orderedNodes.length,
                  successfulSteps: reconstructedSteps.filter(
                    (s) => s.status === 'completed',
                  ).length,
                  steps: reconstructedSteps as unknown as StepExecutionResult[],
                });
              }

              setLocalWorkflows((previousWorkflows) => {
                const baseWorkflows =
                  previousWorkflows ??
                  (serverWorkflows as unknown as WorkflowBlueprint[]) ??
                  [];
                return baseWorkflows.map((workflow) => {
                  if (workflow.id !== activeWorkflow.id) return workflow;
                  return {
                    ...workflow,
                    status: (isSuccess ? 'completed' : 'idle') as
                      'idle' | 'running' | 'completed' | 'paused',
                  };
                });
              });
            }
          } catch (pollErr) {
            consecutiveErrors++;
            console.warn(
              '[useWorkflowExecution] Polling getRunStatus error:',
              pollErr,
            );
            if (consecutiveErrors > 10) {
              throw new Error(
                'Lost connection to background execution status.',
              );
            }
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setExecutionError(errorMessage);
      console.error('[useWorkflowExecution] Execution error:', errorMessage);

      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows =
          previousWorkflows ??
          (serverWorkflows as unknown as WorkflowBlueprint[]) ??
          [];
        return baseWorkflows.map((workflow) => {
          if (workflow.id !== activeWorkflow.id) return workflow;
          return {
            ...workflow,
            status: 'idle' as const,
          };
        });
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
