import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NODE_TEMPLATES } from "@/components/workflow/flow/nodes/nodeTemplates";
import type { NodeTemplate, NodeArchetype } from "@/components/workflow/flow/types";

export interface CreateNodeTemplateInput {
  title: string;
  category: string;
  badge: string;
  archetype?: string;
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
  description?: string;
  actionSummary?: string;
  isPremium?: boolean;
  defaultMetrics?: { label: string; value: string }[];
  defaultLogs?: string[];
}

export class NodeTemplateService {
  /**
   * List all node templates. Auto-seeds default archetypes if table is empty.
   */
  static async list(): Promise<NodeTemplate[]> {
    let templates = await prisma.nodeTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Auto-seed default templates with Free vs Premium designations if empty
    if (templates.length === 0) {
      for (const tpl of NODE_TEMPLATES) {
        // Mark Form Submission & Extraction as Premium by default
        const isPremium =
          tpl.archetype === "form" || tpl.archetype === "extraction" || tpl.badge === "Perception";

        await prisma.nodeTemplate.create({
          data: {
            title: tpl.title,
            category: tpl.category,
            badge: tpl.badge,
            archetype: tpl.archetype,
            description: tpl.description,
            actionSummary: tpl.actionSummary,
            isPremium,
            defaultMetrics: tpl.defaultMetrics as unknown as Prisma.InputJsonValue,
            defaultLogs: tpl.defaultLogs as unknown as Prisma.InputJsonValue,
          },
        });
      }

      templates = await prisma.nodeTemplate.findMany({
        orderBy: { createdAt: "asc" },
      });
    }

    return templates.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      badge: t.badge,
      archetype: t.archetype as NodeArchetype,
      description: t.description,
      actionSummary: t.actionSummary,
      isPremium: t.isPremium,
      defaultMetrics: (t.defaultMetrics as unknown as { label: string; value: string }[]) || [],
      defaultLogs: (t.defaultLogs as unknown as string[]) || [],
    }));
  }

  /**
   * Create a new node template (Admin only)
   */
  static async create(input: CreateNodeTemplateInput): Promise<NodeTemplate> {
    const created = await prisma.nodeTemplate.create({
      data: {
        title: input.title.trim(),
        category: input.category.trim() || "Custom Action",
        badge: input.badge.trim() || "Step",
        archetype: input.archetype || "action",
        description: input.description.trim(),
        actionSummary: input.actionSummary.trim(),
        isPremium: input.isPremium ?? false,
        defaultMetrics: (input.defaultMetrics || [
          { label: "Status", value: "Ready" },
        ]) as unknown as Prisma.InputJsonValue,
        defaultLogs: (input.defaultLogs || [
          "Initialized step execution",
        ]) as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      id: created.id,
      title: created.title,
      category: created.category,
      badge: created.badge,
      archetype: created.archetype as NodeArchetype,
      description: created.description,
      actionSummary: created.actionSummary,
      isPremium: created.isPremium,
      defaultMetrics: (created.defaultMetrics as unknown as { label: string; value: string }[]) || [],
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
    if (input.defaultMetrics !== undefined)
      data.defaultMetrics = input.defaultMetrics as unknown as Prisma.InputJsonValue;
    if (input.defaultLogs !== undefined)
      data.defaultLogs = input.defaultLogs as unknown as Prisma.InputJsonValue;

    const updated = await prisma.nodeTemplate.update({
      where: { id },
      data,
    });

    return {
      id: updated.id,
      title: updated.title,
      category: updated.category,
      badge: updated.badge,
      archetype: updated.archetype as NodeArchetype,
      description: updated.description,
      actionSummary: updated.actionSummary,
      isPremium: updated.isPremium,
      defaultMetrics: (updated.defaultMetrics as unknown as { label: string; value: string }[]) || [],
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
