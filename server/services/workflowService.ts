import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { Edge } from "@xyflow/react";
import type { WorkflowNodeType } from "@/components/workflow/flow/types";
import { DEFAULT_WORKFLOW_SEEDS } from "./workflowSeedData";

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  category: string;
  targetUrl?: string;
  aiModel?: string;
  sandboxEnv?: string;
  nodes: unknown[];
  edges: unknown[];
  status?: string;
  organizationId?: string;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  category?: string;
  targetUrl?: string;
  status?: string;
  aiModel?: string;
  sandboxEnv?: string;
  nodes?: unknown[];
  edges?: unknown[];
  organizationId?: string;
}

export class WorkflowService {
  /**
   * List workflows scoped by organization or user. Automatically seeds default blueprints if the database is empty.
   */
  static async list(userId?: string, organizationId?: string) {
    // If organization is specified, get workflows in this organization or global templates
    const whereClause: Prisma.WorkflowWhereInput = organizationId
      ? {
          OR: [{ organizationId }, { organizationId: null, userId: null }],
        }
      : userId
      ? {
          OR: [{ userId }, { userId: null }],
        }
      : {};

    let workflows = await prisma.workflow.findMany({
      where: whereClause,
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Auto-seed default workflows if none exist yet
    if (workflows.length === 0) {
      for (const defaultSeed of DEFAULT_WORKFLOW_SEEDS) {
        await prisma.workflow.create({
          data: {
            id: defaultSeed.id,
            name: defaultSeed.name,
            description: defaultSeed.description,
            category: defaultSeed.category,
            targetUrl: defaultSeed.targetUrl || "",
            status: defaultSeed.status,
            aiModel: "Gemini 2.5 Pro Vision",
            sandboxEnv: "Chromium 128 (CDP Protocol)",
            nodes: defaultSeed.nodes as unknown as Prisma.InputJsonValue,
            edges: defaultSeed.edges as unknown as Prisma.InputJsonValue,
            userId: userId || null,
            organizationId: organizationId || null,
          },
        });
      }

      workflows = await prisma.workflow.findMany({
        where: whereClause,
        include: {
          organization: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || "",
      category: workflow.category,
      targetUrl: workflow.targetUrl,
      status: (workflow.status as "idle" | "running" | "completed" | "paused") || "idle",
      aiModel: workflow.aiModel || "Gemini 2.5 Pro Vision",
      sandboxEnv: workflow.sandboxEnv || "Chromium 128 (CDP Protocol)",
      createdAt: workflow.createdAt.toISOString(),
      nodes: workflow.nodes as unknown as WorkflowNodeType[],
      edges: workflow.edges as unknown as Edge[],
      organizationId: workflow.organizationId || undefined,
      organizationName: workflow.organization?.name || undefined,
    }));
  }

  /**
   * Retrieve a workflow by ID
   */
  static async getById(id: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true,aiInstructions: true, defaultAiModel: true },
        },
      },
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || "",
      category: workflow.category,
      targetUrl: workflow.targetUrl,
      status: (workflow.status as "idle" | "running" | "completed" | "paused") || "idle",
      aiModel: workflow.aiModel || "Gemini 2.5 Pro Vision",
      sandboxEnv: workflow.sandboxEnv || "Chromium 128 (CDP Protocol)",
      createdAt: workflow.createdAt.toISOString(),
      nodes: workflow.nodes as unknown as WorkflowNodeType[],
      edges: workflow.edges as unknown as Edge[],
      organizationId: workflow.organizationId || undefined,
      organizationName: workflow.organization?.name || undefined,
      organization: workflow.organization
        ? {
            id: workflow.organization.id,
            name: workflow.organization.name,
            aiInstructions: workflow.organization.aiInstructions || undefined,
            defaultAiModel: workflow.organization.defaultAiModel || undefined,
          }
        : undefined,
    };
  }

  /**
   * Create a new workflow in database under an organization
   */
  static async create(
    input: CreateWorkflowInput,
    userId?: string,
    organizationId?: string
  ) {
    const orgId = organizationId || input.organizationId || null;

    const createdWorkflow = await prisma.workflow.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || "",
        category: input.category.trim() || "Custom Automation",
        targetUrl: (input.targetUrl || "").trim(),
        status: input.status || "idle",
        aiModel: input.aiModel || "Gemini 2.5 Pro Vision",
        sandboxEnv: input.sandboxEnv || "Chromium 128 (CDP Protocol)",
        nodes: input.nodes as unknown as Prisma.InputJsonValue,
        edges: input.edges as unknown as Prisma.InputJsonValue,
        userId: userId || null,
        organizationId: orgId,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      id: createdWorkflow.id,
      name: createdWorkflow.name,
      description: createdWorkflow.description || "",
      category: createdWorkflow.category,
      targetUrl: createdWorkflow.targetUrl,
      status: (createdWorkflow.status as "idle" | "running" | "completed" | "paused") || "idle",
      aiModel: createdWorkflow.aiModel || "Gemini 2.5 Pro Vision",
      sandboxEnv: createdWorkflow.sandboxEnv || "Chromium 128 (CDP Protocol)",
      createdAt: createdWorkflow.createdAt.toISOString(),
      nodes: createdWorkflow.nodes as unknown as WorkflowNodeType[],
      edges: createdWorkflow.edges as unknown as Edge[],
      organizationId: createdWorkflow.organizationId || undefined,
      organizationName: createdWorkflow.organization?.name || undefined,
    };
  }

  /**
   * Update workflow and its node/edge graph
   */
  static async update(id: string, input: UpdateWorkflowInput, userId?: string) {
    let existing = await prisma.workflow.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!existing) {
      const defaultWorkflow = DEFAULT_WORKFLOW_SEEDS.find((seed) => seed.id === id);
      if (defaultWorkflow) {
        existing = await prisma.workflow.create({
          data: {
            id: defaultWorkflow.id,
            name: input.name?.trim() || defaultWorkflow.name,
            description: input.description?.trim() || defaultWorkflow.description,
            category: input.category?.trim() || defaultWorkflow.category,
            targetUrl: input.targetUrl?.trim() || defaultWorkflow.targetUrl || "",
            status: input.status || defaultWorkflow.status,
            aiModel: input.aiModel || "Gemini 2.5 Pro Vision",
            sandboxEnv: input.sandboxEnv || "Chromium 128 (CDP Protocol)",
            nodes: (input.nodes || defaultWorkflow.nodes) as unknown as Prisma.InputJsonValue,
            edges: (input.edges || defaultWorkflow.edges) as unknown as Prisma.InputJsonValue,
            userId: userId || null,
            organizationId: input.organizationId || null,
          },
          include: {
            organization: {
              select: { id: true, name: true },
            },
          },
        });
      } else {
        throw new Error("Workflow not found");
      }
    }

    if (userId && existing.userId && existing.userId !== userId && !existing.organizationId) {
      throw new Error("Unauthorized to edit this workflow");
    }

    const data: Prisma.WorkflowUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.category !== undefined) data.category = input.category.trim();
    if (input.targetUrl !== undefined) data.targetUrl = input.targetUrl.trim();
    if (input.status !== undefined) data.status = input.status;
    if (input.aiModel !== undefined) data.aiModel = input.aiModel;
    if (input.sandboxEnv !== undefined) data.sandboxEnv = input.sandboxEnv;
    if (input.nodes !== undefined) data.nodes = input.nodes as unknown as Prisma.InputJsonValue;
    if (input.edges !== undefined) data.edges = input.edges as unknown as Prisma.InputJsonValue;
    if (input.organizationId !== undefined) data.organization = input.organizationId ? { connect: { id: input.organizationId } } : { disconnect: true };

    const updated = await prisma.workflow.update({
      where: { id },
      data,
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || "",
      category: updated.category,
      targetUrl: updated.targetUrl,
      status: (updated.status as "idle" | "running" | "completed" | "paused") || "idle",
      aiModel: updated.aiModel || "Gemini 2.5 Pro Vision",
      sandboxEnv: updated.sandboxEnv || "Chromium 128 (CDP Protocol)",
      createdAt: updated.createdAt.toISOString(),
      nodes: updated.nodes as unknown as WorkflowNodeType[],
      edges: updated.edges as unknown as Edge[],
      organizationId: updated.organizationId || undefined,
      organizationName: updated.organization?.name || undefined,
    };
  }

  /**
   * Delete a workflow
   */
  static async delete(id: string, userId?: string) {
    const existing = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Workflow not found");
    }

    if (userId && existing.userId && existing.userId !== userId && !existing.organizationId) {
      throw new Error("Unauthorized to delete this workflow");
    }

    await prisma.workflow.delete({
      where: { id },
    });

    return { success: true, id };
  }
}
