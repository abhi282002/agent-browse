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
  | "email"
  | "open_url"
  | "authentication"
  | "auth";

export type EmailProviderType = 'resend' | 'nodemailer';

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
  emailProvider?: EmailProviderType;
  aiModel?: string;
  selector?: string;
  payload?: string;
  authEmail?: string;
  authPassword?: string;
  timeoutMs?: number;
  isPremium?: boolean;
  durationMs?: number;
  errorMessage?: string;
}

export type WorkflowNodeType = Node<WorkflowNodeData, "workflowStep">;

export interface WorkflowBlueprint {
  id: string;
  name: string;
  description: string;
  category: string;
  targetUrl?: string;
  status: "idle" | "running" | "completed" | "paused";
  createdAt: string;
  aiModel?: string;
  sandboxEnv?: string;
  nodes: WorkflowNodeType[];
  edges: Edge[];
  organizationId?: string;
  organizationName?: string;
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
  emailProvider?: EmailProviderType;
  defaultMetrics: { label: string; value: string }[];
  defaultLogs: string[];
}

