import type { CategorizedNewsItem } from './agentService';

export interface EmailTemplateOptions {
  subject: string;
  targetUrl: string;
  defaultDescription: string;
  categorizedDigestHtml?: string;
  extractedSummary?: string;
  keyInsights?: string[];
  rawDataPreview?: string;
}

/**
 * Generates structured HTML card elements for categorized news digest items.
 */
export function formatCategorizedBriefingHtml(
  newsDigest: CategorizedNewsItem[],
): string {
  if (newsDigest.length === 0) return '';

  return `
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; padding: 4px 10px; background-color: #059669; color: #ffffff; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Executive Categorized Briefing (${newsDigest.length} Topics)</span>
      ${newsDigest
        .map(
          (item) => `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">${item.category}</span>
          </div>
          <h3 style="margin: 4px 0 2px; font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.3;">${item.heading}</h3>
          <h4 style="margin: 0 0 8px; font-size: 12px; font-weight: 500; color: #64748b; font-style: italic;">${item.subheading}</h4>
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">${item.text}</p>
        </div>`,
        )
        .join('')}
    </div>
  `;
}

/**
 * Builds the complete responsive HTML template for workflow alert emails.
 */
export function buildWorkflowEmailHtml(options: EmailTemplateOptions): string {
  const insightsHtml = options.keyInsights?.length
    ? `<div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
        <p style="margin: 0 0 6px; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #475569;">Key Insights:</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.5;">
          ${options.keyInsights.map((i) => `<li>${i}</li>`).join('')}
        </ul>
       </div>`
    : '';

  const summaryHtml = options.extractedSummary
    ? `<div style="background-color: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em;">AI Executive Summary</span>
        <p style="margin: 8px 0 0; font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${options.extractedSummary}</p>
        ${insightsHtml}
      </div>`
    : '';

  const rawDataHtml = options.rawDataPreview
    ? `<div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-family: monospace; font-size: 11px; color: #334155; max-height: 200px; overflow-y: auto; white-space: pre-wrap;">
        ${options.rawDataPreview.slice(0, 1000)}
       </div>`
    : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 1px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 16px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #10b981; letter-spacing: 0.05em;">AgentBrowse Automated Alert</span>
        <h2 style="margin: 8px 0 0; color: #18181b; font-size: 18px; font-weight: 700;">${options.subject}</h2>
      </div>
      <div style="background-color: #fafafa; border-radius: 8px; padding: 14px; margin-bottom: 16px; border: 1px solid #f4f4f5;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #52525b;"><strong>Target Webpage:</strong> <a href="${options.targetUrl}" style="color: #2563eb; text-decoration: none;">${options.targetUrl}</a></p>
        <p style="margin: 0; font-size: 13px; color: #27272a; line-height: 1.5;">${options.defaultDescription}</p>
      </div>
      ${options.categorizedDigestHtml || ''}
      ${summaryHtml}
      ${rawDataHtml}
      <p style="margin: 0; font-size: 11px; color: #a1a1aa;">Sent via Resend Email Infrastructure • AgentBrowse Autonomous Engine</p>
    </div>
  `;
}

/**
 * Extracts news digest, AI summary, insights, and raw data from previous execution steps.
 */
export function extractStepPipelineContext(
  previousStepOutput?: Record<string, unknown>,
  pipelineOutputs?: Record<string, unknown>,
): {
  newsDigest: CategorizedNewsItem[];
  extractedSummary: string;
  keyInsights: string[];
  rawDataPreview: string;
} {
  let newsDigest: CategorizedNewsItem[] = [];
  if (Array.isArray(previousStepOutput?.digest)) {
    newsDigest = previousStepOutput.digest as CategorizedNewsItem[];
  }

  if (newsDigest.length === 0 && pipelineOutputs) {
    for (const output of Object.values(pipelineOutputs)) {
      if (
        output &&
        typeof output === 'object' &&
        Array.isArray((output as Record<string, unknown>).digest)
      ) {
        newsDigest = (output as Record<string, unknown>)
          .digest as CategorizedNewsItem[];
        break;
      }
    }
  }

  let extractedSummary = '';
  let keyInsights: string[] = [];
  let rawDataPreview = '';

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
        if (
          !rawDataPreview &&
          (obj.articles || obj.data || obj.extractedData || obj.items)
        ) {
          rawDataPreview = JSON.stringify(
            obj.articles || obj.data || obj.extractedData || obj.items,
            null,
            2,
          );
        }
      }
    }
  }

  return { newsDigest, extractedSummary, keyInsights, rawDataPreview };
}
