import type { NodeHandler } from './types';
import { EmailService } from '../emailService';
import {
  formatCategorizedBriefingHtml,
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

  const subject =
    node.data.title ||
    node.data.actionSummary ||
    'AgentBrowse Workflow Notification';

  const defaultDescription =
    node.data.description ||
    node.data.actionSummary ||
    `Workflow step [${node.data.title}] dispatched an email notification for target ${ctx.targetUrl}.`;

  // Extract contextual results from previous steps (news digest, summary, insights, scraped data)
  const { newsDigest, extractedSummary, keyInsights, rawDataPreview } =
    extractStepPipelineContext(ctx.previousStepOutput, ctx.pipelineOutputs);

  let categorizedDigestHtml = '';
  let categorizedDigestText = '';

  if (newsDigest.length > 0) {
    categorizedDigestText = newsDigest
      .map(
        (item) =>
          `[${item.category.toUpperCase()}]\nheading: ${item.heading}\nsubheading: ${item.subheading}\ntext: ${item.text}`,
      )
      .join('\n\n');

    categorizedDigestHtml = formatCategorizedBriefingHtml(newsDigest);
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

  logs.push(`Preparing Resend email dispatch to: ${recipient}`);
  logs.push(`Subject: "${subject}"`);

  const html = buildWorkflowEmailHtml({
    subject,
    targetUrl: ctx.targetUrl,
    defaultDescription,
    categorizedDigestHtml,
    extractedSummary,
    keyInsights,
    rawDataPreview,
  });

  const sendRes = await EmailService.sendEmail({
    to: recipient,
    subject,
    html,
    text: bodyContent,
  });

  logs.push(
    `Email dispatched successfully (${sendRes.mode}): Message ID = ${sendRes.id}`,
  );

  return {
    output: {
      messageId: sendRes.id,
      recipient: sendRes.recipient,
      subject: sendRes.subject,
      mode: sendRes.mode,
      deliveredAt: sendRes.deliveredAt,
      includedSummary: Boolean(extractedSummary || categorizedDigestText),
      storiesDelivered: newsDigest.length,
    },
    logs,
  };
};
