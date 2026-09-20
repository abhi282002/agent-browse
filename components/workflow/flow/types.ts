import type { Node, Edge } from "@xyflow/react";

export type StepNodeStatus = "idle" | "running" | "completed" | "failed";

export type NodeArchetype =
  | "navigation"
  | "grounding"
  | "action"
  | "form"
  | "extraction"
  | "webhook"
  | "summarization"
  | "news_gather"
  | "news_extraction"
  | "news_summary"
  | "email";

export interface WorkflowNodeData extends Record<string, unknown> {
  stepNumber: number;
  title: string;
  category: string;
  badge: string;
  description: string;
  actionSummary: string;
  url: string;
  status: StepNodeStatus;
  metrics: { label: string; value: string }[];
  logLines: string[];
  archetype?: NodeArchetype;
  selector?: string;
  payload?: string;
  timeoutMs?: number;
  isPremium?: boolean;
}

export type WorkflowNodeType = Node<WorkflowNodeData, "workflowStep">;

export interface WorkflowBlueprint {
  id: string;
  name: string;
  description: string;
  category: string;
  targetUrl: string;
  status: "idle" | "running" | "completed" | "paused";
  createdAt: string;
  aiModel?: string;
  sandboxEnv?: string;
  nodes: WorkflowNodeType[];
  edges: Edge[];
}

export interface NodeTemplate {
  id?: string;
  archetype: NodeArchetype;
  title: string;
  category: string;
  badge: string;
  description: string;
  actionSummary: string;
  isPremium?: boolean;
  defaultMetrics: { label: string; value: string }[];
  defaultLogs: string[];
}
