import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { NodeTemplate, NodeArchetype, EmailProviderType } from "@/components/workflow/flow/types";

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

export class NodeTemplateService {
  /**
   * List all node templates from the database
   */
  static async list(): Promise<NodeTemplate[]> {
    let templates = await prisma.nodeTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Ensure pre-built Categorized News Summarizer is available in catalog
    const hasNewsSummary = templates.some((t) => t.archetype === "news_summary");
    if (!hasNewsSummary) {
      try {
        const newsSummaryTpl = await prisma.nodeTemplate.create({
          data: {
            title: "Categorized News Summarizer",
            category: "AI Intelligence",
            badge: "AI Agent",
            archetype: "news_summary",
            description:
              "Consumes gathered news stories and synthesizes structured [heading, subheading, text] briefings via Gemini.",
            actionSummary:
              "Categorize and summarize news for: war, sports, crime, ai, politics",
            isPremium: false,
            defaultMetrics: [
              { label: "Format", value: "Heading/Deck/Text" },
              { label: "Topics", value: "5 Categories" },
            ],
            defaultLogs: [
              "Initialized News Intelligence Agent",
              "Synthesized structured briefing",
            ],
          },
        });
        templates.push(newsSummaryTpl);
      } catch {
        // Continue gracefully if concurrent creation happened
      }
    }

    // Ensure pre-built Browser News Collector is available in catalog
    const hasNewsGather = templates.some((t) => t.archetype === "news_gather");
    if (!hasNewsGather) {
      try {
        const newsGatherTpl = await prisma.nodeTemplate.create({
          data: {
            title: "News Category Extractor",
            category: "Data Extraction",
            badge: "Search & Fetch",
            archetype: "news_gather",
            description:
              "Extracts the top 5 stories from each of 7 supported news categories using Browserbase Web Search API and Fetch API JSON schema.",
            actionSummary:
              "Extract the top 5 stories per category across 7 supported categories via Browserbase Search & Fetch API",
            isPremium: false,
            defaultMetrics: [
              { label: "Engine", value: "Search + Fetch" },
              { label: "Format", value: "JSON Schema" },
            ],
            defaultLogs: [
              "News Harvester initialized",
              "Querying Browserbase Search API",
              "Extracted structured JSON article bodies",
            ],
          },
        });
        templates.push(newsGatherTpl);
      } catch {
        // Continue gracefully if concurrent creation happened
      }
    }

    // Ensure pre-built Open URL node is available in catalog
    const hasOpenUrl = templates.some((t) => t.archetype === "open_url");
    if (!hasOpenUrl) {
      try {
        const openUrlTpl = await prisma.nodeTemplate.create({
          data: {
            title: "Open URL",
            category: "Browser Navigation",
            badge: "Launch",
            archetype: "open_url",
            description:
              "Navigates headless browser session to target URL and initializes CDP session page context.",
            actionSummary:
              "Navigate browser session to target URL and wait for page load",
            isPremium: false,
            defaultMetrics: [
              { label: "Status", value: "200 OK" },
              { label: "Protocol", value: "HTTPS" },
            ],
            defaultLogs: [
              "Initialized browser page session",
              "Navigating to specified target URL",
            ],
          },
        });
        templates.push(openUrlTpl);
      } catch {
        // Continue gracefully if concurrent creation happened
      }
    }

    // Ensure pre-built Resend Email node is available in catalog
    const hasResendEmail = templates.some(
      (t) => t.archetype === "email" && !t.title.toLowerCase().includes("nodemailer"),
    );
    if (!hasResendEmail) {
      try {
        const resendEmailTpl = await prisma.nodeTemplate.create({
          data: {
            title: "Email Notification (Resend)",
            category: "Notification & Alert",
            badge: "Resend API",
            archetype: "email",
            description:
              "Dispatches formatted executive briefing or workflow execution alerts via Resend Transactional Email API.",
            actionSummary:
              "Dispatch email notification using Resend cloud transactional email engine",
            isPremium: false,
            defaultMetrics: [
              { label: "Provider", value: "Resend API" },
              { label: "Protocol", value: "HTTPS API" },
            ],
            defaultLogs: [
              "Initialized Resend transactional dispatcher",
              "Compiled executive email briefing",
            ],
          },
        });
        templates.push(resendEmailTpl);
      } catch {
        // Continue gracefully if concurrent creation happened
      }
    }

    // Ensure pre-built Nodemailer SMTP Email node is available in catalog
    const hasNodemailerEmail = templates.some(
      (t) =>
        t.archetype === "email" &&
        (t.title.toLowerCase().includes("nodemailer") ||
          t.title.toLowerCase().includes("smtp")),
    );
    if (!hasNodemailerEmail) {
      try {
        const nodemailerEmailTpl = await prisma.nodeTemplate.create({
          data: {
            title: "Email Notification (Nodemailer SMTP)",
            category: "Notification & Alert",
            badge: "SMTP Mail",
            archetype: "email",
            description:
              "Dispatches formatted executive briefing or workflow alerts via custom Nodemailer SMTP transport.",
            actionSummary:
              "Dispatch email notification using Nodemailer SMTP server transport",
            isPremium: false,
            defaultMetrics: [
              { label: "Provider", value: "Nodemailer (SMTP)" },
              { label: "Protocol", value: "SMTP" },
            ],
            defaultLogs: [
              "Initialized Nodemailer SMTP mail dispatcher",
              "Compiled executive email briefing",
            ],
          },
        });
        templates.push(nodemailerEmailTpl);
      } catch {
        // Continue gracefully if concurrent creation happened
      }
    }

    // Ensure pre-built Authentication & Sign-in node is available in catalog
    const hasAuthNode = templates.some(
      (t) => t.archetype === "authentication" || t.archetype === "auth",
    );
    if (!hasAuthNode) {
      try {
        const authTpl = await prisma.nodeTemplate.create({
          data: {
            title: "Account Authentication",
            category: "Authentication",
            badge: "Auth & Sign In",
            archetype: "authentication",
            description:
              "Automates browser authentication by filling credentials (email/username and password) and clicking sign in via Stagehand act.",
            actionSummary:
              "Fill email and password credentials, then click the Log In or Sign In button (exclude login with OTP and sign in with OTP)",
            isPremium: false,
            defaultMetrics: [
              { label: "Action", value: "Stagehand Act" },
              { label: "Security", value: "Masked" },
            ],
            defaultLogs: [
              "Initialized Authentication step",
              "Injected credentials via Stagehand act",
              "Submitted sign in and verified destination page",
            ],
          },
        });
        templates.push(authTpl);
      } catch {
        // Continue gracefully if concurrent creation happened
      }
    }

    return templates.map((t) => {
      const rawMetrics =
        (t.defaultMetrics as unknown as { label: string; value: string }[]) || [];
      const providerMetric = rawMetrics.find(
        (m) => m.label?.toLowerCase() === "provider",
      )?.value;
      const emailProvider: EmailProviderType | undefined =
        t.archetype === "email"
          ? providerMetric?.toLowerCase().includes("nodemailer") ||
            providerMetric?.toLowerCase().includes("smtp")
            ? "nodemailer"
            : "resend"
          : undefined;

      return {
        id: t.id,
        title: t.title,
        category: t.category,
        badge: t.badge,
        archetype: t.archetype as NodeArchetype,
        description: t.description,
        actionSummary: t.actionSummary,
        isPremium: t.isPremium,
        emailProvider,
        defaultMetrics: rawMetrics,
        defaultLogs: (t.defaultLogs as unknown as string[]) || [],
      };
    });
  }

