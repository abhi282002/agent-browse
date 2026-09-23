import type { Page } from '@browserbasehq/stagehand';

import { format } from 'date-fns';

export interface NewsCategoryConfig {
  fullName: string;
  keywords: string[];
  urlPatterns: string[];
}

export const NEWS_CATEGORIES_CONFIG: Record<string, NewsCategoryConfig> = {
  ai: {
    fullName: 'AI & Technology',
    keywords: [
      'artificial intelligence',
      'AI',
      'software',
      'cybersecurity',
      'cloud',
      'technology companies',
    ],
    urlPatterns: ['/technology', '/tech', '/ai'],
  },
  india: {
    fullName: 'India',
    keywords: [
      'India',
      'Indian government',
      'national events',
      'Indian economy',
      'infrastructure',
      'policy',
    ],
    urlPatterns: ['/india', '/national', '/politics'],
  },
  world: {
    fullName: 'World',
    keywords: [
      'world',
      'international',
      'global',
      'geopolitics',
      'international relations',
      'diplomacy',
    ],
    urlPatterns: ['/world', '/international'],
  },
  business: {
    fullName: 'Business & Economy',
    keywords: [
      'business',
      'economy',
      'markets',
      'startups',
      'companies',
      'jobs',
      'inflation',
    ],
    urlPatterns: ['/business', '/economy', '/markets', '/money'],
  },
  science: {
    fullName: 'Science & Space',
    keywords: [
      'science',
      'space',
      'NASA',
      'ISRO',
      'physics',
      'biology',
      'research',
      'discoveries',
    ],
    urlPatterns: ['/science', '/space', '/technology/science'],
  },
  education: {
    fullName: 'Education & Careers',
    keywords: [
      'education',
      'academic',
      'school',
      'college',
      'university',
      'students',
      'exams',
      'results',
      'careers',
      'jobs',
    ],
    urlPatterns: ['/education', '/schools', '/colleges', '/university'],
  },
  sports: {
    fullName: 'Sports',
    keywords: [
      'sports',
      'sport',
      'cricket',
      'football',
      'tournaments',
      'athletes',
    ],
    urlPatterns: ['/sports', '/sports/cricket'],
  },
};

export type NewsCategoryKey = keyof typeof NEWS_CATEGORIES_CONFIG;
export const NEWS_CATEGORY_KEYS = Object.keys(
  NEWS_CATEGORIES_CONFIG,
) as NewsCategoryKey[];

const normalizeCategoryKey = (value: string): NewsCategoryKey | null => {
  const key = value.trim().toLowerCase();
  return NEWS_CATEGORY_KEYS.includes(key as NewsCategoryKey)
    ? (key as NewsCategoryKey)
    : null;
};

const getCategoryConfig = (category: string): NewsCategoryConfig => {
  const key = normalizeCategoryKey(category);
  if (key && NEWS_CATEGORIES_CONFIG[key]) {
    return NEWS_CATEGORIES_CONFIG[key];
  }

  return {
    fullName:
      category.trim().charAt(0).toUpperCase() + category.trim().slice(1),
    keywords: [category.trim().toLowerCase()],
    urlPatterns: [`/${category.trim().toLowerCase()}`],
  };
};

const normalizeRequestedCategories = (payload?: string): string[] => {
  if (!payload || !payload.trim()) return [...NEWS_CATEGORY_KEYS];

  const parseValue = (input: string): string[] =>
    input
      .split(input.includes(',') ? ',' : /\s+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

  try {
    const parsed = JSON.parse(payload);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const categories = parsed
        .map((item) => String(item).trim().toLowerCase())
        .filter((item) => normalizeCategoryKey(item));
      return categories.length > 0 ? categories : [...NEWS_CATEGORY_KEYS];
    }
  } catch {
    const categories = parseValue(payload).filter((item) =>
      normalizeCategoryKey(item),
    );
    return categories.length > 0 ? categories : [...NEWS_CATEGORY_KEYS];
  }

  return [...NEWS_CATEGORY_KEYS];
};

/**
 * Universal headline extractor evaluated within the browser page DOM.
 * Captures headlines across <p>, <h1>, <h2>, <h3>, <h4>, <a>, <span>, and <article> tags,
 * regardless of website-specific CMS or tag structure.
 */
