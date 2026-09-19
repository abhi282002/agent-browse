import type { Node, Edge } from "@xyflow/react";

export type StepNodeStatus = "idle" | "running" | "completed" | "failed";

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
  nodes: WorkflowNodeType[];
  edges: Edge[];
}
