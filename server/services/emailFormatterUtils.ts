import type { CategorizedNewsItem } from './agentService';
import type { ExtractedArticleJson } from './newsExtractionUtils';
import { NEWS_CATEGORIES_CONFIG } from './newsExtractionUtils';

export interface EmailTemplateOptions {
  subject: string;
  targetUrl?: string;
  defaultDescription: string;
  newsDigest?: CategorizedNewsItem[];
  articlesByCategory?: Record<string, ExtractedArticleJson[]>;
  totalStories?: number;
  categorizedDigestHtml?: string;
  extractedSummary?: string;
  keyInsights?: string[];
  rawDataPreview?: string;
}

// Category visual identity configuration
const CATEGORY_THEMES: Record<
  string,
  { icon: string; color: string; bg: string; border: string; label: string }
> = {
  technology: {
    icon: '⚡',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    label: 'Technology & Innovation',
  },
  health: {
    icon: '🩺',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    label: 'Health & Wellness',
  },
  culture: {
    icon: '🏛️',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    label: 'Culture & Heritage',
  },
  arts: {
    icon: '🎭',
    color: '#db2777',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    label: 'Arts & Entertainment',
  },
  travel: {
    icon: '✈️',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    label: 'Travel & Tourism',
  },
  earth: {
    icon: '🌍',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    label: 'Earth & Environment',
  },
  war: {
    icon: '🛡️',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    label: 'World & Defense',
  },
  sports: {
    icon: '🏆',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
    label: 'Sports',
  },
  crime: {
    icon: '⚖️',
    color: '#475569',
    bg: '#f8fafc',
    border: '#cbd5e1',
    label: 'Crime & Law',
  },
  politics: {
    icon: '🗳️',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
    label: 'Politics & National',
  },
};

function getCategoryTheme(catKey: string) {
  const normalized = catKey.toLowerCase().trim();
  return (
    CATEGORY_THEMES[normalized] || {
      icon: '📰',
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#c7d2fe',
      label:
        NEWS_CATEGORIES_CONFIG[normalized]?.fullName ||
        catKey.charAt(0).toUpperCase() + catKey.slice(1),
    }
  );
}

/**
 * Helper to resolve or extract high-impact bullet points for KEY FACTS box.
 */
function extractKeyPoints(
  art: ExtractedArticleJson,
  categoryName: string,
  domain: string,
): string[] {
  if (Array.isArray(art.keyPoints) && art.keyPoints.length > 0) {
    const valid = art.keyPoints.map((s) => String(s).trim()).filter(Boolean);
    if (valid.length > 0) return valid;
  }

  const sentences = (art.summary || '')
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);

  if (sentences.length >= 2) {
    return sentences.slice(0, 5);
  }
  if (sentences.length === 1) {
    return [
      sentences[0],
      `Primary development tracked under ${categoryName}.`,
      `Live updates and ongoing reports monitored from ${domain}.`,
    ];
  }
  return [
    `Key coverage indicates rapid developments in ${categoryName}.`,
    art.headline,
    `Correspondents and analysts continue tracking reports across the wire.`,
  ];
}

/**
 * Resolves formatted Byline metadata (Author, Source Portal, and Date).
 */
function resolveByline(art: ExtractedArticleJson, defaultDomain: string) {
  const portalName = defaultDomain.toUpperCase().split('.')[0] || 'WIRE';
  let author = art.author?.trim();

  if (!author) {
    author = `${portalName} News Desk`;
  } else if (
    !author.toUpperCase().includes(portalName) &&
    defaultDomain.includes('.')
  ) {
    const cleanDomain = defaultDomain.toUpperCase().replace(/^WWW\./, '');
    author = `${author} / ${cleanDomain}`;
  }

  const date =
    art.publishedDate?.trim() ||
    new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return { author, date };
}

/**
 * Resolves a reliable article link to read full story on source.
 */
function resolveArticleUrl(
  art: ExtractedArticleJson,
  defaultUrl?: string,
): string {
  if (art.url && art.url.startsWith('http')) return art.url;
  if (defaultUrl && defaultUrl.startsWith('http')) return defaultUrl;
  return 'https://timesofindia.indiatimes.com/';
}

/**
 * Generates structured HTML card elements for categorized news digest items (AI brief).
 * Displays a concise 1-card overview per category matching Page 1 & 2 of the PDF.
 */
