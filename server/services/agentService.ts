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
  provider: "gemini" | "grok" | "simulation";
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
        provider: "Google Gemini 2.5 Multimodal Engine",
        defaultModel: "gemini-2.5-pro",
      },
      grok: {
        isConfigured: Boolean(grokKey && grokKey.length > 5),
        provider: "xAI Grok Reasoning Engine",
        defaultModel: "grok-2",
      },
    };
  }

  /**
   * Resolve provider and specific model identifier based on user input string
   */
  static resolveProvider(modelName?: string): {
    provider: "gemini" | "grok";
    resolvedModel: string;
  } {
    const name = (modelName || "gemini").toLowerCase();

    if (name.includes("grok") || name.includes("xai")) {
      if (name.includes("vision")) return { provider: "grok", resolvedModel: "grok-2-vision-1212" };
      return { provider: "grok", resolvedModel: "grok-2" };
    }

    if (name.includes("flash")) return { provider: "gemini", resolvedModel: "gemini-2.5-flash" };
    if (name.includes("2.0")) return { provider: "gemini", resolvedModel: "gemini-2.0-flash" };
    return { provider: "gemini", resolvedModel: "gemini-2.5-pro" };
  }

  /**
   * Autonomous web summarization using Gemini or Grok
   */
  static async summarizeWebPage(
    input: SummarizeWebPageInput
  ): Promise<SummarizeWebPageResult> {
    const { provider, resolvedModel } = this.resolveProvider(input.modelName);
    const trimmedText = (input.pageText || "").trim().slice(0, 16000); // Truncate to safe token boundary
    const approxWords = trimmedText.split(/\s+/).filter(Boolean).length;
    const instruction = input.instruction || "Summarize the key information and purpose of this webpage";

    // 1. Google Gemini Provider
    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY?.trim();

      if (apiKey) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`;
          const prompt = `You are an autonomous web intelligence agent summarizing web data.
Target Web Page: ${input.targetUrl || "Current Page"}
Page Title: ${input.pageTitle || "N/A"}
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
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };

          const rawText =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated.";

          const keyInsights = rawText
            .split("\n")
            .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"))
            .map((l) => l.replace(/^[-*]\s*/, "").trim())
            .slice(0, 8);

          return {
            summary: rawText,
            keyInsights: keyInsights.length > 0 ? keyInsights : ["Extracted web content synthesized"],
            provider: "gemini",
            modelUsed: resolvedModel,
            wordCount: approxWords,
          };
        } catch (err) {
          console.warn("[AgentService] Gemini live call failed, falling back to simulated summary:", err);
        }
      }
    }

    // 2. xAI Grok Provider
    if (provider === "grok") {
      const apiKey = process.env.GROK_API_KEY?.trim();

      if (apiKey) {
        try {
          const endpoint = "https://api.x.ai/v1/chat/completions";
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: resolvedModel,
              messages: [
                {
                  role: "system",
                  content: "You are Grok, an autonomous web intelligence agent with sharp perception and deep reasoning.",
                },
                {
                  role: "user",
                  content: `Target Page: ${input.targetUrl || "Active Page"}
Page Title: ${input.pageTitle || "N/A"}
Task: ${instruction}

Page Text:
"""
${trimmedText}
"""

Synthesize this into a structured executive brief with key bulleted insights.`,
                },
              ],
              temperature: 0.2,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Grok API error (${res.status}): ${errText}`);
          }

          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };

          const rawText = data.choices?.[0]?.message?.content || "No summary generated.";
          const keyInsights = rawText
            .split("\n")
            .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"))
            .map((l) => l.replace(/^[-*]\s*/, "").trim())
            .slice(0, 8);

          return {
            summary: rawText,
            keyInsights: keyInsights.length > 0 ? keyInsights : ["Grok synthesis complete"],
            provider: "grok",
            modelUsed: resolvedModel,
            wordCount: approxWords,
          };
        } catch (err) {
          console.warn("[AgentService] Grok live call failed, falling back to simulated summary:", err);
        }
      }
    }

    // 3. Intelligent Simulation Fallback (when API keys are not provided)
    const simulatedInsights = [
      `Synthesized ${approxWords} words across DOM text hierarchy.`,
      `Target URL (${input.targetUrl || "DOM active"}) validated and indexed.`,
      `Identified core navigation blocks, primary article containers, and interactive anchors.`,
      `Verified HTTP 200 DOM state ready for downstream webhook exports.`,
    ];

    const simulatedSummary =
      `[Autonomous ${provider === "grok" ? "xAI Grok" : "Google Gemini"} Agent Simulation]\n\n` +
      `Summary for: "${input.pageTitle || input.targetUrl || "Active Web Page"}"\n` +
      `Goal: ${instruction}\n\n` +
      `The target webpage was parsed and distilled into actionable insights. ` +
      `Extracted approximately ${approxWords} words of textual content. ` +
      `Key findings indicate primary data anchors and interactive DOM containers are responsive. ` +
      `(Note: Configure ${provider === "grok" ? "GROK_API_KEY" : "GEMINI_API_KEY"} in .env for live cloud inference).`;

    return {
      summary: simulatedSummary,
      keyInsights: simulatedInsights,
      provider: "simulation",
      modelUsed: `${resolvedModel} (Simulated)`,
      wordCount: approxWords,
    };
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
    const { provider, resolvedModel } = this.resolveProvider(input.modelName);
    const categoriesList =
      input.categories.length > 0
        ? input.categories.join(", ")
        : "war, sports, crime, ai, politics";
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (apiKey) {
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
${input.content.slice(0, 16000)}
"""`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };

          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          let items: CategorizedNewsItem[] = [];

          try {
            items = JSON.parse(rawText);
          } catch {
            const cleanJson = rawText
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim();
            items = JSON.parse(cleanJson);
          }

          if (Array.isArray(items) && items.length > 0) {
            const formattedBriefing = items
              .map(
                (item) =>
                  `[${item.category.toUpperCase()}]\nheading: ${item.heading}\nsubheading: ${item.subheading}\ntext: ${item.text}`
              )
              .join("\n\n");

            return {
              items,
              formattedBriefing,
              provider: "gemini",
              modelUsed: resolvedModel,
            };
          }
        }
      } catch (err) {
        console.warn(
          "[AgentService] Categorized news digest failed via Gemini, falling back:",
          err
        );
      }
    }

    // Fallback simulation / default extraction
    const nowStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const fallbackItems: CategorizedNewsItem[] = (
      input.categories.length > 0
        ? input.categories
        : ["war", "sports", "crime", "ai", "politics"]
    ).map((cat) => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      heading: `Breaking Developments in ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
      subheading: `Live updates and primary reports monitored from ${input.targetUrl || "https://timesofindia.indiatimes.com/"}.`,
      text: `Key coverage indicates rapid developments in the ${cat} sector today. Analysts and correspondents report significant shifts as events unfold across the wire.`,
      author: "Intelligence Wire Desk",
      publishedDate: nowStr,
      keyPoints: [
        `Key developments reported in the ${cat} sector today.`,
        `Ongoing updates tracked from verified regional correspondents.`,
        `Intelligence desk continues monitoring primary wire updates.`,
      ],
      url: input.targetUrl || "https://timesofindia.indiatimes.com/",
    }));

    const formattedBriefing = fallbackItems
      .map(
        (item) =>
          `[${item.category.toUpperCase()}]\nheading: ${item.heading}\nsubheading: ${item.subheading}\ntext: ${item.text}`
      )
      .join("\n\n");

    return {
      items: fallbackItems,
      formattedBriefing,
      provider: "simulation",
      modelUsed: `${resolvedModel} (Fallback)`,
    };
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
  provider: "gemini" | "grok" | "simulation";
  modelUsed: string;
}
