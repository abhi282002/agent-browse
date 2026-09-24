import { syncBackgroundProgress } from './syncBackgroundProgress';
import { handleFinishedBackgroundRun } from './handleFinishedBackgroundRun';
import type { PollBackgroundRunParams } from './types';

const TERMINAL_STATUSES = new Set([
  'COMPLETED', 'FAILED', 'CANCELED', 'CRASHED', 'INTERRUPTED', 'SYSTEM_FAILURE', 'EXPIRED', 'TIMED_OUT',
]);

export async function executePollTick(params: PollBackgroundRunParams): Promise<boolean> {
  const { activeWorkflow, runId, context, utils, activeSessionIdRef, setExecutionResult, setLocalWorkflows, serverWorkflows, onStepStatusChange, onNodesBatchUpdate } = params;

  const rawRun = await utils.execution.getRunStatus.fetch({ runId });
  const runData = rawRun as {
    status: string;
    output?: unknown;
    startedAt?: string;
    finishedAt?: string;
    metadata?: Record<string, unknown> | null;
  };

  const metadata = (runData.metadata || {}) as Record<string, unknown>;
  const browserbaseMeta = metadata.browserbase as { sessionId?: string; liveViewUrl?: string } | undefined;
  if (browserbaseMeta?.sessionId && activeSessionIdRef.current !== browserbaseMeta.sessionId) {
    activeSessionIdRef.current = browserbaseMeta.sessionId;
  }

  const activeStep = metadata.activeStep as { stepId?: string } | undefined;
  const currentStatus = (runData.status || '').toUpperCase();
  const isFinishedRun = TERMINAL_STATUSES.has(currentStatus);
  const activeIndex = activeStep?.stepId ? activeWorkflow.nodes.findIndex((node) => node.id === activeStep.stepId) : -1;

  syncBackgroundProgress({
    activeWorkflow,
    metadata,
    activeStepId: activeStep?.stepId || null,
    activeIndex,
    isFinishedRun,
    setLocalWorkflows,
    serverWorkflows,
    onStepStatusChange,
    onNodesBatchUpdate,
  });

  if (isFinishedRun) {
    handleFinishedBackgroundRun({
      activeWorkflow,
      runData,
      metadata,
      browserbaseMeta,
      currentStatus,
      runId,
      context,
      setExecutionResult,
      setLocalWorkflows,
      serverWorkflows,
    });
  }

  return isFinishedRun;
}
