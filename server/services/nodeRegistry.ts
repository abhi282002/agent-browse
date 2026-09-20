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

export type {
  WorkflowExecutionNode,
  NodeExecutionContext,
  NodeExecutionOutput,
  NodeHandler,
};

export {
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
};

/**
 * Archetype mapping registry
 */
export const NODE_REGISTRY: Record<NodeArchetype | string, NodeHandler> = {
  navigation: executeNavigationNode,
  grounding: executeGroundingNode,
  action: executeActionNode,
  form: executeFormNode,
  extraction: executeExtractionNode,
  webhook: executeWebhookNode,
  summarization: executeSummarizationNode,
  news_gather: executeNewsGatherNode,
  news_extraction: executeNewsGatherNode,
  news_summary: executeNewsSummarizationNode,
  email: executeEmailNode,
};

/**
 * Main node execution dispatcher
 */
export async function executeNode(
  node: WorkflowExecutionNode,
  ctx: NodeExecutionContext,
): Promise<NodeExecutionOutput> {
  const preLogs: string[] = [];

  // If node defines a custom URL different from targetUrl, perform page navigation first
  if (
    node.data.url &&
    node.data.url !== ctx.targetUrl &&
    node.data.url.startsWith('http')
  ) {
    if (ctx.page) {
      await ctx.page.goto(node.data.url, { waitUntil: 'domcontentloaded' });
      preLogs.push(`Navigated to ${node.data.url}`);
    }
  }

  const archetypeKey = (node.data.archetype || 'action').toLowerCase();
  const handler = NODE_REGISTRY[archetypeKey] || NODE_REGISTRY.action;

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
    logs: [...preLogs, ...result.logs],
  };
}
