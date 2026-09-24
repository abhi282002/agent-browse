import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type {
  NodeTemplate,
  NodeArchetype,
  EmailProviderType,
} from '@/components/workflow/flow/types';

export interface CreateNodeTemplateInput {
  title: string;
  category: string;
  badge: string;
  archetype?: string;
  emailProvider?: EmailProviderType;
  description: string;
  actionSummary: string;
  isPremium?: boolean;
  defaultMetrics?: { label: string; value: string }[];
  defaultLogs?: string[];
}

export interface UpdateNodeTemplateInput {
  title?: string;
  category?: string;
  badge?: string;
  archetype?: string;
  emailProvider?: EmailProviderType;
  description?: string;
  actionSummary?: string;
  isPremium?: boolean;
  defaultMetrics?: { label: string; value: string }[];
  defaultLogs?: string[];
}

type NodeTemplateRecord = Prisma.NodeTemplateGetPayload<Record<string, never>>;

interface SeedTemplateDefinition {
  title: string;
  category: string;
  badge: string;
  archetype: string;
  description: string;
  actionSummary: string;
  isPremium: boolean;
  defaultMetrics: Array<{ label: string; value: string }>;
  defaultLogs: string[];
  matches: (t: { archetype: string; title: string }) => boolean;
}

const DEFAULT_TEMPLATES: SeedTemplateDefinition[] = [
  {
    title: 'Categorized News Summarizer',
    category: 'AI Intelligence',
    badge: 'AI Agent',
    archetype: 'news_summary',
    description:
      'Consumes gathered news stories and synthesizes structured [heading, subheading, text] briefings via Gemini.',
    actionSummary:
      'Categorize and summarize news for: war, sports, crime, ai, politics',
    isPremium: false,
    defaultMetrics: [
      { label: 'Format', value: 'Heading/Deck/Text' },
      { label: 'Topics', value: '5 Categories' },
    ],
    defaultLogs: [
      'Initialized News Intelligence Agent',
      'Synthesized structured briefing',
    ],
    matches: (t) => t.archetype === 'news_summary',
  },
  {
    title: 'News Category Extractor',
    category: 'Data Extraction',
    badge: 'Search & Fetch',
    archetype: 'news_gather',
    description:
      'Extracts the top 5 stories from each of 7 supported news categories using Browserbase Web Search API and Fetch API JSON schema.',
    actionSummary:
      'Extract the top 5 stories per category across 7 supported categories via Browserbase Search & Fetch API',
    isPremium: false,
    defaultMetrics: [
      { label: 'Engine', value: 'Search + Fetch' },
      { label: 'Format', value: 'JSON Schema' },
    ],
    defaultLogs: [
      'News Harvester initialized',
      'Querying Browserbase Search API',
      'Extracted structured JSON article bodies',
    ],
    matches: (t) => t.archetype === 'news_gather',
  },
  {
    title: 'Open URL',
    category: 'Browser Navigation',
    badge: 'Launch',
    archetype: 'open_url',
    description:
      'Navigates headless browser session to target URL and initializes CDP session page context.',
    actionSummary:
      'Navigate browser session to target URL and wait for page load',
    isPremium: false,
    defaultMetrics: [
      { label: 'Status', value: '200 OK' },
      { label: 'Protocol', value: 'HTTPS' },
    ],
    defaultLogs: [
      'Initialized browser page session',
      'Navigating to specified target URL',
    ],
    matches: (t) => t.archetype === 'open_url',
  },
  {
    title: 'Email Notification (Resend)',
    category: 'Notification & Alert',
    badge: 'Resend API',
    archetype: 'email',
    description:
      'Dispatches formatted executive briefing or workflow execution alerts via Resend Transactional Email API.',
    actionSummary:
      'Dispatch email notification using Resend cloud transactional email engine',
    isPremium: false,
    defaultMetrics: [
      { label: 'Provider', value: 'Resend API' },
      { label: 'Protocol', value: 'HTTPS API' },
    ],
    defaultLogs: [
      'Initialized Resend transactional dispatcher',
      'Compiled executive email briefing',
    ],
    matches: (t) =>
      t.archetype === 'email' && !t.title.toLowerCase().includes('nodemailer'),
  },
  {
    title: 'Email Notification (Nodemailer SMTP)',
    category: 'Notification & Alert',
    badge: 'SMTP Mail',
    archetype: 'email',
    description:
      'Dispatches formatted executive briefing or workflow alerts via custom Nodemailer SMTP transport.',
    actionSummary:
      'Dispatch email notification using Nodemailer SMTP server transport',
    isPremium: false,
    defaultMetrics: [
      { label: 'Provider', value: 'Nodemailer (SMTP)' },
      { label: 'Protocol', value: 'SMTP' },
    ],
    defaultLogs: [
      'Initialized Nodemailer SMTP mail dispatcher',
      'Compiled executive email briefing',
    ],
    matches: (t) =>
      t.archetype === 'email' &&
      (t.title.toLowerCase().includes('nodemailer') ||
        t.title.toLowerCase().includes('smtp')),
  },
  {
    title: 'Account Authentication',
    category: 'Authentication',
    badge: 'Auth & Sign In',
    archetype: 'authentication',
    description:
      'Automates browser authentication by filling credentials (email/username and password) and clicking sign in via Stagehand act.',
    actionSummary:
      'Fill email and password credentials, then click the Log In or Sign In button (exclude login with OTP and sign in with OTP)',
    isPremium: false,
    defaultMetrics: [
      { label: 'Action', value: 'Stagehand Act' },
      { label: 'Security', value: 'Masked' },
    ],
    defaultLogs: [
      'Initialized Authentication step',
      'Injected credentials via Stagehand act',
      'Submitted sign in and verified destination page',
    ],
    matches: (t) => t.archetype === 'authentication' || t.archetype === 'auth',
  },
  {
    title: 'Fill Form',
    category: 'Form Automation',
    badge: 'Form Fill',
    archetype: 'fill_form',
    description:
      'Fills text fields, selects, checkboxes, and other form controls, then submits the form using the active browser page.',
    actionSummary:
      'Fill the form fields with the provided values and submit the form, excluding password and OTP fields',
    isPremium: false,
    defaultMetrics: [
      { label: 'Action', value: 'Stagehand Act' },
      { label: 'Controls', value: 'Text, Select, Checkbox' },
    ],
    defaultLogs: [
      'Initialized form fill step',
      'Filled detected form controls',
      'Submitted form and verified page state',
    ],
    matches: (t) => t.archetype === 'fill_form',
  },
];

