import type { NodeHandler } from './types';
import { pickFirstString } from './nodeUtils';

/**
 * Open URL Archetype Handler
 * Dedicated node for navigating the browser to a specific URL.
 * Unlike the generic navigation node, this is the user-facing "Start / Open URL" step
 * that explicitly sets the page's origin before the pipeline continues.
 */
export const executeOpenUrlNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const targetUrl = pickFirstString(node.data?.url, ctx.targetUrl);

  if (!targetUrl || !targetUrl.startsWith('http')) {
    throw new Error('A valid URL is required for Open URL step (e.g. https://example.com).');
  }

  logs.push(`Opening URL: ${targetUrl}`);

  const pageToUse =
    (await ctx.stagehand?.browser?.context
      ?.activePage()
      .catch(() => undefined)) || ctx.page;

  if (!pageToUse) {
    throw new Error('Browser page context is not available. Cannot navigate.');
  }

  await pageToUse.goto(targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await pageToUse.waitForTimeout(1500).catch(() => {});
  const finalUrl = await pageToUse.url().catch(() => targetUrl);
  const title = await pageToUse.title().catch(() => '');
  logs.push(`✓ Page loaded: ${finalUrl}`);
  if (title) logs.push(`✓ Page title: "${title}"`);

  return {
    output: {
      openedUrl: finalUrl || targetUrl,
      title: title || undefined,
      loadedAt: new Date().toISOString(),
    },
    logs,
  };
};
