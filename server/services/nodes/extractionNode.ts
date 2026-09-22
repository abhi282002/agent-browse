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

  const activePage =
    (await ctx.stagehand?.browser?.context?.activePage().catch(() => undefined)) ||
    ctx.page;

  if (activePage) {
    await activePage.waitForTimeout(1000).catch(() => {});
  }

  let extractRes: unknown = null;
  try {
    extractRes = await ctx.stagehand.extract(extractInstruction);
    logs.push('Extraction successful');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (/no frame with given id|frame.*not found|target.*not found/i.test(errorMsg)) {
      logs.push('⚠ Frame was busy or reloading during extract. Retrying after stabilization...');
      if (activePage) await activePage.waitForTimeout(2500).catch(() => {});
      try {
        extractRes = await ctx.stagehand.extract(extractInstruction);
        logs.push('✓ Extraction successful on retry');
      } catch (retryErr) {
        throw retryErr;
      }
    } else {
      throw err;
    }
  }

  if (!extractRes) {
    throw new Error(`Extraction failed to capture data for instruction: "${extractInstruction}".`);
  }

  return {
    output:
      ((extractRes as { data?: unknown })?.data as Record<string, unknown>) ??
      (extractRes as Record<string, unknown>) ??
      undefined,
    logs,
  };
};
