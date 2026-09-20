import type { NodeHandler } from './types';
import { AgentService } from '../agentService';
import {
  formatGatheredDocument,
  resolveNewsCategories,
} from '../newsExtractionUtils';
import { executeNewsGatherNode } from './newsGatherNode';

/**
 * News Summarization Archetype Handler (news_summary)
 * Consumes gathered stories (from previous Browser News Collector node or live DOM)
 * and formats each into structured [heading, subheading, text] briefing via Gemini 2.5 Flash.
 */
export const executeNewsSummarizationNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const modelToUse = ctx.aiModel || 'Gemini 2.5 Flash';

  // Resolve target categories using NEWS_CATEGORIES_CONFIG as the single source of truth
  const { categories, fullCategoriesList } = resolveNewsCategories(
    node.data.payload,
  );

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

  // 2. Fallback: If run standalone without a preceding collector node, execute browser gathering
  if (!gatheredContent && ctx.page) {
    logs.push(
      'No preceding news collector step detected — executing autonomous browser gathering...',
    );
    const gatherRes = await executeNewsGatherNode(node, ctx);
    logs.push(...gatherRes.logs);
    if (typeof gatherRes.output?.gatheredDocument === 'string') {
      gatheredContent = gatherRes.output.gatheredDocument;
    }
  }

  logs.push(
    `Synthesizing category-specific intelligence into [heading, subheading, text] via ${modelToUse}...`,
  );

  const digestResult = await AgentService.generateCategorizedNewsDigest({
    categories: fullCategoriesList,
    content:
      gatheredContent ||
      `Coverage for categories: ${fullCategoriesList.join(', ')}`,
    targetUrl: ctx.targetUrl,
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
    },
    logs,
  };
};
