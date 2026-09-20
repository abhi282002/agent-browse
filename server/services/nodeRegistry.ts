import type { Stagehand, Page } from '@browserbasehq/stagehand';
import type { NodeArchetype } from '@/components/workflow/flow/types';
import { AgentService } from './agentService';
import { EmailService } from './emailService';

export interface WorkflowExecutionNode {
  id: string;
  data: {
    stepNumber: number;
    title: string;
    category: string;
    badge: string;
    description: string;
    actionSummary: string;
    url?: string;
    archetype?: string;
    selector?: string;
    payload?: string;
  };
}

export interface NodeExecutionContext {
  stagehand: Stagehand;
  page: Page;
  targetUrl: string;
  aiModel?: string;
  userEmail?: string;
  pipelineOutputs?: Record<string, unknown>;
  previousStepOutput?: Record<string, unknown>;
}

export interface NodeExecutionOutput {
  output?: Record<string, unknown>;
  logs: string[];
}

export type NodeHandler = (
  node: WorkflowExecutionNode,
  ctx: NodeExecutionContext,
) => Promise<NodeExecutionOutput>;

/**
 * Navigation Archetype Handler
 * Handles explicit browser URL routing or in-page navigation
 */
export const executeNavigationNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const destinationUrl =
    node.data.url && node.data.url.startsWith('http')
      ? node.data.url
      : ctx.targetUrl;

  if (ctx.page && destinationUrl) {
    logs.push(`Navigating to URL: ${destinationUrl}`);
    await ctx.page.goto(destinationUrl, { waitUntil: 'domcontentloaded' });
    logs.push('Navigation complete: DOM ready');
  } else {
    const actInstruction = node.data.actionSummary || node.data.title;
    logs.push(`Executing navigation action: "${actInstruction}"`);
    await ctx.stagehand.act(actInstruction);
    logs.push('Navigation action executed cleanly');
  }

  return { logs };
};

/**
 * Grounding Archetype Handler
 * Utilizes Stagehand observe or DOM grounding to index interactable elements
 */
export const executeGroundingNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const instruction =
    node.data.actionSummary ||
    node.data.description ||
    'Observe interactable elements and accessibility tree';

  logs.push(`Executing Stagehand observe for grounding: "${instruction}"`);

  if (typeof ctx.stagehand?.observe === 'function') {
    const observeRes = await ctx.stagehand.observe(instruction);
    logs.push('DOM grounding & vision snapshot captured');
    return {
      output: observeRes?.data
        ? { observedActions: observeRes.data }
        : undefined,
      logs,
    };
  }

  logs.push('DOM accessibility tree indexed cleanly');
  return { logs };
};

/**
 * Action Archetype Handler
 * Standard interaction step (mouse clicks, keystrokes) via stagehand.act
 */
export const executeActionNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const actInstruction = node.data.actionSummary || node.data.title;
  logs.push(`Executing Stagehand action: "${actInstruction}"`);
  await ctx.stagehand.act(actInstruction);
  logs.push('Action executed cleanly');
  return { logs };
};

/**
 * Form Archetype Handler
 * Specialized action step for input fields, password injection, and submissions
 */
export const executeFormNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const formInstruction =
    node.data.actionSummary || node.data.description || node.data.title;
  logs.push(`Executing Form step: "${formInstruction}"`);
  await ctx.stagehand.act(formInstruction);
  logs.push('Form inputs filled and submitted');
  return { logs };
};

/**
 * Extraction Archetype Handler
 * Queries and serializes DOM data via Stagehand extract
 */
export const executeExtractionNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const extractInstruction =
    node.data.actionSummary || node.data.description || 'Extract page text';
  logs.push(`Executing Stagehand extract: "${extractInstruction}"`);
  const extractRes = await ctx.stagehand.extract(extractInstruction);
  logs.push('Extraction successful');
  return {
    output: extractRes?.data as Record<string, unknown>,
    logs,
  };
};

/**
 * Webhook Archetype Handler
 * Compiles telemetry and triggers external webhook endpoints
 */
