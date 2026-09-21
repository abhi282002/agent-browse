import type { NodeHandler } from './types';
import { pickFirstString } from './nodeUtils';

/**
 * Navigation Archetype Handler
 * Handles explicit browser URL routing or in-page navigation
 */
export const executeNavigationNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const destinationUrl = pickFirstString(node.data?.url, ctx.targetUrl);

  if (!destinationUrl || !destinationUrl.startsWith('http')) {
    throw new Error('Destination URL is invalid or not found.');
  }

  const activePage =
    (await ctx.stagehand?.browser?.context
      ?.activePage()
      .catch(() => undefined)) || ctx.page;

  if (activePage && destinationUrl) {
    logs.push(`Navigating to URL: ${destinationUrl}`);
    try {
      await activePage.goto(destinationUrl, { waitUntil: 'domcontentloaded' });
      await activePage.waitForTimeout(1500).catch(() => {});
      logs.push('Navigation complete: DOM ready');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (/no frame with given id|frame.*not found/i.test(errMsg)) {
        logs.push(
          '⚠ Frame transition detected during navigation. Waiting for page to stabilize...',
        );
        await activePage.waitForTimeout(2500).catch(() => {});
        logs.push('Navigation stabilized');
      } else {
        throw err;
      }
    }
  } else {
    const actInstruction = node.data.actionSummary || node.data.title;
    logs.push(`Executing navigation action: "${actInstruction}"`);
    try {
      await ctx.stagehand.act(actInstruction);
      logs.push('Navigation action executed cleanly');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (/no frame with given id|frame.*not found/i.test(errorMsg)) {
        logs.push(
          '⚠ Frame transition detected during navigation action. Waiting for page to settle...',
        );
        if (activePage) await activePage.waitForTimeout(2500).catch(() => {});
        await ctx.stagehand.act(actInstruction).catch((retryErr) => {
          logs.push(
            `Navigation note: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
          );
        });
      } else {
        throw err;
      }
    }
  }

  const currentActivePage =
    (await ctx.stagehand?.browser?.context
      ?.activePage()
      .catch(() => undefined)) || activePage;

  let currentTitle = '';
  let currentUrl = '';
  if (currentActivePage) {
    currentUrl = await currentActivePage
      .url()
      .catch(() => destinationUrl || '');
    currentTitle = await currentActivePage.title().catch(() => '');
  }

  return {
    output: {
      destinationUrl: currentUrl || destinationUrl,
      title: currentTitle || undefined,
      navigatedAt: new Date().toISOString(),
    },
    logs,
  };
};