export const extractUniversalPageHeadlines = async (
  page: Page,
  maxItems = 6,
): Promise<string[]> => {
  return await page.evaluate((limit: number) => {
    const items: string[] = [];
    const BOILERPLATE_REGEX =
      /subscri|active\s+subscription|account\s+benefit|terms\s+of\s+use|terms\s*&\s*conditions|privacy\s+policy|cookie\s+policy|cookie\s+settings|all\s+rights\s+reserved|copyright|reproduction\s+of\s+news|sign\s*in|sign\s*up|log\s*in|log\s*out|download\s+(the\s+)?app|follow\s+us|advertisement|sponsored|promoted|read\s+more|view\s+all|share\s+this/i;

    // Universal query covering headings, paragraphs, links, article tags, and cards
    const candidates = Array.from(
      document.querySelectorAll(
        'h1, h2, h3, h4, ' +
          'article h1, article h2, article h3, article h4, article p, article a, ' +
          'p[class*="headline" i], p[class*="title" i], p[class*="lead" i], p[class*="teaser" i], ' +
          '[class*="headline" i], [class*="title" i], ' +
          '[class*="card" i] p, [class*="card" i] a, [class*="card" i] h2, [class*="card" i] h3, ' +
          '[class*="story" i] p, [class*="story" i] a, [class*="story" i] h2, [class*="story" i] h3, ' +
          'a[href*="articleshow" i], a[href*="/article" i], a[href*="/story" i], a[href*="/news" i], a[title], ' +
          'main p, section p, p, a',
      ),
    );

    for (const el of candidates) {
      const titleAttr = (
        el.getAttribute('title') ||
        el.getAttribute('data-title') ||
        el.getAttribute('aria-label') ||
        ''
      ).trim();

      const innerText = (el.textContent || '').trim().replace(/\s+/g, ' ');
      let text =
        titleAttr.length > 20 && titleAttr.length < 260 ? titleAttr : innerText;

      // Clean common news prefixes: timestamps, categories, LIVE badges
      text = text
        .replace(
          /^([^/]{2,15}\/\s+)?([A-Za-z]{3}\s+\d{1,2}(,\s*\d{4})?\s*[-–—|•]?\s*)?/,
          '',
        )
        .replace(
          /^(live|breaking|exclusive|watch|video|photos?)\s*[:|-]\s*/i,
          '',
        )
        .trim();

      // Check character bounds
      if (text.length < 22 || text.length > 260) continue;

      // Check word count (headlines are typically 4 to 35 words across any tag)
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length < 4 || words.length > 35) continue;

      // Filter boilerplate / legal / navigation text
      if (BOILERPLATE_REGEX.test(text)) continue;

      // Normalized deduplication across nested tags
      const norm = text.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isDuplicate = items.some((existing) => {
        const existingNorm = existing.toLowerCase().replace(/[^a-z0-9]/g, '');
        return existingNorm.includes(norm) || norm.includes(existingNorm);
      });

      if (!isDuplicate) {
        items.push(text);
        if (items.length >= limit) break;
      }
    }

    return items;
  }, maxItems);
};

export interface DiscoveredTabAnchor {
  category: string;
  fullName: string;
  url: string;
  text: string;
}

/**
 * Scans page navigation elements to discover matching tabs for requested news categories.
 */
export const discoverCategoryAnchors = async (
  page: Page,
  categories: string[],
): Promise<DiscoveredTabAnchor[]> => {
  return await page.evaluate(
    ({
      cats,
      config,
    }: {
      cats: string[];
      config: typeof NEWS_CATEGORIES_CONFIG;
    }) => {
      const anchors = Array.from(
        document.querySelectorAll('header a, nav a, [role="navigation"] a, a'),
      );
      const found: DiscoveredTabAnchor[] = [];

      for (const rawCat of cats) {
        const catKey = rawCat.toLowerCase().trim();
        const cfg = config[catKey] || {
          fullName: rawCat.charAt(0).toUpperCase() + rawCat.slice(1),
          keywords: [catKey],
          urlPatterns: [`/${catKey}`],
        };

        let matchedAnchor: { url: string; text: string } | null = null;

        for (const a of anchors) {
          const href = (a as HTMLAnchorElement).href;
          const text = (a.textContent || '').trim();
          if (!href || href.startsWith('javascript') || href.includes('#'))
            continue;

          const urlLower = href.toLowerCase();
          const matchesUrl = cfg.urlPatterns.some(
            (pattern) =>
              urlLower.endsWith(pattern) ||
              urlLower.includes(`${pattern}/`) ||
              urlLower.includes(`${pattern}.cms`),
          );

          if (matchesUrl) {
            matchedAnchor = { url: href, text: text || cfg.fullName };
            break;
          }
        }

        if (!matchedAnchor) {
          for (const a of anchors) {
            const href = (a as HTMLAnchorElement).href;
            const text = (a.textContent || '').trim();
            if (!href || href.startsWith('javascript') || href.includes('#'))
              continue;

            const textLower = text.toLowerCase();
            const isWordMatch = cfg.keywords.some((kw) => {
              const regex = new RegExp(`(^|\\s|\\b)${kw}(\\b|\\s|$)`, 'i');
              return regex.test(textLower);
            });

            if (isWordMatch && text.length < 35) {
              matchedAnchor = { url: href, text };
              break;
            }
          }
        }

        if (matchedAnchor) {
          found.push({
            category: catKey,
            fullName: cfg.fullName,
            url: matchedAnchor.url,
            text: matchedAnchor.text,
          });
        }
      }
      return found;
    },
    { cats: categories, config: NEWS_CATEGORIES_CONFIG },
  );
};

