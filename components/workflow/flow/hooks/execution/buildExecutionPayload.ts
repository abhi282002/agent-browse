import type { WorkflowBlueprint } from '../../types';
import type { RunContext } from './types';

export function buildExecutionPayload(
  activeWorkflow: WorkflowBlueprint,
  context: RunContext,
  currentUser?: { email?: string | null } | null,
) {
  return {
    workflowId: activeWorkflow.id,
    workflowName: activeWorkflow.name,
    targetUrl: context.currentTargetUrl,
    aiModel: activeWorkflow.aiModel,
    userEmail: currentUser?.email || undefined,
    nodes: activeWorkflow.nodes.map((node) => ({
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
  };
}