  /**
   * Create a new node template (Admin only)
   */
  static async create(input: CreateNodeTemplateInput): Promise<NodeTemplate> {
    const defaultMetrics = input.defaultMetrics || [
      { label: "Status", value: "Ready" },
    ];

    if (input.archetype === "email") {
      const selectedProvider = input.emailProvider || "resend";
      const existingProviderIdx = defaultMetrics.findIndex(
        (m) => m.label.toLowerCase() === "provider",
      );
      const providerLabel =
        selectedProvider === "nodemailer" ? "Nodemailer (SMTP)" : "Resend API";
      if (existingProviderIdx >= 0) {
        defaultMetrics[existingProviderIdx].value = providerLabel;
      } else {
        defaultMetrics.unshift({ label: "Provider", value: providerLabel });
      }
    }

    const created = await prisma.nodeTemplate.create({
      data: {
        title: input.title.trim(),
        category: input.category.trim() || "Custom Action",
        badge: input.badge.trim() || "Step",
        archetype: input.archetype || "action",
        description: input.description.trim(),
        actionSummary: input.actionSummary.trim(),
        isPremium: input.isPremium ?? false,
        defaultMetrics: defaultMetrics as unknown as Prisma.InputJsonValue,
        defaultLogs: (input.defaultLogs || [
          "Initialized step execution",
        ]) as unknown as Prisma.InputJsonValue,
      },
    });

    const rawMetrics =
      (created.defaultMetrics as unknown as { label: string; value: string }[]) || [];
    const providerMetric = rawMetrics.find(
      (m) => m.label?.toLowerCase() === "provider",
    )?.value;
    const emailProvider =
      created.archetype === "email"
        ? providerMetric?.toLowerCase().includes("nodemailer") ||
          providerMetric?.toLowerCase().includes("smtp")
          ? "nodemailer"
          : "resend"
        : undefined;

    return {
      id: created.id,
      title: created.title,
      category: created.category,
      badge: created.badge,
      archetype: created.archetype as NodeArchetype,
      description: created.description,
      actionSummary: created.actionSummary,
      isPremium: created.isPremium,
      emailProvider,
      defaultMetrics: rawMetrics,
      defaultLogs: (created.defaultLogs as unknown as string[]) || [],
    };
  }

