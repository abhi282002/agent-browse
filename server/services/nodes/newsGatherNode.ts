import { Browserbase } from '@browserbasehq/sdk';
import type { NodeHandler } from './types';
import { pickFirstString } from './nodeUtils';
import {
  ARTICLE_JSON_SCHEMA,
  buildCategorySearchQuery,
  formatJsonArticlesToDocument,
  resolveNewsCategories,
  type ExtractedArticleJson,
} from '../newsExtractionUtils';



export const executeNewsGatherNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];

  // Resolve target categories using NEWS_CATEGORIES_CONFIG as the single source of truth
  const { categories, fullCategoriesList } = resolveNewsCategories(
    node.data?.payload,
  );

  logs.push(
    `News Harvester initialized for categories: [${categories.join(', ')}]`,
  );

  // Extract clean domain from targetUrl or node url
  const rawUrl = pickFirstString(ctx.targetUrl, node.data?.url);
  if (!rawUrl || !rawUrl.startsWith('http')) {
    throw new Error(
      'A valid news portal URL is required (e.g. https://timesofindia.indiatimes.com).',
    );
  }

  let domain: string;
  try {
    domain = new URL(rawUrl).hostname.replace(/^www\./i, '');
  } catch {
    throw new Error('Invalid URL provided. Please provide a valid news portal URL.');
  }

  logs.push(`Target news portal domain: ${domain}`);

  const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'BROWSERBASE_API_KEY is not configured in environment. News gathering requires a valid Browserbase API key.',
    );
  }

  const bb = new Browserbase({ apiKey });
  const articlesByCategory: Record<string, ExtractedArticleJson[]> = {};
  const categoryHeadlinesMap: Record<string, string[]> = {};

  logs.push(
    'Querying Browserbase Search & Fetch API for multi-category news...',
  );

  for (let i = 0; i < categories.length; i++) {
    const catKey = categories[i].toLowerCase().trim();
    const fullName = fullCategoriesList[i];
    const searchQuery = buildCategorySearchQuery(domain, catKey);

    articlesByCategory[catKey] = [];
    categoryHeadlinesMap[catKey] = [];

    logs.push(`• [${fullName}] Searching: "${searchQuery}"`);

    const searchRes = await bb.search.web({
      query: searchQuery,
      numResults: 5,
    });

    if (!searchRes.results || searchRes.results.length === 0) {
      logs.push(`  No search results returned for [${fullName}]`);
      continue;
    }

    const articlesToProcess = searchRes.results.slice(0, 5);

    for (let artIdx = 0; artIdx < articlesToProcess.length; artIdx++) {
      const searchArticle = articlesToProcess[artIdx];
      let story: ExtractedArticleJson | null = null;

      try {
        const fetchRes = await bb.fetchAPI.create({
          url: searchArticle.url,
          format: 'json',
          schema: ARTICLE_JSON_SCHEMA,
        });

        if (
          fetchRes.statusCode === 200 &&
          fetchRes.content &&
          typeof fetchRes.content === 'object'
        ) {
          const parsed = fetchRes.content as Record<string, unknown>;
          story = {
            headline: String(
              parsed.headline || searchArticle.title || 'Breaking News',
            ),
            subheading: parsed.subheading
              ? String(parsed.subheading)
              : undefined,
            author: parsed.author
              ? String(parsed.author)
              : searchArticle.author,
            publishedDate: parsed.publishedDate
              ? String(parsed.publishedDate)
              : searchArticle.publishedDate,
            summary: String(parsed.summary || searchArticle.title || ''),
            keyPoints: Array.isArray(parsed.keyPoints)
              ? parsed.keyPoints.map(String)
              : [],
            url: searchArticle.url,
            category: fullName,
          };
        }
      } catch {
        // Browserbase Fetch API might be restricted/402 on this tier; continue to direct summary extraction
      }

      if (!story) {
        // fetchAPI failed for this article — fall back to search result metadata
        story = {
          headline: searchArticle.title || 'Breaking News',
          author: searchArticle.author,
          publishedDate: searchArticle.publishedDate,
          summary: searchArticle.title || '',
          url: searchArticle.url,
          category: fullName,
        };
      }

      articlesByCategory[catKey].push(story);
      categoryHeadlinesMap[catKey].push(
        `${story.headline} — ${story.summary.slice(0, 200)}`,
      );
      logs.push(`  ✓ [${fullName}] Extracted: "${story.headline}"`);
    }
  }

  const totalStories = Object.values(categoryHeadlinesMap).reduce(
    (acc, arr) => acc + arr.length,
    0,
  );

  const gatheredDocument = formatJsonArticlesToDocument(articlesByCategory);

  if (totalStories === 0 || !gatheredDocument) {
    throw new Error(
      `No news articles could be gathered for domain "${domain}". Pipeline aborted.`,
    );
  }

  logs.push(
    `Extraction complete: ${totalStories} stories gathered across categories via Browserbase Search & Fetch API.`,
  );

  return {
    output: {
      provider: 'Browserbase Search & Fetch API (JSON Schema)',
      categories: fullCategoriesList,
      totalStories,
      storiesByCategory: categoryHeadlinesMap,
      articles: articlesByCategory,
      gatheredDocument,
      targetUrl: rawUrl,
      url: rawUrl,
    },
    logs,
  };
};
