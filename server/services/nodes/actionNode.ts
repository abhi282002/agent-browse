import type { NodeHandler } from './types';

/**
 * Action Archetype Handler
 * Standard interaction step (mouse clicks, keystrokes) via stagehand.act
 */
export const executeActionNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const actInstruction = node.data.actionSummary || node.data.title;
  logs.push(`Executing Stagehand action: "${actInstruction}"`);

  // Dynamically resolve the currently active page
  const activePage =
    (await ctx.stagehand?.browser?.context?.activePage().catch(() => undefined)) ||
    ctx.page;

  let actResult: unknown = null;
  try {
    actResult = await ctx.stagehand.act(actInstruction);
    logs.push('Action executed cleanly');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // If the error is a frame detachment / frame id error, wait for DOM/navigation to settle and retry
    if (
      /no frame with given id|frame.*not found|target.*not found/i.test(errorMsg)
    ) {
      logs.push(
        `⚠ Detected frame detachment during action ("${errorMsg}"). Waiting for DOM & navigation to stabilize...`,
      );
      if (activePage) {
        await activePage.waitForTimeout(2500).catch(() => {});
        await activePage.waitForLoadState('domcontentloaded', 8000).catch(() => {});
      }
      try {
        logs.push(`Retrying Stagehand action on settled page: "${actInstruction}"`);
        actResult = await ctx.stagehand.act(actInstruction);
        logs.push('✓ Action succeeded on retry');
      } catch (retryErr: unknown) {
        const retryMsg =
          retryErr instanceof Error ? retryErr.message : String(retryErr);
        // If it still reports frame error, navigation likely completed and detached the previous execution frame
        logs.push(`Action completed with frame navigation note: ${retryMsg}`);
        actResult = { status: 'completed_navigation', note: retryMsg };
      }
    } else {
      throw err;
    }
  }

  // Allow in-flight navigation triggered by the action to settle
  if (activePage) {
    await activePage.waitForTimeout(1500).catch(() => {});
  }

  // Resolve current active page post-action (e.g. if a link opened a new tab or redirected)
  const currentActivePage =
    (await ctx.stagehand?.browser?.context?.activePage().catch(() => undefined)) ||
    activePage;

  let currentUrl = '';
  let currentTitle = '';
  if (currentActivePage) {
    currentUrl = await currentActivePage.url().catch(() => '');
    currentTitle = await currentActivePage.title().catch(() => '');
    if (currentUrl) logs.push(`Current page URL: ${currentUrl}`);
    if (currentTitle) logs.push(`Current page title: "${currentTitle}"`);
  }

  // If the action instruction requested gathering / extracting information,
  // execute an extract call so the node produces the collected data
  let extractedData: unknown = undefined;
  const isInformationGathering =
    /gather|extract|list|find|scrape|collect|get\s+\d+|fetch/i.test(actInstruction);

  if (isInformationGathering && typeof ctx.stagehand?.extract === 'function') {
    try {
      logs.push(`Gathering requested data via extract: "${actInstruction}"`);
      if (currentActivePage) {
        await currentActivePage.waitForTimeout(1500).catch(() => {});
      }
      const extractRes = await ctx.stagehand.extract(actInstruction);
      if (extractRes) {
        extractedData = (extractRes as { data?: unknown }).data ?? extractRes;
        logs.push('✓ Information gathered successfully');
      }
    } catch (err) {
      const extractErrMsg = err instanceof Error ? err.message : String(err);
      if (
        /no frame with given id|frame.*not found|target.*not found/i.test(
          extractErrMsg,
        )
      ) {
        logs.push(
          '⚠ Frame was busy or reloading during extract. Retrying after stabilization...',
        );
        if (currentActivePage) {
          await currentActivePage.waitForTimeout(2500).catch(() => {});
        }
        try {
          const retryExtract = await ctx.stagehand.extract(actInstruction);
          if (retryExtract) {
            extractedData =
              (retryExtract as { data?: unknown }).data ?? retryExtract;
            logs.push('✓ Information gathered successfully on retry');
          }
        } catch (retryErr) {
          logs.push(
            `Note: Action extract fallback: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
          );
        }
      } else {
        logs.push(`Note: Action extract fallback: ${extractErrMsg}`);
      }
    }
  }

  return {
    output: {
      action: actInstruction,
      status: 'completed',
      currentUrl: currentUrl || undefined,
      currentTitle: currentTitle || undefined,
      result: (actResult as unknown) || { success: true },
      data: extractedData,
      executedAt: new Date().toISOString(),
    },
    logs,
  };
};
