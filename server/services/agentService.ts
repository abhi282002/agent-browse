export interface AgentStatus {
  isConfigured: boolean;
  provider: string;
  defaultModel: string;
}

export interface SummarizeWebPageInput {
  pageText: string;
  pageTitle?: string;
  targetUrl?: string;
  instruction?: string;
  modelName?: string;
}

export interface SummarizeWebPageResult {
  summary: string;
  keyInsights: string[];
  provider: 'gemini' | 'grok';
  modelUsed: string;
  wordCount: number;
}

export class AgentService {
  /**
   * Check status of Gemini and Grok API configurations
   */
  static getStatus(): { gemini: AgentStatus; grok: AgentStatus } {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const grokKey = process.env.GROK_API_KEY?.trim();

    return {
      gemini: {
        isConfigured: Boolean(geminiKey && geminiKey.length > 5),
        provider: 'Google Gemini 2.5 Multimodal Engine',
        defaultModel: 'gemini-2.5-pro',
      },
      grok: {
        isConfigured: Boolean(grokKey && grokKey.length > 5),
        provider: 'xAI Grok Reasoning Engine',
        defaultModel: 'grok-2',
      },
    };
  }

  /**
   * Resolve provider and specific model identifier based on user input string
   */
  static resolveProvider(modelName?: string): {
    provider: 'gemini' | 'grok';
    resolvedModel: string;
  } {
    const name = (modelName || 'gemini').toLowerCase();

    if (name.includes('grok') || name.includes('xai')) {
      if (name.includes('vision'))
        return { provider: 'grok', resolvedModel: 'grok-2-vision-1212' };
      return { provider: 'grok', resolvedModel: 'grok-2' };
    }

    if (name.includes('flash'))
      return { provider: 'gemini', resolvedModel: 'gemini-2.5-flash' };
    if (name.includes('2.0'))
      return { provider: 'gemini', resolvedModel: 'gemini-2.0-flash' };
    return { provider: 'gemini', resolvedModel: 'gemini-2.5-pro' };
  }

