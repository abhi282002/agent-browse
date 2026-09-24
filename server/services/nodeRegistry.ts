import type { NodeArchetype } from '@/components/workflow/flow/types';
import type {
  WorkflowExecutionNode,
  NodeExecutionContext,
  NodeExecutionOutput,
  NodeHandler,
} from './nodes/types';
import { executeNavigationNode } from './nodes/navigationNode';
import { executeGroundingNode } from './nodes/groundingNode';
import { executeActionNode } from './nodes/actionNode';
import { executeFormNode } from './nodes/formNode';
import { executeExtractionNode } from './nodes/extractionNode';
import { executeWebhookNode } from './nodes/webhookNode';
import { executeSummarizationNode } from './nodes/summarizationNode';
import { executeNewsGatherNode } from './nodes/newsGatherNode';
import { executeNewsSummarizationNode } from './nodes/newsSummarizationNode';
import { executeEmailNode } from './nodes/emailNode';
import { executeOpenUrlNode } from './nodes/openUrlNode';
import { executeAuthenticationNode } from './nodes/authenticationNode';
import { pickFirstString } from './nodes/nodeUtils';

export type {
  WorkflowExecutionNode,
  NodeExecutionContext,
  NodeExecutionOutput,
  NodeHandler,
};

export {
  pickFirstString,
  executeNavigationNode,
  executeGroundingNode,
  executeActionNode,
  executeFormNode,
  executeExtractionNode,
  executeWebhookNode,
  executeSummarizationNode,
  executeNewsGatherNode,
  executeNewsSummarizationNode,
  executeEmailNode,
  executeOpenUrlNode,
  executeAuthenticationNode,
};

export const NODE_REGISTRY: Record<NodeArchetype | string, NodeHandler> = {
  open_url: executeOpenUrlNode,
  navigation: executeNavigationNode,
  grounding: executeGroundingNode,
  action: executeActionNode,
  form: executeFormNode,
  fill_form: executeFormNode,
  extraction: executeExtractionNode,
  webhook: executeWebhookNode,
  summarization: executeSummarizationNode,
  news_gather: executeNewsGatherNode,
  news_summary: executeNewsSummarizationNode,
  email: executeEmailNode,
  authentication: executeAuthenticationNode,
  auth: executeAuthenticationNode,
};

export function resolveNodeHandler(archetype?: string): {
  handler: NodeHandler;
  archetypeKey: string;
} {
  const archetypeKey = (archetype || 'action').toLowerCase();
  const handler = NODE_REGISTRY[archetypeKey] || NODE_REGISTRY.action;
  return { handler, archetypeKey };
}

export async function executeNode(
  node: WorkflowExecutionNode,
  ctx: NodeExecutionContext,
): Promise<NodeExecutionOutput> {
  const { handler, archetypeKey } = resolveNodeHandler(node.data.archetype);

  console.log(
    `[Pipeline] Step ${node.data.stepNumber || '?'}: "${node.data.title}" -> [Handler: ${archetypeKey}]`,
  );

  const stepStart = Date.now();
  const result = await handler(node, ctx);
  const durationMs = Date.now() - stepStart;

  console.log(
    `[Pipeline] Step ${node.data.stepNumber || '?'}: Finished "${node.data.title}" in ${durationMs}ms`,
  );

  return {
    output: result.output,
    logs: result.logs,
  };
}
