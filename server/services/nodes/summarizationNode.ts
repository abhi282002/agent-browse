import type { NodeHandler } from './types';
import { pickFirstString } from './nodeUtils';
import { AgentService } from '../agentService';

/**
 * Summarization Archetype Handler
 * Reads page content and invokes Gemini or Grok autonomous agent
 */
export const executeSummarizationNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const modelToUse = ctx.aiModel || 'Gemini 2.5 Pro Vision';
  const instruction =
    node.data.actionSummary ||
    node.data.description ||
    'Summarize key insights and purpose of this webpage';

  logs.push(`Autonomous Agent initialized: [${modelToUse}]`);

  let pageText = '';
  let pageTitle = node.data.title;

  // Check if a prior extraction step produced structured data/news
  let extractedContext = '';
  if (ctx.previousStepOutput) {
    extractedContext = JSON.stringify(ctx.previousStepOutput, null, 2);
  } else if (ctx.pipelineOutputs) {
    const previousExtracts = Object.values(ctx.pipelineOutputs)
      .filter((v) => v && typeof v === 'object')
      .map((v) => JSON.stringify(v, null, 2))
      .join('\n');
    if (previousExtracts) {
      extractedContext = previousExtracts;
    }
  }

  const activePage =
    (await ctx.stagehand?.browser?.context
      ?.activePage()
      .catch(() => undefined)) || ctx.page;

  if (activePage) {
    try {
      logs.push('Extracting live DOM innerText for agent perception...');
      await activePage.waitForTimeout(1000).catch(() => {});
      pageText = await activePage.evaluate(
        () => document.body?.innerText || '',
      );
      pageTitle = (await activePage.title().catch(() => '')) || node.data.title;
      logs.push(`Captured ${pageText.length} characters of DOM text context`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        /no frame with given id|frame.*not found|target.*not found/i.test(
          errMsg,
        )
      ) {
        logs.push(
          '⚠ Frame busy during DOM text extraction. Retrying after stabilization...',
        );
        await activePage.waitForTimeout(2000).catch(() => {});
        try {
          pageText = await activePage.evaluate(
            () => document.body?.innerText || '',
          );
          pageTitle =
            (await activePage.title().catch(() => '')) || node.data.title;
          logs.push(
            `Captured ${pageText.length} characters of DOM text context on retry`,
          );
        } catch (retryErr) {
          logs.push(
            `DOM text extraction note: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
          );
        }
      } else {
        logs.push(`DOM text extraction note: ${errMsg}`);
      }
    }
  }

  const combinedContent = extractedContext
    ? `Extracted Data from previous step:\n${extractedContext}\n\nWebpage text:\n${pageText.slice(0, 8000)}`
    : pageText;

  logs.push(`Dispatching web summarization to ${modelToUse}...`);
  const agentResult = await AgentService.summarizeWebPage({
    pageText: combinedContent,
    pageTitle,
    targetUrl: pickFirstString(ctx.targetUrl, node.data?.url),
    instruction,
    modelName: modelToUse,
  });

  logs.push(
    `Synthesized web summary via ${agentResult.provider} (${agentResult.modelUsed}): ~${agentResult.wordCount} words analyzed`,
  );

  for (const insight of agentResult.keyInsights.slice(0, 3)) {
    logs.push(`• Key Insight: ${insight}`);
  }

  return {
    output: {
      summary: agentResult.summary,
      keyInsights: agentResult.keyInsights,
      provider: agentResult.provider,
      modelUsed: agentResult.modelUsed,
      wordCount: agentResult.wordCount,
    },
    logs,
  };
};
