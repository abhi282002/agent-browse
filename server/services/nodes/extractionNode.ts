import type { NodeHandler } from './types';

/**
 * Extraction Archetype Handler
 * Queries and serializes DOM data via Stagehand extract
 */
export const executeExtractionNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const extractInstruction =
    node.data.actionSummary || node.data.description || 'Extract page text';
  logs.push(`Executing Stagehand extract: "${extractInstruction}"`);
  const extractRes = await ctx.stagehand.extract(extractInstruction);
  logs.push('Extraction successful');
  return {
    output: extractRes?.data as Record<string, unknown>,
    logs,
  };
};
