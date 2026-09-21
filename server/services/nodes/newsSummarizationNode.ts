import type { NodeHandler } from './types';
import { AgentService } from '../agentService';
import {
  formatGatheredDocument,
  resolveNewsCategories,
} from '../newsExtractionUtils';
import { executeNewsGatherNode } from './newsGatherNode';
import { pickFirstString } from './nodeUtils';

/**
 * News Summarization Archetype Handler (news_summary)
 * Consumes gathered stories (from previous Browser News Collector node or live DOM)
 * and formats each into structured [heading, subheading, text] briefing via Gemini 2.5 Flash.
 */
export const executeNewsSummarizationNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const modelToUse = ctx.aiModel || 'Gemini 2.5 Flash';

  // Resolve target categories using NEWS_CATEGORIES_CONFIG as the single source of truth
  const { fullCategoriesList } = resolveNewsCategories(node.data.payload);

  let gatheredContent = '';

  // 1. Check if preceding node (e.g. Browser News Collector) already gathered the stories
  if (
    typeof ctx.previousStepOutput?.gatheredDocument === 'string' &&
    ctx.previousStepOutput.gatheredDocument
  ) {
    gatheredContent = ctx.previousStepOutput.gatheredDocument;
    logs.push(
      `Consuming ${ctx.previousStepOutput.totalStories || 'multi-category'} stories gathered by preceding Browser News Collector`,
    );
  } else if (
    ctx.previousStepOutput?.storiesByCategory &&
    typeof ctx.previousStepOutput.storiesByCategory === 'object'
  ) {
    const map = ctx.previousStepOutput.storiesByCategory as Record<
      string,
      string[]
    >;
    gatheredContent = formatGatheredDocument(map);
    logs.push(
      'Reconstructed multi-category stories from preceding step output',
    );
  } else if (ctx.pipelineOutputs) {
    // Check earlier pipeline outputs
    for (const out of Object.values(ctx.pipelineOutputs)) {
      if (
        out &&
        typeof out === 'object' &&
        typeof (out as Record<string, unknown>).gatheredDocument === 'string'
      ) {
        gatheredContent = (out as Record<string, unknown>)
          .gatheredDocument as string;
        logs.push(
          'Found multi-category stories from earlier pipeline collector step',
        );
        break;
      }
    }
  }

  let gatheredArticles = ctx.previousStepOutput?.articles;
  if (!gatheredArticles && ctx.pipelineOutputs) {
    for (const out of Object.values(ctx.pipelineOutputs)) {
      if (
        out &&
        typeof out === 'object' &&
        (out as Record<string, unknown>).articles
      ) {
        gatheredArticles = (out as Record<string, unknown>).articles;
        break;
      }
    }
  }

  // Resolve target news URL from node data, context, or workflow nodes
  const resolvedTargetUrl = pickFirstString(
    node.data?.url && node.data.url.startsWith('http') ? node.data.url : '',
    ctx.targetUrl,
    ctx.workflowNodes?.find((n) => n.data?.url && n.data.url.startsWith('http'))
      ?.data.url,
  );

  // 2. If no preceding node gathered content, gather real news from the target URL
  if (!gatheredContent && resolvedTargetUrl) {
    logs.push(
      `Gathering real-time multi-category news stories from: ${resolvedTargetUrl}...`,
    );

    try {
      const gatherRes = await executeNewsGatherNode(node, {
        ...ctx,
        targetUrl: resolvedTargetUrl,
      });
      logs.push(...gatherRes.logs);
      if (
        typeof gatherRes.output?.gatheredDocument === 'string' &&
        gatherRes.output.gatheredDocument
      ) {
        gatheredContent = gatherRes.output.gatheredDocument;
      }
      if (gatherRes.output?.articles) {
        gatheredArticles = gatherRes.output.articles;
      }
    } catch (gatherErr) {
      logs.push(
        `Browserbase gather attempt notice: ${gatherErr instanceof Error ? gatherErr.message : String(gatherErr)}`,
      );
    }

    if (!gatheredContent) {
      try {
        logs.push(`Initiating live web fetch for: ${resolvedTargetUrl}`);
        const res = await fetch(resolvedTargetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        if (res.ok) {
          const html = await res.text();
          const cleanText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (cleanText.length > 100) {
            gatheredContent = cleanText.slice(0, 16000);
            logs.push(
              `Harvested ${gatheredContent.length} characters of live webpage text from ${resolvedTargetUrl}`,
            );
          }
        }
      } catch (fetchErr) {
        logs.push(
          `Live web fetch failed: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
        );
      }
    }
  }

  if (!gatheredContent) {
    throw new Error(
      `No news content could be gathered for categorization. Please verify that a valid URL is provided (e.g. ${resolvedTargetUrl || 'https://www.thehindu.com/'}).`,
    );
  }

  logs.push(
    `Synthesizing category-specific intelligence into [heading, subheading, text] via ${modelToUse}...`,
  );

  const digestResult = await AgentService.generateCategorizedNewsDigest({
    categories: fullCategoriesList,
    content: gatheredContent,
    targetUrl: resolvedTargetUrl,
    modelName: modelToUse,
  });

  logs.push(
    `Synthesized ${digestResult.items.length} categorized stories (${digestResult.provider} - ${digestResult.modelUsed}):`,
  );

  for (const item of digestResult.items) {
    logs.push(`• [${item.category}] heading: "${item.heading}"`);
  }

  return {
    output: {
      digest: digestResult.items,
      formattedBriefing: digestResult.formattedBriefing,
      categories: digestResult.items.map((i) => i.category),
      totalStories: digestResult.items.length,
      provider: digestResult.provider,
      modelUsed: digestResult.modelUsed,
      articles: gatheredArticles,
      gatheredDocument: gatheredContent,
      targetUrl: resolvedTargetUrl,
      url: resolvedTargetUrl,
    },
    logs,
  };
};
