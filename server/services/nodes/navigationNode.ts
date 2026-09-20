import type { NodeHandler } from './types';

/**
 * Navigation Archetype Handler
 * Handles explicit browser URL routing or in-page navigation
 */
export const executeNavigationNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const destinationUrl =
    node.data.url && node.data.url.startsWith('http')
      ? node.data.url
      : ctx.targetUrl;

  if (ctx.page && destinationUrl) {
    logs.push(`Navigating to URL: ${destinationUrl}`);
    await ctx.page.goto(destinationUrl, { waitUntil: 'domcontentloaded' });
    logs.push('Navigation complete: DOM ready');
  } else {
    const actInstruction = node.data.actionSummary || node.data.title;
    logs.push(`Executing navigation action: "${actInstruction}"`);
    await ctx.stagehand.act(actInstruction);
    logs.push('Navigation action executed cleanly');
  }

  return { logs };
};
