export type BrowserSessionLike = {
  sessionId?: string;
  id?: string;
};

export type JsonSafeMetadata = {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | string[]
    | number[]
    | boolean[]
    | JsonSafeMetadata
    | JsonSafeMetadata[]
    | undefined;
};

export interface TriggerWorkflowPayload {
  workflowId: string;
  workflowName: string;
  targetUrl?: string;
  aiModel?: string;
  userEmail?: string;
  contextId?: string;
  organization?: {
    id: string;
    name: string;
    aiInstructions?: string;
    defaultAiModel?: string;
  };
  nodes: Array<{
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
      aiModel?: string;
      authEmail?: string;
      authPassword?: string;
      metrics?: { label: string; value: string }[];
    };
  }>;
  edges?: Array<{
    source: string;
    target: string;
  }>;
}
