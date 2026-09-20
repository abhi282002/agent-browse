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
