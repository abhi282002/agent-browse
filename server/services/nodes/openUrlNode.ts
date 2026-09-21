import type { NodeHandler } from './types';

/**
 * Open URL Archetype Handler
 * Dedicated node for navigating the browser to a specific URL.
 * Unlike the generic navigation node, this is the user-facing "Start / Open URL" step
 * that explicitly sets the page's origin before the pipeline continues.
 */
export const executeOpenUrlNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const targetUrl =
    node.data.url && node.data.url.startsWith('http')
      ? node.data.url
      : ctx.targetUrl;

  if (!targetUrl) {
    logs.push('⚠ No URL provided for Open URL node — skipping navigation');
    return { logs };
  }

  logs.push(`Opening URL: ${targetUrl}`);

  const pageToUse =
    (await ctx.stagehand?.browser?.context
      ?.activePage()
      .catch(() => undefined)) || ctx.page;

  if (pageToUse) {
    try {
      await pageToUse.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      // Allow frame settlement and redirects (e.g. geo-redirects like /us)
      await pageToUse.waitForTimeout(2000).catch(() => {});
      const finalUrl = await pageToUse.url().catch(() => targetUrl);
      const title = await pageToUse.title().catch(() => '');
      logs.push(`✓ Page loaded: ${finalUrl}`);
      if (title) logs.push(`✓ Page title: "${title}"`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        /no frame with given id|frame.*not found|target.*not found/i.test(
          errMsg,
        )
      ) {
        logs.push(
          '⚠ Frame transition during initial load. Waiting for page to stabilize...',
        );
        await pageToUse.waitForTimeout(3000).catch(() => {});
        const finalUrl = await pageToUse.url().catch(() => targetUrl);
        const title = await pageToUse.title().catch(() => '');
        logs.push(`✓ Page loaded after stabilization: ${finalUrl}`);
        if (title) logs.push(`✓ Page title: "${title}"`);
      } else {
        throw err;
      }
    }
  } else {
    logs.push('Browser page not available — URL recorded for pipeline context');
  }

  return {
    output: {
      openedUrl: targetUrl,
      loadedAt: new Date().toISOString(),
    },
    logs,
  };
};
