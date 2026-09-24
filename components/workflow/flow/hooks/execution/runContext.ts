import type { WorkflowBlueprint } from '../../types';
import type { RunContext } from './types';

export function initializeRunContext(workflow: WorkflowBlueprint): RunContext {
  const startTime = new Date().toISOString();
  const currentSessionId = `wf-run-${Date.now().toString(36)}`;
  const currentTargetUrl = workflow.targetUrl || '';

  return {
    startTime,
    currentSessionId,
    currentTargetUrl,
    initialResult: {
      workflowId: workflow.id,
      workflowName: workflow.name,
      targetUrl: currentTargetUrl,
      sessionId: currentSessionId,
      liveViewUrl: `https://browserbase.com/sessions/${currentSessionId}`,
      status: 'running',
      startedAt: startTime,
      completedAt: '',
      totalSteps: workflow.nodes.length,
      successfulSteps: 0,
      steps: [],
    },
  };
}