function normalizeMetricsWithProvider(
  metrics: Array<{ label: string; value: string }>,
  archetype?: string,
  emailProvider?: EmailProviderType,
): Array<{ label: string; value: string }> {
  const result = [...metrics];
  if (archetype === 'email') {
    const selectedProvider = emailProvider || 'resend';
    const providerLabel =
      selectedProvider === 'nodemailer' ? 'Nodemailer (SMTP)' : 'Resend API';
    const existingIdx = result.findIndex(
      (m) => m.label.toLowerCase() === 'provider',
    );
    if (existingIdx >= 0) {
      result[existingIdx].value = providerLabel;
    } else {
      result.unshift({ label: 'Provider', value: providerLabel });
    }
  }
  return result;
}

function toNodeTemplate(record: {
  id: string;
  title: string;
  category: string;
  badge: string;
  archetype: string;
  description: string;
  actionSummary: string;
  isPremium: boolean;
  defaultMetrics: unknown;
  defaultLogs: unknown;
}): NodeTemplate {
  const rawMetrics = Array.isArray(record.defaultMetrics)
    ? (record.defaultMetrics as Array<{ label: string; value: string }>)
    : [];

  const providerMetric = rawMetrics.find(
    (m) => m.label?.toLowerCase() === 'provider',
  )?.value;

  const emailProvider: EmailProviderType | undefined =
    record.archetype === 'email'
      ? providerMetric?.toLowerCase().includes('nodemailer') ||
        providerMetric?.toLowerCase().includes('smtp')
        ? 'nodemailer'
        : 'resend'
      : undefined;

  return {
    id: record.id,
    title: record.title,
    category: record.category,
    badge: record.badge,
    archetype: record.archetype as NodeArchetype,
    description: record.description,
    actionSummary: record.actionSummary,
    isPremium: record.isPremium,
    emailProvider,
    defaultMetrics: rawMetrics,
    defaultLogs: Array.isArray(record.defaultLogs)
      ? (record.defaultLogs as string[])
      : [],
  };
}

