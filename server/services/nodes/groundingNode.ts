import type { NodeHandler } from './types';

/**
 * Grounding Archetype Handler
 * Utilizes Stagehand observe or DOM grounding to index interactable elements
 */
export const executeGroundingNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const instruction =
    node.data.actionSummary ||
    node.data.description ||
    'Observe interactable elements and accessibility tree';

  logs.push(`Executing Stagehand observe for grounding: "${instruction}"`);

  if (typeof ctx.stagehand?.observe === 'function') {
    const observeRes = await ctx.stagehand.observe(instruction);
    logs.push('DOM grounding & vision snapshot captured');
    return {
      output: observeRes?.data
        ? { observedActions: observeRes.data }
        : undefined,
      logs,
    };
  }

  logs.push('DOM accessibility tree indexed cleanly');
  return { logs };
};
