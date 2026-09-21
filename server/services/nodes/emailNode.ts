import type { NodeHandler } from './types';
import { pickFirstString } from './nodeUtils';
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
    ctx.workflowNodes?.find((n) => n.data?.url?.includes('@'))?.data.url ||
    process.env.ALERT_EMAIL ||
    process.env.NODEMAILER_USER ||
    'sharma312006@gmail.com';

  // Extract contextual results from previous steps (news digest, articles, summary, insights)
  const {
    newsDigest,
    articlesByCategory,
    extractedSummary,
    keyInsights,
    rawDataPreview,
    totalStories,
  } = extractStepPipelineContext(ctx.previousStepOutput, ctx.pipelineOutputs);

  const resolvedTargetUrl =
    pickFirstString(
      node.data.url && node.data.url.startsWith('http') ? node.data.url : '',
      ctx.targetUrl && ctx.targetUrl.startsWith('http') ? ctx.targetUrl : '',
      ctx.workflowNodes?.find((n) => n.data?.url && n.data.url.startsWith('http'))
        ?.data.url,
      newsDigest.length > 0 &&
      newsDigest[0]?.url &&
      newsDigest[0].url.startsWith('http')
        ? newsDigest[0].url
        : '',
      'https://agentbrowse.com',
    );

  const subject =
    (node.data.title && node.data.title !== 'Email Notification'
      ? node.data.title
      : undefined) ||
    (totalStories > 0 ||
    newsDigest.length > 0 ||
    Object.keys(articlesByCategory).length > 0
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
        ([category, articles]) =>
          `[${category.toUpperCase()}]\n` +
          articles
            .map(
              (article, articleIndex) =>
                `${articleIndex + 1}. ${article.headline}\n${article.summary}\nSource: ${article.url || ''}`,
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
            ? 'Key Insights:\n' +
              keyInsights.map((insight) => `• ${insight}`).join('\n')
            : ''
        }`
      : defaultDescription;

  // Resolve chosen email provider from node data or metrics
  const rawProvider =
    (typeof node.data.emailProvider === 'string'
      ? node.data.emailProvider
      : undefined) ||
    node.data.metrics?.find((m) => m.label.toLowerCase() === 'provider')
      ?.value ||
    'resend';

  const providerType =
    rawProvider.toLowerCase().includes('nodemailer') ||
    rawProvider.toLowerCase().includes('smtp')
      ? 'nodemailer'
      : 'resend';

  const providerLabel =
    providerType === 'nodemailer' ? 'Nodemailer (SMTP)' : 'Resend API';

  logs.push(
    `[Email Provider: ${providerLabel}] Preparing email dispatch to: ${recipient}`,
  );
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

  let sendRes;
  try {
    sendRes = await EmailService.sendEmail(
      {
        to: recipient,
        subject,
        html,
        text: bodyContent,
      },
      providerType,
    );
    if (sendRes.mode === 'simulation') {
      const liveAlt = providerType === 'resend' ? 'nodemailer' : 'resend';
      logs.push(
        `Notice: ${providerLabel} returned simulated status. Dispatching live via ${liveAlt}...`,
      );
      const liveRes = await EmailService.sendEmail(
        {
          to: recipient,
          subject,
          html,
          text: bodyContent,
        },
        liveAlt,
      );
      if (liveRes.mode === 'live') {
        sendRes = liveRes;
      }
    }
  } catch (err) {
    const fallbackProvider =
      providerType === 'resend' ? 'nodemailer' : 'resend';
    logs.push(
      `Primary dispatch via ${providerLabel} encountered an issue: ${err instanceof Error ? err.message : String(err)}. Retrying live delivery via ${fallbackProvider}...`,
    );
    sendRes = await EmailService.sendEmail(
      {
        to: recipient,
        subject,
        html,
        text: bodyContent,
      },
      fallbackProvider,
    );
  }

  logs.push(
    `Email dispatched successfully via ${sendRes.provider} (${sendRes.mode}): Message ID = ${sendRes.id}`,
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
