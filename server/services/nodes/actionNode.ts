import type { NodeHandler } from './types';

/**
 * Action Archetype Handler
 * Standard interaction step (mouse clicks, keystrokes) via stagehand.act
 */
export const executeActionNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const actInstruction = node.data.actionSummary || node.data.title;
  logs.push(`Executing Stagehand action: "${actInstruction}"`);
  await ctx.stagehand.act(actInstruction);
  logs.push('Action executed cleanly');
  return { logs };
};