export function formatCategorizedBriefingHtml(
  newsDigest: CategorizedNewsItem[],
): string {
  if (!newsDigest || newsDigest.length === 0) return '';
  const seenCategories = new Set<string>();
  const uniqueCategoryItems: CategorizedNewsItem[] = [];

  for (const item of newsDigest) {
    const norm = item.category.toLowerCase().trim();
    if (!seenCategories.has(norm)) {
      seenCategories.add(norm);
      uniqueCategoryItems.push(item);
    }
  }

  const itemsToRender =
    uniqueCategoryItems.length > 0 ? uniqueCategoryItems : newsDigest;

  return `
    <div style="margin-bottom: 24px;">
      <div style="margin-bottom: 12px; display: flex; align-items: center;">
        <span style="display: inline-block; padding: 4px 10px; background-color: #0f172a; color: #ffffff; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
          ✨ AI Executive Digest (${itemsToRender.length} Topics)
        </span>
      </div>
      ${itemsToRender
        .map((item) => {
          const theme = getCategoryTheme(item.category);
          return `
        <div style="background-color: #ffffff; border: 1px solid ${theme.border}; border-left: 4px solid ${theme.color}; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; background-color: ${theme.bg}; color: ${theme.color}; padding: 3px 8px; border-radius: 4px; border: 1px solid ${theme.border};">
              ${theme.icon} ${item.category}
            </span>
          </div>
          <h3 style="margin: 6px 0 3px; font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.35;">${item.heading}</h3>
          ${
            item.subheading
              ? `<h4 style="margin: 0 0 8px; font-size: 12px; font-weight: 500; color: #64748b; font-style: italic;">${item.subheading}</h4>`
              : ''
          }
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">${item.text}</p>
        </div>`;
        })
        .join('')}
    </div>
  `;
}

/**
 * Builds rich, beautifully formatted HTML sections for structured articles
 * with live source links, key facts, author, and publication dates matching the PDF format.
 */
export function formatArticlesByCategoryHtml(
  articlesByCategory: Record<string, ExtractedArticleJson[]>,
  defaultTargetUrl?: string,
): string {
  const entries = Object.entries(articlesByCategory).filter(
    ([, articles]) => articles && articles.length > 0,
  );
  if (entries.length === 0) return '';

  const defaultDomain = (() => {
    if (!defaultTargetUrl) return 'timesofindia.indiatimes.com';
    try {
      return new URL(defaultTargetUrl).hostname;
    } catch {
      return defaultTargetUrl;
    }
  })();

  return `
    <div style="margin-bottom: 24px;">
      ${entries
        .map(([catKey, articles]) => {
          const theme = getCategoryTheme(catKey);
          return `
          <div style="margin-bottom: 24px;">
            <!-- Category Title Bar -->
            <div style="background-color: ${theme.bg}; border: 1px solid ${theme.border}; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: ${theme.color}; letter-spacing: 0.05em;">
                    ${theme.icon} ${theme.label}
                  </td>
                  <td align="right" style="font-size: 11px; font-weight: 600; color: ${theme.color}; opacity: 0.85;">
                    ${articles.length} ${articles.length === 1 ? 'Story' : 'Stories'}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Articles Cards -->
            ${articles
              .map((art) => {
                const keyPoints = extractKeyPoints(
                  art,
                  theme.label,
                  defaultDomain,
                );
                const { author, date } = resolveByline(art, defaultDomain);
                const storyUrl = resolveArticleUrl(art, defaultTargetUrl);

                return `
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                <!-- Headline -->
                <h4 style="margin: 0 0 6px; font-size: 15px; font-weight: 700; line-height: 1.4;">
                  <a href="${storyUrl}" target="_blank" style="color: #0f172a; text-decoration: none;">${art.headline}</a>
                </h4>

                <!-- Subheading / Deck -->
                ${
                  art.subheading
                    ? `<p style="margin: 0 0 8px; font-size: 12px; color: #64748b; font-style: italic; line-height: 1.4;">${art.subheading}</p>`
                    : ''
                }

                <!-- Byline metadata -->
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 10px;">
                  <span>By <strong>${author}</strong></span>
                  <span> • </span>
                  <span>${date}</span>
                </div>

                <!-- Executive Summary -->
                <p style="margin: 0 0 10px; font-size: 13px; color: #334155; line-height: 1.6;">
                  ${art.summary}
                </p>

                <!-- Key Facts / Takeaways -->
                <div style="background-color: #f8fafc; border-left: 3px solid ${theme.color}; padding: 10px 12px; border-radius: 4px; margin-bottom: 12px;">
                  <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.03em;">KEY FACTS:</p>
                  <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #334155; line-height: 1.5;">
                    ${keyPoints.map((p) => `<li style="margin-bottom: 3px;">${p}</li>`).join('')}
                  </ul>
                </div>

                <!-- Action Button -->
                <div style="margin-top: 10px;">
                  <a href="${storyUrl}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #f1f5f9; color: #1e293b; font-size: 11px; font-weight: 600; text-decoration: none; border-radius: 6px; border: 1px solid #cbd5e1;">
                    Read Full Article on Source &rarr;
                  </a>
                </div>
              </div>`;
              })
              .join('')}
          </div>`;
        })
        .join('')}
    </div>
  `;
}

