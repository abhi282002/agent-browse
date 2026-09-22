import type { Stagehand, Page } from '@browserbasehq/stagehand';

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
    emailProvider?: 'resend' | 'nodemailer';
    metrics?: { label: string; value: string }[];
    [key: string]: unknown;
  };
}

export interface OrganizationExecutionContext {
  id: string;
  name: string;
  aiInstructions?: string;
  defaultAiModel?: string;
}

export interface NodeExecutionContext {
  stagehand: Stagehand;
  page: Page;
  targetUrl?: string;
  aiModel?: string;
  userEmail?: string;
  organization?: OrganizationExecutionContext;
  pipelineOutputs?: Record<string, unknown>;
  previousStepOutput?: Record<string, unknown>;
  workflowNodes?: WorkflowExecutionNode[];
}

export interface NodeExecutionOutput {
  output?: Record<string, unknown>;
  logs: string[];
}

export type NodeHandler = (
  node: WorkflowExecutionNode,
  ctx: NodeExecutionContext,
) => Promise<NodeExecutionOutput>;
