import type { StepNodeStatus } from '../types';

export interface ResolveStepStatusOptions {
  metaStatus?: string;
  isFinishedRun: boolean;
  isActiveStep: boolean;
  nodeIndex: number;
  activeIndex: number;
  currentStatus: StepNodeStatus;
}

/**
 * Resolves the real-time execution status of a workflow step node
 * using explicit switch statements instead of nested if-else chains.
 */
export function resolveStepStatus({
  metaStatus,
  isFinishedRun,
  isActiveStep,
  nodeIndex,
  activeIndex,
  currentStatus,
}: ResolveStepStatusOptions): StepNodeStatus {
  switch (metaStatus) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'executing':
      return 'running';
  }

  if (isFinishedRun) {
    switch (currentStatus) {
      case 'running':
        return 'failed';
      default:
        return currentStatus;
    }
  }

  if (isActiveStep) {
    return 'running';
  }

  if (activeIndex !== -1) {
    switch (true) {
      case nodeIndex < activeIndex:
        return currentStatus === 'failed' ? 'failed' : 'completed';
      case nodeIndex > activeIndex:
        return 'idle';
      default:
        return currentStatus;
    }
  }

  return currentStatus;
}