  /**
   * Autonomous web summarization using Gemini or Grok
   */
  static async summarizeWebPage(
    input: SummarizeWebPageInput,
  ): Promise<SummarizeWebPageResult> {
    const { provider, resolvedModel } = this.resolveProvider(input.modelName);
    const trimmedText = (input.pageText || '').trim().slice(0, 16000); // Truncate to safe token boundary
    const approxWords = trimmedText.split(/\s+/).filter(Boolean).length;
    const instruction =
      input.instruction ||
      'Summarize the key information and purpose of this webpage';

    // 1. Google Gemini Provider
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY?.trim();

      if (apiKey) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`;
          const prompt = `You are an autonomous web intelligence agent summarizing web data.
Target Web Page: ${input.targetUrl || 'Current Page'}
Page Title: ${input.pageTitle || 'N/A'}
User Goal/Instruction: ${instruction}

Extracted Web Content:
"""
${trimmedText}
"""

Please provide:
1. An executive summary (2-3 concise paragraphs).
2. Key bulleted insights or data findings.
Format your output cleanly.`;

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2 },
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gemini API error (${res.status}): ${errText}`);
          }

          const data = (await res.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };

          const rawText =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'No summary generated.';

          const keyInsights = rawText
            .split('\n')
            .filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*'))
            .map((l) => l.replace(/^[-*]\s*/, '').trim())
            .slice(0, 8);

          return {
            summary: rawText,
            keyInsights:
              keyInsights.length > 0
                ? keyInsights
                : ['Extracted web content synthesized'],
            provider: 'gemini',
            modelUsed: resolvedModel,
            wordCount: approxWords,
          };
        } catch (err) {
          console.error('[AgentService] Gemini live call failed:', err);
          throw new Error(
            `Autonomous summarization failed via Gemini: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      } else {
        throw new Error(
          'GEMINI_API_KEY is not configured in environment. Live AI inference requires a valid API key.',
        );
      }
    }

    // 2. xAI Grok / Groq Provider
    if (provider === 'grok') {
      const apiKey = process.env.GROK_API_KEY?.trim();

      if (apiKey) {
        try {
          const isGroq = apiKey.startsWith('gsk_');
          const endpoint = isGroq
            ? 'https://api.groq.com/openai/v1/chat/completions'
            : 'https://api.x.ai/v1/chat/completions';
          const modelToCall = isGroq ? 'llama-3.1-8b-instant' : resolvedModel;

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: modelToCall,
              messages: [
                {
                  role: 'system',
                  content:
                    'You are an autonomous web intelligence agent with sharp perception and deep reasoning.',
                },
                {
                  role: 'user',
                  content: `Target Page: ${input.targetUrl || 'Active Page'}\nPage Title: ${input.pageTitle || 'N/A'}\nTask: ${instruction}\n\nPage Text:\n"""\n${trimmedText}\n"""\n\nSynthesize this into a structured executive brief with key bulleted insights.`,
                },
              ],
              temperature: 0.2,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Grok/Groq API error (${res.status}): ${errText}`);
          }

          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };

          const rawText =
            data.choices?.[0]?.message?.content || 'No summary generated.';
          const keyInsights = rawText
            .split('\n')
            .filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*'))
            .map((l) => l.replace(/^[-*]\s*/, '').trim())
            .slice(0, 8);

          return {
            summary: rawText,
            keyInsights:
              keyInsights.length > 0
                ? keyInsights
                : ['Grok synthesis complete'],
            provider: 'grok',
            modelUsed: modelToCall,
            wordCount: approxWords,
          };
        } catch (err) {
          console.error('[AgentService] Grok/Groq live call failed:', err);
          throw new Error(
            `Autonomous summarization failed via Grok/Groq: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      } else {
        throw new Error(
          'GROK_API_KEY is not configured in environment. Live AI inference requires a valid API key.',
        );
      }
    }

    throw new Error(
      `Unsupported AI provider: ${provider}. Please specify a valid provider or model.`,
    );
  }

  /**
   * Autonomous categorized news summarization with structured heading, subheading, and text
   */
  static async generateCategorizedNewsDigest(input: {
    categories: string[];
    content: string;
    targetUrl?: string;
    modelName?: string;
  }): Promise<CategorizedNewsDigestResult> {
    const { resolvedModel } = this.resolveProvider(input.modelName);
    const categoriesList =
      input.categories.length > 0
        ? input.categories.join(', ')
        : 'war, sports, crime, ai, politics';
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    let textContent = input.content ? input.content.trim() : '';

    // If content was not passed or is too short, fetch real content from targetUrl if available
    if (textContent.length < 50 && input.targetUrl && input.targetUrl.startsWith('http')) {
      try {
        console.log(`[AgentService] Fetching real content from target URL: ${input.targetUrl}`);
        const res = await fetch(input.targetUrl, {
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
            textContent = cleanText;
          }
        }
      } catch (fetchErr) {
        console.warn(`[AgentService] Failed to fetch content from target URL: ${fetchErr}`);
      }
    }

    if (!textContent || textContent.length < 50) {
      throw new Error(
        `Cannot generate categorized news digest: No webpage content was gathered or provided for analysis. Target URL: ${input.targetUrl || 'None'}`,
      );
    }

    if (!apiKey) {
      throw new Error(
        `GEMINI_API_KEY is missing in environment. Real cloud AI inference requires a valid GEMINI_API_KEY.`,
      );
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`;
      const prompt = `You are an elite news editor and autonomous intelligence agent.
Analyze the following news webpage content and extract/summarize stories specifically for each of these categories: [${categoriesList}].

For EACH category found in the text, extract and summarize ALL the distinct news stories provided (up to 3-5 stories per category). Do not limit each category to just one single story. Format the result strictly as a JSON array of objects where each story has these exact keys:
[
  {
    "category": "<Full formal category name, e.g. AI & Technology, World & Defense, Sports, Politics & National, Crime & Law, Technology, Health, Culture, Arts, Travel, Earth>",
    "heading": "<Concise, punchy news headline>",
    "subheading": "<1 sentence contextual deck / subheading>",
    "text": "<2-3 paragraph comprehensive, detailed summary of the event>",
    "author": "<Author or reporter name, e.g. Staff Reporter / News Desk>",
    "publishedDate": "<Publication date or timestamp>",
    "keyPoints": [
      "<Crucial fact or event 1>",
      "<Crucial fact or event 2>",
      "<Crucial fact or event 3>"
    ],
    "url": "<Original article URL if present in the text>"
  }
]

Do not include markdown code block formatting or backticks around the JSON. Return only the raw JSON array.

Webpage Content:
"""
${textContent.slice(0, 16000)}
"""`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(
          `Gemini API returned status ${res.status} (${res.statusText}): ${errBody.slice(0, 300)}`,
        );
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let items: CategorizedNewsItem[] = [];

      try {
        items = JSON.parse(rawText);
      } catch {
        const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          items = JSON.parse(jsonMatch[0]);
        } else {
          const cleanJson = rawText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          items = JSON.parse(cleanJson);
        }
      }

      if (Array.isArray(items) && items.length > 0) {
        // Normalize URLs if not present on individual items
        for (const it of items) {
          if (!it.url && input.targetUrl) {
            it.url = input.targetUrl;
          }
        }

        const formattedBriefing = items
          .map(
            (item) =>
              `[${item.category.toUpperCase()}]\nheading: ${item.heading}\nsubheading: ${item.subheading}\ntext: ${item.text}`,
          )
          .join('\n\n');

        return {
          items,
          formattedBriefing,
          provider: 'gemini',
          modelUsed: resolvedModel,
        };
      } else {
        throw new Error(
          `Gemini responded successfully but returned an empty array of news stories. Raw response preview: ${rawText.slice(0, 200)}`,
        );
      }
    } catch (err) {
      console.error(
        `[AgentService] Categorized news digest generation failed via Gemini (${resolvedModel}):`,
        err,
      );
      throw new Error(
        `Failed to generate categorized news digest via ${resolvedModel}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

export interface CategorizedNewsItem {
  category: string;
  heading: string;
  subheading: string;
  text: string;
  author?: string;
  publishedDate?: string;
  keyPoints?: string[];
  url?: string;
}

export interface CategorizedNewsDigestResult {
  items: CategorizedNewsItem[];
  formattedBriefing: string;
  provider: 'gemini' | 'grok';
  modelUsed: string;
}
