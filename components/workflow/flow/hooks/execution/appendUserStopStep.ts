import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';

export function appendUserStopStep(
  prev: WorkflowExecutionResult | null,
): WorkflowExecutionResult | null {
  if (!prev) return null;
  return {
    ...prev,
    status: 'failed',
    completedAt: new Date().toISOString(),
    steps: [
      ...prev.steps,
      {
        stepId: 'user-stop',
        stepNumber: prev.steps.length + 1,
        title: 'Execution Stopped',
        status: 'failed',
        durationMs: 0,
        logs: ['Execution halted by user.'],
        error: 'Execution stopped by user.',
      },
    ],
  };
}
