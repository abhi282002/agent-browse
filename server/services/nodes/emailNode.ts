import type { NodeHandler } from './types';
import { EmailService } from '../emailService';
import {
  buildWorkflowEmailHtml,
  extractStepPipelineContext,
} from '../emailFormatterUtils';

/**
 * Email Archetype Handler
 * Dispatches notification alerts via Resend
 */
export const executeEmailNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];

  const recipient =
    (node.data.url?.includes('@') ? node.data.url : undefined) ||
    ctx.userEmail ||
    process.env.ALERT_EMAIL ||
    'alerts@agentbrowse.com';

  // Extract contextual results from previous steps (news digest, articles, summary, insights)
  const {
    newsDigest,
    articlesByCategory,
    extractedSummary,
    keyInsights,
    rawDataPreview,
    totalStories,
  } = extractStepPipelineContext(ctx.previousStepOutput, ctx.pipelineOutputs);

  const resolvedTargetUrl = (() => {
    if (node.data.url && node.data.url.startsWith('http')) return node.data.url;
    if (ctx.targetUrl && ctx.targetUrl.startsWith('http')) return ctx.targetUrl;
    if (ctx.pipelineOutputs) {
      for (const out of Object.values(ctx.pipelineOutputs)) {
        if (out && typeof out === 'object') {
          const obj = out as Record<string, unknown>;
          if (typeof obj.url === 'string' && obj.url.startsWith('http')) return obj.url;
          if (typeof obj.targetUrl === 'string' && obj.targetUrl.startsWith('http')) return obj.targetUrl;
        }
      }
    }
    return 'https://timesofindia.indiatimes.com/';
  })();

  const subject =
    (node.data.title && node.data.title !== 'Email Notification'
      ? node.data.title
      : undefined) ||
    (totalStories > 0 || newsDigest.length > 0 || Object.keys(articlesByCategory).length > 0
      ? 'Send Executive Briefing Email'
      : undefined) ||
    node.data.title ||
    node.data.actionSummary ||
    'AgentBrowse Workflow Notification';

  const targetSite = resolvedTargetUrl;
  const defaultDescription =
    node.data.description ||
    node.data.actionSummary ||
    `Workflow step [${node.data.title}] dispatched an email notification for ${targetSite}.`;

  let categorizedDigestText = '';
  if (newsDigest.length > 0) {
    categorizedDigestText = newsDigest
      .map(
        (item) =>
          `[${item.category.toUpperCase()}]\nheading: ${item.heading}\nsubheading: ${item.subheading}\ntext: ${item.text}`,
      )
      .join('\n\n');
  } else if (Object.keys(articlesByCategory).length > 0) {
    categorizedDigestText = Object.entries(articlesByCategory)
      .map(
        ([cat, arts]) =>
          `[${cat.toUpperCase()}]\n` +
          arts
            .map(
              (a, i) =>
                `${i + 1}. ${a.headline}\n${a.summary}\nSource: ${a.url || ''}`,
            )
            .join('\n'),
      )
      .join('\n\n');
  }

  const bodyContent = categorizedDigestText
    ? `Executive News Briefing:\n\n${categorizedDigestText}`
    : extractedSummary
      ? `Summary of Results:\n${extractedSummary}\n\n${
          keyInsights.length
            ? 'Key Insights:\n' + keyInsights.map((i) => `• ${i}`).join('\n')
            : ''
        }`
      : defaultDescription;

  // Resolve chosen email provider from node data or metrics
  const rawProvider =
    (typeof node.data.emailProvider === 'string'
      ? node.data.emailProvider
      : undefined) ||
    node.data.metrics?.find((m) => m.label.toLowerCase() === 'provider')?.value ||
    'resend';

  const providerType =
    rawProvider.toLowerCase().includes('nodemailer') ||
    rawProvider.toLowerCase().includes('smtp')
      ? 'nodemailer'
      : 'resend';

  const providerLabel =
    providerType === 'nodemailer' ? 'Nodemailer (SMTP)' : 'Resend API';

  logs.push(`[Email Provider: ${providerLabel}] Preparing email dispatch to: ${recipient}`);
  logs.push(`Subject: "${subject}"`);
  if (totalStories > 0) {
    logs.push(
      `Briefing contains ${totalStories} curated stories across categories.`,
    );
  }

  const html = buildWorkflowEmailHtml({
    subject,
    targetUrl: resolvedTargetUrl,
    defaultDescription,
    newsDigest,
    articlesByCategory,
    totalStories,
    extractedSummary,
    keyInsights,
    rawDataPreview,
  });

  const sendRes = await EmailService.sendEmail(
    {
      to: recipient,
      subject,
      html,
      text: bodyContent,
    },
    providerType,
  );

  logs.push(
    `Email dispatched successfully via ${providerLabel} (${sendRes.mode}): Message ID = ${sendRes.id}`,
  );

  return {
    output: {
      messageId: sendRes.id,
      recipient: sendRes.recipient,
      subject: sendRes.subject,
      mode: sendRes.mode,
      provider: sendRes.provider,
      deliveredAt: sendRes.deliveredAt,
      includedSummary: Boolean(extractedSummary || categorizedDigestText),
      storiesDelivered: newsDigest.length,
    },
    logs,
  };
};

