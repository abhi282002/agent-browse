import type { NodeHandler } from './types';
import {
  discoverCategoryAnchors,
  extractUniversalPageHeadlines,
  formatGatheredDocument,
  resolveNewsCategories,
} from '../newsExtractionUtils';

/**
 * Browser News Collector Archetype Handler (news_gather / news_extraction)
 * Pure Browser Agent: Discovers category tabs, navigates autonomously to each section,
 * and harvests live breaking stories using the universal headline extractor.
 * Outputs raw multi-category data so the user can inspect exactly what the browser agent did.
 */
export const executeNewsGatherNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];

  // Resolve target categories using NEWS_CATEGORIES_CONFIG as the single source of truth
  const { categories, fullCategoriesList } = resolveNewsCategories(
    node.data.payload,
  );

  logs.push(
    `Browser News Harvester initialized for categories: [${categories.join(', ')}]`,
  );
  logs.push(`Target news portal: ${ctx.targetUrl}`);

  const categoryHeadlinesMap: Record<string, string[]> = {};
  const categoryFullNameMap: Record<string, string> = {};
  const visitedTabs: {
    category: string;
    text: string;
    url: string;
    storiesCount: number;
  }[] = [];

  for (let i = 0; i < categories.length; i++) {
    const key = categories[i].toLowerCase().trim();
    categoryFullNameMap[key] = fullCategoriesList[i];
    categoryHeadlinesMap[key] = [];
  }

  let gatheredDocument = '';

  if (ctx.page) {
    try {
      logs.push('Scanning navigation menu for category section URLs...');
      const discoveredAnchors = await discoverCategoryAnchors(
        ctx.page,
        categories,
      );

      for (const anchor of discoveredAnchors) {
        logs.push(
          `• Discovered tab for [${anchor.fullName}]: "${anchor.text}" (${anchor.url})`,
        );
      }

      // Autonomously visit each category section using Hybrid (act click -> direct URL fallback)
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const catKey = cat.toLowerCase().trim();
        const fullName = categoryFullNameMap[catKey] || cat;

        const matchingAnchor = discoveredAnchors.find(
          (a) => a.category.toLowerCase() === catKey,
        );

        const tabLabel = matchingAnchor?.text || fullName;
        let navigated = false;
        let visitedUrl = '';

        // 1. Stagehand act() autonomous tab clicking
        if (ctx.stagehand) {
          try {
            const urlBefore = await ctx.page.url();
            logs.push(
              `Attempting autonomous click on [${fullName}] ("${tabLabel}") via Stagehand act...`,
            );

            await ctx.stagehand.act(
              `Click on the "${tabLabel}" navigation link or category tab`,
            );

            // Wait briefly for DOM or navigation transition
            await ctx.page
              .waitForLoadState('domcontentloaded', 8000)
              .catch(() => {});

            const urlAfter = await ctx.page.url();
            const expectedPath = matchingAnchor?.url
              ? new URL(
                  matchingAnchor.url,
                  ctx.targetUrl || 'http://localhost',
                ).pathname.replace(/\/$/, '')
              : '';

            if (
              (urlAfter !== urlBefore && urlAfter !== ctx.targetUrl) ||
              (expectedPath && urlAfter.includes(expectedPath))
            ) {
              navigated = true;
              visitedUrl = urlAfter;
              logs.push(
                `✓ Autonomously navigated to [${fullName}] via act() -> ${urlAfter}`,
              );
            } else {
              logs.push(
                `Autonomous act click did not navigate away from current page; initiating direct URL fallback`,
              );
            }
          } catch (actErr) {
            logs.push(
              `Autonomous act click note for [${fullName}]: ${actErr instanceof Error ? actErr.message : String(actErr)}`,
            );
          }
        }

        // 2. Fallback: Direct section URL navigation if act() didn't change view
        if (
          !navigated &&
          matchingAnchor?.url &&
          matchingAnchor.url !== ctx.targetUrl
        ) {
          logs.push(
            `Fallback: Direct navigating to category section [${fullName}] -> ${matchingAnchor.url}`,
          );
          try {
            await ctx.page.goto(matchingAnchor.url, {
              waitUntil: 'domcontentloaded',
              timeout: 25000,
            });
            navigated = true;
            visitedUrl = matchingAnchor.url;
            logs.push(`✓ Loaded [${fullName}] section via direct URL`);
          } catch (navErr) {
            logs.push(
              `Notice: Could not load [${fullName}] section: ${navErr instanceof Error ? navErr.message : String(navErr)}`,
            );
          }
        }

        // Harvest 5 live stories from the visited category section
        const stories: string[] = [];
        if (navigated) {
          try {
            const pageHeadlines = await extractUniversalPageHeadlines(
              ctx.page,
              5,
            );
            stories.push(...pageHeadlines);
            logs.push(
              `✓ [${fullName}] Collected ${pageHeadlines.length} stories from category section`,
            );

            visitedTabs.push({
              category: fullName,
              text: tabLabel,
              url: visitedUrl || (await ctx.page.url()),
              storiesCount: pageHeadlines.length,
            });
          } catch (extractErr) {
            logs.push(
              `Notice: Story extraction failed for [${fullName}]: ${extractErr instanceof Error ? extractErr.message : String(extractErr)}`,
            );
          }
        }

        categoryHeadlinesMap[catKey] = stories;
      }

      // Build structured multi-category document using shared helper
      gatheredDocument = formatGatheredDocument(
        categoryHeadlinesMap,
        categoryFullNameMap,
      );

      // Fallback: If no direct tabs found, supplement with universal home page headlines
      if (
        !gatheredDocument ||
        Object.values(categoryHeadlinesMap).every((arr) => arr.length === 0)
      ) {
        logs.push(
          'Gathering universal home page headlines for category extraction...',
        );
        await ctx.page
          .goto(ctx.targetUrl, { waitUntil: 'domcontentloaded' })
          .catch(() => {});
        const homeHeadlines = await extractUniversalPageHeadlines(ctx.page, 25);
        if (homeHeadlines.length > 0) {
          gatheredDocument = `\n=== GENERAL HEADLINES ===\n${homeHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n`;
        }
      }
    } catch (err) {
      logs.push(
        `Category gathering note: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const totalStories = Object.values(categoryHeadlinesMap).reduce(
    (acc, arr) => acc + arr.length,
    0,
  );

  logs.push(
    `Browser harvesting complete: ${totalStories} total stories gathered across ${categories.length} categories.`,
  );

  return {
    output: {
      categories: fullCategoriesList,
      totalStories,
      storiesByCategory: categoryHeadlinesMap,
      tabsVisited: visitedTabs,
      gatheredDocument,
    },
    logs,
  };
};