async function syncDefaultTemplates(
  existingTemplates: NodeTemplateRecord[],
): Promise<NodeTemplateRecord[]> {
  const templates = [...existingTemplates];

  for (const def of DEFAULT_TEMPLATES) {
    const exists = templates.some((t) => def.matches(t));
    if (!exists) {
      try {
        const created = await prisma.nodeTemplate.create({
          data: {
            title: def.title,
            category: def.category,
            badge: def.badge,
            archetype: def.archetype,
            description: def.description,
            actionSummary: def.actionSummary,
            isPremium: def.isPremium,
            defaultMetrics: def.defaultMetrics as unknown as Prisma.InputJsonValue,
            defaultLogs: def.defaultLogs as unknown as Prisma.InputJsonValue,
          },
        });
        templates.push(created);
      } catch {
        // Handled silently if concurrent creation occurs
      }
    }
  }

  return templates;
}

export class NodeTemplateService {
  static async list(): Promise<NodeTemplate[]> {
    const records = await prisma.nodeTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const synced = await syncDefaultTemplates(records);
    return synced.map(toNodeTemplate);
  }

  static async create(input: CreateNodeTemplateInput): Promise<NodeTemplate> {
    const baseMetrics = input.defaultMetrics || [
      { label: 'Status', value: 'Ready' },
    ];
    const defaultMetrics = normalizeMetricsWithProvider(
      baseMetrics,
      input.archetype,
      input.emailProvider,
    );

    const created = await prisma.nodeTemplate.create({
      data: {
        title: input.title.trim(),
        category: input.category.trim() || 'Custom Action',
        badge: input.badge.trim() || 'Step',
        archetype: input.archetype || 'action',
        description: input.description.trim(),
        actionSummary: input.actionSummary.trim(),
        isPremium: input.isPremium ?? false,
        defaultMetrics: defaultMetrics as unknown as Prisma.InputJsonValue,
        defaultLogs: (input.defaultLogs || [
          'Initialized step execution',
        ]) as unknown as Prisma.InputJsonValue,
      },
    });

    return toNodeTemplate(created);
  }

  static async update(
    id: string,
    input: UpdateNodeTemplateInput,
  ): Promise<NodeTemplate> {
    const data: Prisma.NodeTemplateUpdateInput = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.category !== undefined) data.category = input.category.trim();
    if (input.badge !== undefined) data.badge = input.badge.trim();
    if (input.archetype !== undefined) data.archetype = input.archetype;
    if (input.description !== undefined)
      data.description = input.description.trim();
    if (input.actionSummary !== undefined)
      data.actionSummary = input.actionSummary.trim();
    if (input.isPremium !== undefined) data.isPremium = input.isPremium;

    if (input.defaultMetrics !== undefined) {
      const defaultMetrics = normalizeMetricsWithProvider(
        input.defaultMetrics,
        input.archetype,
        input.emailProvider,
      );
      data.defaultMetrics = defaultMetrics as unknown as Prisma.InputJsonValue;
    }

    if (input.defaultLogs !== undefined) {
      data.defaultLogs = input.defaultLogs as unknown as Prisma.InputJsonValue;
    }

    const updated = await prisma.nodeTemplate.update({
      where: { id },
      data,
    });

    return toNodeTemplate(updated);
  }

  static async delete(id: string) {
    await prisma.nodeTemplate.delete({
      where: { id },
    });
    return { success: true, id };
  }
}
