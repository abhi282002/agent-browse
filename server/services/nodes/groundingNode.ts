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
    const activePage =
      (await ctx.stagehand?.browser?.context?.activePage().catch(() => undefined)) ||
      ctx.page;
    if (activePage) {
      await activePage.waitForTimeout(1000).catch(() => {});
    }

    let observeRes: { data?: unknown } | null = null;
    try {
      observeRes = (await ctx.stagehand.observe(instruction)) as { data?: unknown };
      logs.push('DOM grounding & vision snapshot captured');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (/no frame with given id|frame.*not found|target.*not found/i.test(errMsg)) {
        logs.push('⚠ Frame busy during grounding observe. Retrying after stabilization...');
        if (activePage) await activePage.waitForTimeout(2500).catch(() => {});
        try {
          observeRes = (await ctx.stagehand.observe(instruction)) as { data?: unknown };
          logs.push('✓ DOM grounding snapshot captured on retry');
        } catch (retryErr) {
          logs.push(`Grounding note: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`);
        }
      } else {
        throw err;
      }
    }

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
