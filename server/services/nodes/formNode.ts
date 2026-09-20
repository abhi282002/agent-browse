import type { NodeHandler } from './types';

/**
 * Form Archetype Handler
 * Specialized action step for input fields, password injection, and submissions
 */
export const executeFormNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const formInstruction =
    node.data.actionSummary || node.data.description || node.data.title;
  logs.push(`Executing Form step: "${formInstruction}"`);
  await ctx.stagehand.act(formInstruction);
  logs.push('Form inputs filled and submitted');
  return { logs };
};