/**
 * Builds the complete responsive HTML template for executive briefing emails.
 */
export function buildWorkflowEmailHtml(options: EmailTemplateOptions): string {
  const domain = (() => {
    if (!options.targetUrl) return 'timesofindia.indiatimes.com';
    try {
      return new URL(options.targetUrl).hostname;
    } catch {
      return options.targetUrl;
    }
  })();

  // Guarantee articlesByCategory: if missing or empty, synthesize from newsDigest
  const articlesByCategory = options.articlesByCategory
    ? { ...options.articlesByCategory }
    : {};

  if (
    Object.keys(articlesByCategory).length === 0 &&
    options.newsDigest &&
    options.newsDigest.length > 0
  ) {
    for (const item of options.newsDigest) {
      const catKey = item.category.toLowerCase().trim();
      if (!articlesByCategory[catKey]) {
        articlesByCategory[catKey] = [];
      }
      articlesByCategory[catKey].push({
        headline: item.heading,
        subheading: item.subheading,
        author: item.author || `${domain.toUpperCase().split('.')[0]} News Desk`,
        publishedDate: item.publishedDate,
        summary: item.text,
        keyPoints: item.keyPoints,
        url:
          item.url ||
          (options.targetUrl && options.targetUrl.startsWith('http')
            ? options.targetUrl
            : `https://${domain}`),
        category: item.category,
      });
    }
  }

  // Guarantee newsDigest: if missing or empty, synthesize from articlesByCategory
  let newsDigest = options.newsDigest ? [...options.newsDigest] : [];
  if (newsDigest.length === 0 && Object.keys(articlesByCategory).length > 0) {
    newsDigest = Object.entries(articlesByCategory).map(([catKey, arts]) => {
      const theme = getCategoryTheme(catKey);
      const topArt = arts[0];
      return {
        category: theme.label,
        heading: topArt ? topArt.headline : `Breaking Developments in ${theme.label}`,
        subheading:
          topArt?.subheading ||
          `Live updates and primary reports monitored from https://${domain}/.`,
        text:
          topArt?.summary ||
          `Key coverage indicates rapid developments in the ${theme.label} sector today. Analysts and correspondents report significant shifts as events unfold across the wire.`,
        author: topArt?.author,
        publishedDate: topArt?.publishedDate,
        url: topArt?.url,
        keyPoints: topArt?.keyPoints,
      };
    });
  }

  const totalStoriesCount =
    options.totalStories ||
    Object.values(articlesByCategory).reduce(
      (acc, arr) => acc + (arr?.length || 0),
      0,
    ) ||
    newsDigest.length;

  const categoriesCount =
    Object.keys(articlesByCategory).filter(
      (k) => (articlesByCategory?.[k]?.length || 0) > 0,
    ).length || newsDigest.length;

  const nowFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 1. Articles Section (Rich Multi-Category Stories with Full Source Links, Summary & KEY FACTS)
  const articlesHtml = formatArticlesByCategoryHtml(
    articlesByCategory,
    options.targetUrl,
  );

  // 2. AI Executive Digest Section (1 high-level topic per category, Page 1 & 2 of PDF)
  const digestHtml = newsDigest.length
    ? formatCategorizedBriefingHtml(newsDigest)
    : options.categorizedDigestHtml || '';

  // 3. AI Summary / Insights Highlight
  const insightsHtml = options.keyInsights?.length
    ? `<div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
        <p style="margin: 0 0 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Key Strategic Insights:</p>
        <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: #334155; line-height: 1.5;">
          ${options.keyInsights.map((i) => `<li style="margin-bottom: 4px;">${i}</li>`).join('')}
        </ul>
       </div>`
    : '';

  const summaryHtml = options.extractedSummary
    ? `<div style="background-color: #f8fafc; border-radius: 10px; padding: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6;">
        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em; background-color: #eff6ff; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe;">
          🤖 Strategic Synthesis (Gemini 2.5 Flash)
        </span>
        <p style="margin: 10px 0 0; font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${options.extractedSummary}</p>
        ${insightsHtml}
      </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.subject}</title>
    </head>
    <body style="margin: 0; padding: 24px 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <!-- Main Email Container (620px max-width) -->
            <div style="max-width: 620px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e4e4e7; text-align: left;">

              <!-- Premium Header Banner -->
              <div style="background: linear-gradient(135deg, #090d16 0%, #1e293b 100%); padding: 28px 24px; color: #ffffff;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <!-- Brand / Origin Pill -->
                      <div style="margin-bottom: 10px;">
                        <span style="display: inline-block; padding: 3px 10px; background-color: rgba(16, 185, 129, 0.18); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; border-radius: 100px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
                          ● AGENTBROWSE INTELLIGENCE
                        </span>
                      </div>
                      <!-- Subject Heading -->
                      <h1 style="margin: 0 0 8px; font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3; letter-spacing: -0.01em;">
                        ${options.subject}
                      </h1>
                      <!-- Date & Origin Strip -->
                      <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
                        <span>📅 ${nowFormatted}</span>
                        ${domain ? `<span style="margin: 0 8px; color: #475569;">•</span><span>🌐 <strong>${domain}</strong></span>` : ''}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Summary Badges Strip -->
                ${
                  totalStoriesCount > 0
                    ? `<div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px;">
                        <span style="display: inline-block; padding: 3px 9px; background-color: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; font-size: 11px; font-weight: 600; color: #f1f5f9; margin-right: 6px;">
                          📰 ${totalStoriesCount} Stories Curated
                        </span>
                        ${
                          categoriesCount > 0
                            ? `<span style="display: inline-block; padding: 3px 9px; background-color: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; font-size: 11px; font-weight: 600; color: #f1f5f9; margin-right: 6px;">
                                🏷️ ${categoriesCount} Categories
                              </span>`
                            : ''
                        }
                        <span style="display: inline-block; padding: 3px 9px; background-color: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; font-size: 11px; font-weight: 600; color: #f1f5f9;">
                          ⚡ Autonomous AI
                        </span>
                      </div>`
                    : ''
                }
              </div>

              <!-- Body Content Wrapper -->
              <div style="padding: 24px;">
                <!-- AI Strategic Overview (if available) -->
                ${summaryHtml}

                <!-- AI Synthesized Category Digest (1 high-level topic per category, Page 1 & 2 of PDF) -->
                ${digestHtml}

                <!-- Structured Verified Articles per Category (Headline, Byline, Summary, KEY FACTS, Button, Page 3-23 of PDF) -->
                ${articlesHtml}

                <!-- Fallback description if no stories present -->
                ${
                  !articlesHtml && !digestHtml && !summaryHtml
                    ? `<div style="background-color: #fafafa; border-radius: 8px; padding: 16px; border: 1px solid #f4f4f5; font-size: 13px; color: #3f3f46; line-height: 1.6;">
                        ${options.defaultDescription}
                      </div>`
                    : ''
                }
              </div>

              <!-- Sleek Footer -->
              <div style="background-color: #fafafa; border-top: 1px solid #f4f4f5; padding: 20px 24px; font-size: 11px; color: #a1a1aa; line-height: 1.6;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <p style="margin: 0 0 4px; font-weight: 600; color: #71717a;">
                        AgentBrowse Autonomous Intelligence Engine
                      </p>
                      <p style="margin: 0; color: #a1a1aa;">
                        Curated via Browserbase Search & Fetch APIs • Synthesized by Gemini 2.5 Flash • Dispatched by Resend
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Extracts news digest, structured articles, AI summary, insights, and total counts from previous execution steps.
 */
export function extractStepPipelineContext(
  previousStepOutput?: Record<string, unknown>,
  pipelineOutputs?: Record<string, unknown>,
): {
  newsDigest: CategorizedNewsItem[];
  articlesByCategory: Record<string, ExtractedArticleJson[]>;
  extractedSummary: string;
  keyInsights: string[];
  rawDataPreview: string;
  totalStories: number;
} {
  let newsDigest: CategorizedNewsItem[] = [];
  let articlesByCategory: Record<string, ExtractedArticleJson[]> = {};
  let totalStories = 0;

  // 1. Extract from immediate previous step
  if (previousStepOutput) {
    if (Array.isArray(previousStepOutput.digest)) {
      newsDigest = previousStepOutput.digest as CategorizedNewsItem[];
    }
    if (
      previousStepOutput.articles &&
      typeof previousStepOutput.articles === 'object'
    ) {
      articlesByCategory = previousStepOutput.articles as Record<
        string,
        ExtractedArticleJson[]
      >;
    }
    if (typeof previousStepOutput.totalStories === 'number') {
      totalStories = previousStepOutput.totalStories;
    }
  }

  // 2. Fallback to check prior steps in the pipeline (e.g. news_gather before news_summary)
  if (pipelineOutputs) {
    for (const output of Object.values(pipelineOutputs)) {
      if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>;
        if (newsDigest.length === 0 && Array.isArray(obj.digest)) {
          newsDigest = obj.digest as CategorizedNewsItem[];
        }
        if (
          Object.keys(articlesByCategory).length === 0 &&
          obj.articles &&
          typeof obj.articles === 'object'
        ) {
          articlesByCategory = obj.articles as Record<
            string,
            ExtractedArticleJson[]
          >;
        }
        if (totalStories === 0 && typeof obj.totalStories === 'number') {
          totalStories = obj.totalStories;
        }
      }
    }
  }

  // 3. Bidirectional guarantee: if articlesByCategory is empty but newsDigest has items, synthesize articles
  if (Object.keys(articlesByCategory).length === 0 && newsDigest.length > 0) {
    for (const item of newsDigest) {
      const catKey = item.category.toLowerCase().trim();
      if (!articlesByCategory[catKey]) {
        articlesByCategory[catKey] = [];
      }
      articlesByCategory[catKey].push({
        headline: item.heading,
        subheading: item.subheading,
        author: item.author,
        publishedDate: item.publishedDate,
        summary: item.text,
        keyPoints: item.keyPoints,
        url: item.url,
        category: item.category,
      });
    }
  } else if (newsDigest.length === 0 && Object.keys(articlesByCategory).length > 0) {
    for (const [catKey, arts] of Object.entries(articlesByCategory)) {
      const theme = getCategoryTheme(catKey);
      const topArt = arts[0];
      if (topArt) {
        newsDigest.push({
          category: theme.label,
          heading: topArt.headline,
          subheading:
            topArt.subheading ||
            `Live updates and primary reports monitored from target portal.`,
          text: topArt.summary,
          author: topArt.author,
          publishedDate: topArt.publishedDate,
          url: topArt.url,
          keyPoints: topArt.keyPoints,
        });
      }
    }
  }

  // Compute total stories from articles if not explicitly provided
  if (totalStories === 0 && Object.keys(articlesByCategory).length > 0) {
    totalStories = Object.values(articlesByCategory).reduce(
      (acc, arr) => acc + (arr?.length || 0),
      0,
    );
  }

  let extractedSummary = '';
  let keyInsights: string[] = [];
  const rawDataPreview = '';

  if (previousStepOutput) {
    if (previousStepOutput.summary) {
      extractedSummary = String(previousStepOutput.summary);
    }
    if (Array.isArray(previousStepOutput.keyInsights)) {
      keyInsights = previousStepOutput.keyInsights.map(String);
    }
  }

  if (!extractedSummary && pipelineOutputs) {
    for (const output of Object.values(pipelineOutputs)) {
      if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>;
        if (obj.summary && !extractedSummary) {
          extractedSummary = String(obj.summary);
        }
        if (Array.isArray(obj.keyInsights) && keyInsights.length === 0) {
          keyInsights = obj.keyInsights.map(String);
        }
      }
    }
  }

  return {
    newsDigest,
    articlesByCategory,
    extractedSummary,
    keyInsights,
    rawDataPreview,
    totalStories,
  };
}
