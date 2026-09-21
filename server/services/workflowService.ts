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
}

export class WorkflowService {
  /**
   * List workflows. Automatically seeds default blueprints if the database is empty.
   */
  static async list(userId?: string) {
    // If authenticated, get user's workflows or public workflows
    const whereClause: Prisma.WorkflowWhereInput = userId
      ? {
          OR: [{ userId }, { userId: null }],
        }
      : {};

    let workflows = await prisma.workflow.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Auto-seed default workflows if none exist yet
    if (workflows.length === 0) {
      for (const def of DEFAULT_WORKFLOW_SEEDS) {
        await prisma.workflow.create({
          data: {
            id: def.id,
            name: def.name,
            description: def.description,
            category: def.category,
            targetUrl: def.targetUrl || "",
            status: def.status,
            aiModel: "Gemini 2.5 Pro Vision",
            sandboxEnv: "Chromium 128 (CDP Protocol)",
            nodes: def.nodes as unknown as Prisma.InputJsonValue,
            edges: def.edges as unknown as Prisma.InputJsonValue,
            userId: userId || null,
          },
        });
      }

      workflows = await prisma.workflow.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });
    }

    return workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      description: wf.description || "",
      category: wf.category,
      targetUrl: wf.targetUrl,
      status: (wf.status as "idle" | "running" | "completed" | "paused") || "idle",
      aiModel: wf.aiModel || "Gemini 2.5 Pro Vision",
      sandboxEnv: wf.sandboxEnv || "Chromium 128 (CDP Protocol)",
      createdAt: wf.createdAt.toISOString(),
      nodes: wf.nodes as unknown as WorkflowNodeType[],
      edges: wf.edges as unknown as Edge[],
    }));
  }

  /**
   * Retrieve a workflow by ID
   */
  static async getById(id: string) {
    const wf = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!wf) {
      throw new Error("Workflow not found");
    }

    return {
      id: wf.id,
      name: wf.name,
      description: wf.description || "",
      category: wf.category,
      targetUrl: wf.targetUrl,
      status: (wf.status as "idle" | "running" | "completed" | "paused") || "idle",
      aiModel: wf.aiModel || "Gemini 2.5 Pro Vision",
      sandboxEnv: wf.sandboxEnv || "Chromium 128 (CDP Protocol)",
      createdAt: wf.createdAt.toISOString(),
      nodes: wf.nodes as unknown as WorkflowNodeType[],
      edges: wf.edges as unknown as Edge[],
    };
  }

  /**
   * Create a new workflow in database
   */
  static async create(input: CreateWorkflowInput, userId?: string) {
    const wf = await prisma.workflow.create({
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
      },
    });

    return {
      id: wf.id,
      name: wf.name,
      description: wf.description || "",
      category: wf.category,
      targetUrl: wf.targetUrl,
      status: (wf.status as "idle" | "running" | "completed" | "paused") || "idle",
      aiModel: wf.aiModel || "Gemini 2.5 Pro Vision",
      sandboxEnv: wf.sandboxEnv || "Chromium 128 (CDP Protocol)",
      createdAt: wf.createdAt.toISOString(),
      nodes: wf.nodes as unknown as WorkflowNodeType[],
      edges: wf.edges as unknown as Edge[],
    };
  }

  /**
   * Update workflow and its node/edge graph
   */
  static async update(id: string, input: UpdateWorkflowInput, userId?: string) {
    let existing = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!existing) {
      const defaultWf = DEFAULT_WORKFLOW_SEEDS.find((w) => w.id === id);
      if (defaultWf) {
        existing = await prisma.workflow.create({
          data: {
            id: defaultWf.id,
            name: input.name?.trim() || defaultWf.name,
            description: input.description?.trim() || defaultWf.description,
            category: input.category?.trim() || defaultWf.category,
            targetUrl: input.targetUrl?.trim() || defaultWf.targetUrl || "",
            status: input.status || defaultWf.status,
            aiModel: input.aiModel || "Gemini 2.5 Pro Vision",
            sandboxEnv: input.sandboxEnv || "Chromium 128 (CDP Protocol)",
            nodes: (input.nodes || defaultWf.nodes) as unknown as Prisma.InputJsonValue,
            edges: (input.edges || defaultWf.edges) as unknown as Prisma.InputJsonValue,
            userId: userId || null,
          },
        });
      } else {
        throw new Error("Workflow not found");
      }
    }

    if (userId && existing.userId && existing.userId !== userId) {
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

    const updated = await prisma.workflow.update({
      where: { id },
      data,
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

    if (userId && existing.userId && existing.userId !== userId) {
      throw new Error("Unauthorized to delete this workflow");
    }

    await prisma.workflow.delete({
      where: { id },
    });

    return { success: true, id };
  }
}
