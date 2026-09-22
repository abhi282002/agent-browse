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

  const activePage =
    (await ctx.stagehand?.browser?.context?.activePage().catch(() => undefined)) ||
    ctx.page;

  let formRes: unknown = null;
  try {
    formRes = await ctx.stagehand.act(formInstruction);
    logs.push('Form inputs filled and submitted');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (/no frame with given id|frame.*not found|target.*not found/i.test(errorMsg)) {
      logs.push('⚠ Frame transition during form submission. Waiting for page to settle...');
      if (activePage) await activePage.waitForTimeout(2500).catch(() => {});
      try {
        formRes = await ctx.stagehand.act(formInstruction);
        logs.push('✓ Form submitted on retry');
      } catch (retryErr) {
        throw retryErr;
      }
    } else {
      throw err;
    }
  }

  if (activePage) {
    await activePage.waitForTimeout(1000).catch(() => {});
  }
  const currentActivePage =
    (await ctx.stagehand?.browser?.context?.activePage().catch(() => undefined)) ||
    activePage;

  const currentUrl = currentActivePage ? await currentActivePage.url().catch(() => '') : '';

  return {
    output: {
      instruction: formInstruction,
      status: 'submitted',
      currentUrl: currentUrl || undefined,
      result: (formRes as unknown) || { success: true },
      submittedAt: new Date().toISOString(),
    },
    logs,
  };
};