  /**
   * Update an existing node template (Admin only)
   */
  static async update(id: string, input: UpdateNodeTemplateInput): Promise<NodeTemplate> {
    const data: Prisma.NodeTemplateUpdateInput = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.category !== undefined) data.category = input.category.trim();
    if (input.badge !== undefined) data.badge = input.badge.trim();
    if (input.archetype !== undefined) data.archetype = input.archetype;
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.actionSummary !== undefined) data.actionSummary = input.actionSummary.trim();
    if (input.isPremium !== undefined) data.isPremium = input.isPremium;

    if (input.defaultMetrics !== undefined) {
      const metrics = [...input.defaultMetrics];
      if (input.archetype === "email" && input.emailProvider) {
        const existingProviderIdx = metrics.findIndex(
          (m) => m.label.toLowerCase() === "provider",
        );
        const providerLabel =
          input.emailProvider === "nodemailer" ? "Nodemailer (SMTP)" : "Resend API";
        if (existingProviderIdx >= 0) {
          metrics[existingProviderIdx].value = providerLabel;
        } else {
          metrics.unshift({ label: "Provider", value: providerLabel });
        }
      }
      data.defaultMetrics = metrics as unknown as Prisma.InputJsonValue;
    }
    if (input.defaultLogs !== undefined)
      data.defaultLogs = input.defaultLogs as unknown as Prisma.InputJsonValue;

    const updated = await prisma.nodeTemplate.update({
      where: { id },
      data,
    });

    const rawMetrics =
      (updated.defaultMetrics as unknown as { label: string; value: string }[]) || [];
    const providerMetric = rawMetrics.find(
      (m) => m.label?.toLowerCase() === "provider",
    )?.value;
    const emailProvider =
      updated.archetype === "email"
        ? providerMetric?.toLowerCase().includes("nodemailer") ||
          providerMetric?.toLowerCase().includes("smtp")
          ? "nodemailer"
          : "resend"
        : undefined;

    return {
      id: updated.id,
      title: updated.title,
      category: updated.category,
      badge: updated.badge,
      archetype: updated.archetype as NodeArchetype,
      description: updated.description,
      actionSummary: updated.actionSummary,
      isPremium: updated.isPremium,
      emailProvider,
      defaultMetrics: rawMetrics,
      defaultLogs: (updated.defaultLogs as unknown as string[]) || [],
    };
  }

  /**
   * Delete a node template (Admin only)
   */
  static async delete(id: string) {
    await prisma.nodeTemplate.delete({
      where: { id },
    });
    return { success: true, id };
  }
}
