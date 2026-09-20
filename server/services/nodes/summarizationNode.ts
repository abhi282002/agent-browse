import type { NodeHandler } from './types';
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

  if (ctx.page) {
    try {
      logs.push('Extracting live DOM innerText for agent perception...');
      pageText = await ctx.page.evaluate(() => document.body?.innerText || '');
      pageTitle = (await ctx.page.title()) || node.data.title;
      logs.push(`Captured ${pageText.length} characters of DOM text context`);
    } catch (err) {
      logs.push(
        `DOM text extraction note: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const combinedContent = extractedContext
    ? `Extracted Data from previous step:\n${extractedContext}\n\nWebpage text:\n${pageText.slice(0, 8000)}`
    : pageText;

  logs.push(`Dispatching web summarization to ${modelToUse}...`);
  const agentResult = await AgentService.summarizeWebPage({
    pageText: combinedContent,
    pageTitle,
    targetUrl: ctx.targetUrl,
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