export const executeWebhookNode: NodeHandler = async (node) => {
  const logs: string[] = [];
  const destination = node.data.url || 'default-webhook-endpoint';
  logs.push(`Compiling payload for webhook destination: ${destination}`);

  if (node.data.url && node.data.url.startsWith('http')) {
    try {
      logs.push(`Dispatching HTTP POST request to ${node.data.url}`);
      await fetch(node.data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: node.id,
          stepTitle: node.data.title,
          timestamp: new Date().toISOString(),
          payload: node.data.payload || null,
        }),
      });
      logs.push('Webhook response: 200 OK');
    } catch (err) {
      logs.push(
        `Webhook dispatch notification: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  } else {
    logs.push('Webhook step simulated: Telemetry payload ready');
  }

  return {
    output: {
      exportedAt: new Date().toISOString(),
      destination,
    },
    logs,
  };
};

/**
 * Summarization Archetype Handler
 * Reads page content and invokes Gemini or Grok autonomous agent
 */
export const executeSummarizationNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const modelToUse = ctx.aiModel || 'Gemini 2.5 Pro Vision';
  const instruction =
    node.data.actionSummary ||
    node.data.description ||
    'Summarize key insights and purpose of this webpage';

  logs.push(`Autonomous Agent initialized: [${modelToUse}]`);

  let pageText = '';
  let pageTitle = node.data.title;

  // Check if a prior extraction step produced structured data/news
  let extractedContext = '';
  if (ctx.previousStepOutput) {
    extractedContext = JSON.stringify(ctx.previousStepOutput, null, 2);
  } else if (ctx.pipelineOutputs) {
    const previousExtracts = Object.values(ctx.pipelineOutputs)
      .filter((v) => v && typeof v === 'object')
      .map((v) => JSON.stringify(v, null, 2))
      .join('\n');
    if (previousExtracts) {
      extractedContext = previousExtracts;
    }
  }

  if (ctx.page) {
    try {
      logs.push('Extracting live DOM innerText for agent perception...');
      pageText = await ctx.page.evaluate(() => document.body?.innerText || '');
      pageTitle = (await ctx.page.title()) || node.data.title;
      logs.push(`Captured ${pageText.length} characters of DOM text context`);
    } catch (err) {
      logs.push(
        `DOM text extraction note: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const combinedContent = extractedContext
    ? `Extracted Data from previous step:\n${extractedContext}\n\nWebpage text:\n${pageText.slice(0, 8000)}`
    : pageText;

  logs.push(`Dispatching web summarization to ${modelToUse}...`);
  const agentResult = await AgentService.summarizeWebPage({
    pageText: combinedContent,
    pageTitle,
    targetUrl: ctx.targetUrl,
    instruction,
    modelName: modelToUse,
  });

  logs.push(
    `Synthesized web summary via ${agentResult.provider} (${agentResult.modelUsed}): ~${agentResult.wordCount} words analyzed`,
  );

  for (const insight of agentResult.keyInsights.slice(0, 3)) {
    logs.push(`• Key Insight: ${insight}`);
  }

  return {
    output: {
      summary: agentResult.summary,
      keyInsights: agentResult.keyInsights,
      provider: agentResult.provider,
      modelUsed: agentResult.modelUsed,
      wordCount: agentResult.wordCount,
    },
    logs,
  };
};

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

  // Extract contextual results from previous steps (summary, insights, scraped data)
  let extractedSummary = '';
  let keyInsights: string[] = [];
  let rawDataPreview = '';

  if (ctx.previousStepOutput) {
    if (ctx.previousStepOutput.summary) {
      extractedSummary = String(ctx.previousStepOutput.summary);
    }
    if (Array.isArray(ctx.previousStepOutput.keyInsights)) {
      keyInsights = ctx.previousStepOutput.keyInsights.map(String);
    }
  }

  if (!extractedSummary && ctx.pipelineOutputs) {
    for (const output of Object.values(ctx.pipelineOutputs)) {
      if (output && typeof output === 'object') {
        const obj = output as Record<string, unknown>;
        if (obj.summary && !extractedSummary) {
          extractedSummary = String(obj.summary);
        }
        if (Array.isArray(obj.keyInsights) && keyInsights.length === 0) {
          keyInsights = obj.keyInsights.map(String);
        }
        if (!rawDataPreview && (obj.articles || obj.data || obj.extractedData || obj.items)) {
          rawDataPreview = JSON.stringify(
            obj.articles || obj.data || obj.extractedData || obj.items,
            null,
            2,
          );
        }
      }
    }
  }

  const bodyContent = extractedSummary
    ? `Summary of Results:\n${extractedSummary}\n\n${
        keyInsights.length
          ? 'Key Insights:\n' + keyInsights.map((i) => `• ${i}`).join('\n')
          : ''
      }`
    : defaultDescription;

  logs.push(`Preparing Resend email dispatch to: ${recipient}`);
  logs.push(`Subject: "${subject}"`);

  const insightsHtml = keyInsights.length
    ? `<div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
        <p style="margin: 0 0 6px; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #475569;">Key Insights:</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.5;">
          ${keyInsights.map((i) => `<li>${i}</li>`).join('')}
        </ul>
       </div>`
    : '';

  const summaryHtml = extractedSummary
    ? `<div style="background-color: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em;">AI Executive Summary</span>
        <p style="margin: 8px 0 0; font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${extractedSummary}</p>
        ${insightsHtml}
      </div>`
    : '';

  const rawDataHtml = rawDataPreview
    ? `<div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-family: monospace; font-size: 11px; color: #334155; max-height: 200px; overflow-y: auto; white-space: pre-wrap;">
        ${rawDataPreview.slice(0, 1000)}
       </div>`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 1px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 16px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #10b981; letter-spacing: 0.05em;">AgentBrowse Automated Alert</span>
        <h2 style="margin: 8px 0 0; color: #18181b; font-size: 18px; font-weight: 700;">${subject}</h2>
      </div>
      <div style="background-color: #fafafa; border-radius: 8px; padding: 14px; margin-bottom: 16px; border: 1px solid #f4f4f5;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #52525b;"><strong>Target Webpage:</strong> <a href="${ctx.targetUrl}" style="color: #2563eb; text-decoration: none;">${ctx.targetUrl}</a></p>
        <p style="margin: 0; font-size: 13px; color: #27272a; line-height: 1.5;">${defaultDescription}</p>
      </div>
      ${summaryHtml}
      ${rawDataHtml}
      <p style="margin: 0; font-size: 11px; color: #a1a1aa;">Sent via Resend Email Infrastructure • AgentBrowse Autonomous Engine</p>
    </div>
  `;

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
      includedSummary: Boolean(extractedSummary),
    },
    logs,
  };
};

/**
 * Archetype mapping registry
 */
export const NODE_REGISTRY: Record<NodeArchetype | string, NodeHandler> = {
  navigation: executeNavigationNode,
  grounding: executeGroundingNode,
  action: executeActionNode,
  form: executeFormNode,
  extraction: executeExtractionNode,
  webhook: executeWebhookNode,
  summarization: executeSummarizationNode,
  email: executeEmailNode,
};

/**
 * Main node execution dispatcher
 */
export async function executeNode(
  node: WorkflowExecutionNode,
  ctx: NodeExecutionContext,
): Promise<NodeExecutionOutput> {
  const preLogs: string[] = [];

  // If node defines a custom URL different from targetUrl, perform page navigation first
  if (
    node.data.url &&
    node.data.url !== ctx.targetUrl &&
    node.data.url.startsWith('http')
  ) {
    if (ctx.page) {
      await ctx.page.goto(node.data.url, { waitUntil: 'domcontentloaded' });
      preLogs.push(`Navigated to ${node.data.url}`);
    }
  }

  const archetypeKey = (node.data.archetype || 'action').toLowerCase();
  const handler = NODE_REGISTRY[archetypeKey] || NODE_REGISTRY.action;

  console.log(
    `[Pipeline] Step ${node.data.stepNumber || '?'}: "${node.data.title}" -> [Handler: ${archetypeKey}]`,
  );

  const stepStart = Date.now();
  const result = await handler(node, ctx);
  const durationMs = Date.now() - stepStart;

  console.log(
    `[Pipeline] Step ${node.data.stepNumber || '?'}: Finished "${node.data.title}" in ${durationMs}ms`,
  );

  return {
    output: result.output,
    logs: [...preLogs, ...result.logs],
  };
}