/**
 * Resolves target news categories from an optional node payload,
 * defaulting to all registered keys in NEWS_CATEGORIES_CONFIG.
 */
export function resolveNewsCategories(payload?: string): {
  categories: string[];
  fullCategoriesList: string[];
} {
  const categories = normalizeRequestedCategories(payload);
  const fullCategoriesList = categories.map(
    (category) => getCategoryConfig(category).fullName,
  );

  return { categories, fullCategoriesList };
}

/**
 * Formats a map of category headlines into a structured multi-category document
 * for agent summarization and prompt digestion.
 */
export function formatGatheredDocument(
  storiesByCategory: Record<string, string[]>,
  categoryFullNameMap?: Record<string, string>,
): string {
  let gatheredDocument = '';
  for (const [catKey, stories] of Object.entries(storiesByCategory)) {
    if (Array.isArray(stories) && stories.length > 0) {
      const catName =
        categoryFullNameMap?.[catKey.toLowerCase()] ||
        NEWS_CATEGORIES_CONFIG[catKey.toLowerCase()]?.fullName ||
        catKey.toUpperCase();
      gatheredDocument += `\n=== CATEGORY: ${catName} ===\n${stories.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`;
    }
  }
  return gatheredDocument;
}

export interface ExtractedArticleJson {
  headline: string;
  subheading?: string;
  author?: string;
  publishedDate?: string;
  summary: string;
  keyPoints?: string[];
  url?: string;
  category?: string;
}

export const ARTICLE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description: 'The main headline of the news article',
    },
    subheading: {
      type: 'string',
      description: 'The subheading or deck summary if available',
    },
    author: {
      type: 'string',
      description: 'Author or news agency name',
    },
    publishedDate: {
      type: 'string',
      description: 'Date of publication',
    },
    summary: {
      type: 'string',
      description: 'A comprehensive 2-3 paragraph summary of the article body',
    },
    keyPoints: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Bullet points of key facts or events mentioned in the article',
    },
  },
  required: ['headline', 'summary'],
};

export function formatJsonArticlesToDocument(
  articlesByCategory: Record<string, ExtractedArticleJson[]>,
): string {
  let doc = '';
  for (const [catKey, articles] of Object.entries(articlesByCategory)) {
    if (!articles || articles.length === 0) continue;
    const catName =
      NEWS_CATEGORIES_CONFIG[catKey.toLowerCase()]?.fullName ||
      catKey.toUpperCase();
    doc += `\n=== CATEGORY: ${catName} ===\n`;
    for (const [idx, art] of articles.entries()) {
      doc += `\nStory #${idx + 1}: ${art.headline}\n`;
      if (art.publishedDate) {
        let dateStr = art.publishedDate;
        try {
          const parsed = new Date(art.publishedDate);
          if (!isNaN(parsed.getTime())) {
            dateStr = format(parsed, 'dd-MM-yy hh:mm a');
          }
        } catch {
          dateStr = art.publishedDate;
        }
        doc += `Published: ${dateStr}\n`;
      }
      if (art.url) doc += `Source URL: ${art.url}\n`;
      if (art.summary) doc += `Summary: ${art.summary}\n`;
      if (art.keyPoints && art.keyPoints.length > 0) {
        doc += `Key Points:\n${art.keyPoints.map((p) => `  • ${p}`).join('\n')}\n`;
      }
    }
  }
  return doc;
}

/**
 * Builds an optimal search query string for Browserbase Web Search API
 * scoped to the given domain or news site.
 */
export function buildCategorySearchQuery(
  domain: string,
  categoryKey: string,
): string {
  const cfg = NEWS_CATEGORIES_CONFIG[categoryKey.toLowerCase().trim()];
  const primaryTerm = cfg?.fullName || categoryKey;
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .trim();

  if (
    cleanDomain &&
    cleanDomain !== 'localhost' &&
    cleanDomain !== 'example.com'
  ) {
    return `site:${cleanDomain} ${primaryTerm} news`;
  }
  return `${primaryTerm} breaking news`;
}
