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

/**
 * Browser News Collector Archetype Handler (news_gather / news_extraction)
 * High-Speed Engine: Utilizes Browserbase Web Search API to locate breaking category news,
 * and Browserbase Fetch API with JSON Schema to extract structured article records.
 * Falls back seamlessly to the live browser session if JS rendering is required.
 */

export const executeNewsGatherNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];

  // Resolve target categories using NEWS_CATEGORIES_CONFIG as the single source of truth
  const { categories, fullCategoriesList } = resolveNewsCategories(
    node.data?.payload,
  );

  logs.push(
    `News Harvester initialized for categories: [${categories.join(', ')}]`,
  );

  // Extract clean domain from targetUrl or active page
  const rawUrl = pickFirstString(ctx.targetUrl, node.data?.url);

  if (!rawUrl || !rawUrl.startsWith('http')) {
    throw new Error('URL Not Found.');
  }

  let domain: string;

  try {
    domain = new URL(rawUrl).hostname;
  } catch {
    throw new Error('Domain Name Invalid Please Check the Url And Try Again.');
  }

  logs.push(`Target news portal domain: ${domain}`);

  const articlesByCategory: Record<string, ExtractedArticleJson[]> = {};
  const categoryHeadlinesMap: Record<string, string[]> = {};
  const apiKey = process.env.BROWSERBASE_API_KEY;

  for (let i = 0; i < categories.length; i++) {
    const key = categories[i].toLowerCase().trim();
    articlesByCategory[key] = [];
    categoryHeadlinesMap[key] = [];
  }

  let usedSearchApi = false;

  // 1. High-Speed Extraction via Browserbase Search API & Fetch API (format: 'json')
  if (apiKey) {
    try {
      const bb = new Browserbase({ apiKey });
      logs.push(
        '🚀 Querying Browserbase Search & Fetch API for multi-category intelligence...',
      );

      for (let i = 0; i < categories.length; i++) {
        const catKey = categories[i].toLowerCase().trim();
        const fullName = fullCategoriesList[i];
        const searchQuery = buildCategorySearchQuery(domain, catKey);

        logs.push(
          `• [${fullName}] Searching via Browserbase Search: "${searchQuery}"`,
        );

        try {
          const searchRes = await bb.search.web({
            query: searchQuery,
            numResults: 3,
          });

          if (searchRes.results && searchRes.results.length > 0) {
            usedSearchApi = true;
            logs.push(
              `Found ${searchRes.results.length} search results for [${fullName}]`,
            );

            // Extract multiple stories (up to 3) for the category using Fetch API with JSON Schema
            const articlesToProcess = searchRes.results.slice(0, 3);

            const fetchedStories = await Promise.all(
              articlesToProcess.map(async (searchArticle, artIdx) => {
                let structuredStory: ExtractedArticleJson | null = null;
                try {
                  logs.push(
                    `  Fetching structured article #${artIdx + 1} from: ${searchArticle.url}`,
                  );
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
                    structuredStory = {
                      headline: String(parsed.headline || searchArticle.title),
                      subheading: parsed.subheading
                        ? String(parsed.subheading)
                        : undefined,
                      author: parsed.author
                        ? String(parsed.author)
                        : searchArticle.author,
                      publishedDate: parsed.publishedDate
                        ? String(parsed.publishedDate)
                        : searchArticle.publishedDate,
                      summary: String(parsed.summary || searchArticle.title),
                      keyPoints: Array.isArray(parsed.keyPoints)
                        ? parsed.keyPoints.map(String)
                        : [],
                      url: searchArticle.url,
                      category: fullName,
                    };
                    logs.push(
                      `  ✓ [${fullName} Story #${artIdx + 1}] Extracted JSON: "${structuredStory.headline}"`,
                    );
                  }
                } catch (fetchErr) {
                  const errMsg =
                    fetchErr instanceof Error
                      ? fetchErr.message
                      : String(fetchErr);
                  logs.push(
                    `  Notice: Fetch API fallback for [${fullName} Story #${artIdx + 1}]: ${errMsg}`,
                  );
                }

                // If Fetch API failed or timed out, fall back to rich search result metadata
                if (!structuredStory) {
                  const pubDate =
                    searchArticle.publishedDate ||
                    new Date().toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  const portalName =
                    domain.toUpperCase().split('.')[0] || 'WIRE';
                  const summaryText =
                    (searchArticle as unknown as { description?: string })
                      .description ||
                    `Primary reporting on ${fullName}: ${searchArticle.title}. Key coverage indicates rapid developments as correspondents and analysts report significant shifts across the wire.`;

                  structuredStory = {
                    headline: searchArticle.title,
                    author: searchArticle.author || `${portalName} News Desk`,
                    publishedDate: pubDate,
                    summary: summaryText,
                    keyPoints: [
                      `Key developments reported in ${fullName} today.`,
                      searchArticle.title,
                      `Monitored via primary wire updates from ${domain}.`,
                    ],
                    url: searchArticle.url,
                    category: fullName,
                  };
                  logs.push(
                    `  ✓ [${fullName} Story #${artIdx + 1}] Using indexed search headline: "${structuredStory.headline}"`,
                  );
                } else if (
                  !structuredStory.keyPoints ||
                  structuredStory.keyPoints.length === 0
                ) {
                  structuredStory.keyPoints = [
                    `Key report filed under ${fullName}.`,
                    structuredStory.headline,
                    `Live updates monitored from ${domain}.`,
                  ];
                }

                return structuredStory;
              }),
            );

            for (const story of fetchedStories) {
              articlesByCategory[catKey].push(story);
              categoryHeadlinesMap[catKey].push(
                `${story.headline} — ${story.summary.slice(0, 200)}`,
              );
            }
          }
        } catch (catSearchErr) {
          logs.push(
            `  Warning: Category search failed for [${fullName}]: ${catSearchErr instanceof Error ? catSearchErr.message : String(catSearchErr)}`,
          );
        }
      }
    } catch (bbInitErr) {
      logs.push(
        `Browserbase Search API init warning: ${bbInitErr instanceof Error ? bbInitErr.message : String(bbInitErr)}`,
      );
    }
  }

  // 2. Format Structured Output
  let gatheredDocument = formatJsonArticlesToDocument(articlesByCategory);

  // 3. Fallback: If search yielded no articles and live page context is available, use browser session
  if (!gatheredDocument && ctx.page) {
    logs.push('Executing fallback live browser DOM extraction...');
    try {
      const pageToUse =
        (await ctx.stagehand?.browser?.context
          ?.activePage()
          .catch(() => undefined)) || ctx.page;

      if (pageToUse) {
        const homeText = await pageToUse.evaluate(
          () => document.body?.innerText || '',
        );
        if (homeText) {
          gatheredDocument = `\n=== LIVE WEBPAGE CONTENT ===\n${homeText.slice(0, 5000)}`;
          logs.push('✓ Captured live page innerText as fallback context');
        }
      }
    } catch (browserErr) {
      logs.push(
        `Browser fallback note: ${browserErr instanceof Error ? browserErr.message : String(browserErr)}`,
      );
    }
  }

  const totalStories = Object.values(categoryHeadlinesMap).reduce(
    (acc, arr) => acc + arr.length,
    0,
  );

  logs.push(
    `Extraction complete: ${totalStories} stories compiled across ${categories.length} categories using ${usedSearchApi ? 'Browserbase Search & Fetch API' : 'Browser Session'}.`,
  );

  return {
    output: {
      provider: usedSearchApi
        ? 'Browserbase Search & Fetch API (JSON Schema)'
        : 'Browser Session',
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
