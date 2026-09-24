import { WorkflowService } from './workflowService';
import { NodeTemplateService } from './nodeTemplateService';
import { NODE_REGISTRY } from './nodeRegistry';
import type { WorkflowNodeType } from '@/components/workflow/flow/types';
import type { Edge } from '@xyflow/react';
import { KNOWN_DESCRIPTIONS, resolveArchetype } from './utils';
import { NodeTemplate } from '@prisma/client';

export interface GenerateAiWorkflowInput {
  goal: string;
  targetUrl?: string;
  aiModel?: string;
  sandboxEnv?: string;
  organizationId?: string;
  organizationName?: string;
  organizationAiInstructions?: string;
  userId?: string;
}

export interface GeneratedWorkflowBlueprintResult {
  workflow: {
    id: string;
    name: string;
    description: string;
    category: string;
    targetUrl: string;
    aiModel: string;
    sandboxEnv: string;
    nodes: WorkflowNodeType[];
    edges: Edge[];
    status: string;
    createdAt: string;
    organizationId?: string;
  };
  explanation: string;
  modelUsed: string;
}

interface BlueprintPlanStep {
  title: string;
  category: string;
  badge: string;
  archetype: string;
  description: string;
  actionSummary: string;
  url?: string;
  selector?: string;
  payload?: string;
  emailProvider?: 'resend' | 'nodemailer';
  metrics?: { label: string; value: string }[];
}

interface BlueprintPlan {
  name: string;
  description: string;
  category: string;
  targetUrl: string;
  explanation: string;
  steps: BlueprintPlanStep[];
}

function buildPrompt(params: {
  orgName: string;
  orgDirectives: string;
  goal: string;
  targetUrl: string;
  schemaString: string;
  guideString: string;
  archetypes: string[];
}): string {
  const {
    orgName,
    orgDirectives,
    goal,
    targetUrl,
    schemaString,
    guideString,
    archetypes,
  } = params;

  return `You are an elite Autonomous Browser Agent Architect.
A user belonging to Organization "${orgName}" requested a new autonomous browser agent workflow.

Organization AI Heuristics / Guidelines:
"${orgDirectives}"

User Goal:
"${goal}"

Target Webpage / Starting URL:
"${targetUrl}"

Supported System Node Archetypes (You MUST strictly choose archetypes from this list only):
${guideString}

Generate a structured multi-step automation pipeline. Output ONLY a valid JSON object matching this schema (do not wrap in markdown or backticks):
{
  "name": "Concise workflow name (under 45 characters)",
  "description": "Executive description of the end-to-end task (1-2 sentences)",
  "category": "Category name (e.g. Data Extraction, Price Intelligence, Competitor Analysis, Lead Intelligence, QA Automation)",
  "targetUrl": "Refined starting URL",
  "explanation": "Brief reasoning explaining how this graph satisfies the organization's goal",
  "steps": [
    {
      "title": "Step 1 Title",
      "category": "Perception & Actions / Navigation / Extraction / AI Intelligence / Alerts & Webhooks",
      "badge": "Short badge (e.g. CDP Launch, DOM Parse, LLM Summary, Webhook Alert)",
      "archetype": "${schemaString}",
      "description": "Step detail",
      "actionSummary": "Concrete agent action description",
      "url": "Target URL for this step if applicable",
      "selector": "CSS selector or semantic query if applicable",
      "payload": "Optional payload or query parameters",
      "emailProvider": "resend",
      "metrics": [
        { "label": "Latency Target", "value": "120ms" }
      ]
    }
  ]
}

STRICT ARCHETYPE CONSTRAINT:
You MUST ONLY select an "archetype" from the supported list above: [${archetypes.join(', ')}].
Do NOT invent, hallucinate, or output any archetype outside this exact set.
Every step must strictly map to one of our system's supported archetypes.

The pipeline must have between 3 to 6 logical sequential steps (e.g. 1: open_url, 2: action/grounding, 3: extraction, 4: summarization, 5: email/webhook).
Ensure all steps reflect the Organization's directives: "${orgDirectives}".`;
}

async function requestGeminiPlan(
  prompt: string,
  apiKey: string,
): Promise<BlueprintPlan | null> {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return JSON.parse(text) as BlueprintPlan;
      }
    }
  } catch (e) {
    console.warn(
      '[AiWorkflowGenerator] Gemini inference failed, using fallback plan:',
      e,
    );
  }
  return null;
}

function buildHeuristicPlan(params: {
  goal: string;
  targetUrl: string;
  orgName: string;
  orgDirectives: string;
  modelToUse: string;
}): BlueprintPlan {
  const { goal, targetUrl, orgName, orgDirectives, modelToUse } = params;
  const cleanGoal = goal.trim();
  const sanitizedName =
    cleanGoal.length > 40 ? `${cleanGoal.slice(0, 37)}...` : cleanGoal;

  return {
    name: sanitizedName || `${orgName} Automation`,
    description: `Autonomous browser agent executing: "${cleanGoal}". Customized under ${orgName}.`,
    category: cleanGoal.toLowerCase().includes('price')
      ? 'Price Intelligence'
      : cleanGoal.toLowerCase().includes('lead')
        ? 'Lead Generation'
        : cleanGoal.toLowerCase().includes('news')
          ? 'Market Intelligence'
          : 'Autonomous Extraction',
    targetUrl,
    explanation: `Custom workflow generated for ${orgName} based on goal "${cleanGoal}". Pre-seeded with browser navigation, DOM inspection, AI summarization, and email telemetry.`,
    steps: [
      {
        title: 'CDP Headless Navigation',
        category: 'Perception & Actions',
        badge: 'CDP Launch',
        archetype: 'open_url',
        description: `Allocates a cloud Chromium sandbox and navigates to ${targetUrl}.`,
        actionSummary: `Navigate to ${targetUrl} with residential proxy pool`,
        url: targetUrl,
        metrics: [
          { label: 'Target URL', value: targetUrl },
          { label: 'Protocol', value: 'CDP DevTools' },
        ],
      },
      {
        title: 'DOM Structure Grounding',
        category: 'Perception & Actions',
        badge: 'Perception',
        archetype: 'action',
        description:
          'Waits for DOM hydration, bypasses bot verification, and captures visual tree.',
        actionSummary: `Ground elements and wait for interactive elements on ${targetUrl}`,
        url: targetUrl,
        metrics: [
          { label: 'Timeout', value: '8,000ms' },
          { label: 'Bot Stealth', value: 'Active' },
        ],
      },
      {
        title: 'Autonomous Entity Extraction',
        category: 'Extraction',
        badge: 'Data Extract',
        archetype: 'extraction',
        description: `Extracts relevant content according to: "${cleanGoal}".`,
        actionSummary: `Extract JSON structured entities based on user objective`,
        url: targetUrl,
        metrics: [
          { label: 'Format', value: 'JSON Schema' },
          { label: 'Fields', value: 'Auto-detected' },
        ],
      },
      {
        title: 'AI Synthesis & Directive Alignment',
        category: 'AI Intelligence',
        badge: 'LLM Summary',
        archetype: 'summarization',
        description: `Synthesizes extracted data enforcing ${orgName} directives: "${orgDirectives}".`,
        actionSummary: `Synthesize insights using ${modelToUse} under ${orgName} directives`,
        url: targetUrl,
        metrics: [
          { label: 'AI Engine', value: modelToUse },
          { label: 'Organization', value: orgName },
        ],
      },
      {
        title: 'Executive Email Dispatch',
        category: 'Alerts & Webhooks',
        badge: 'Email Alert',
        archetype: 'email',
        emailProvider: 'resend',
        description: `Dispatches execution report and structured insights to ${orgName} stakeholders.`,
        actionSummary: `Format and send HTML executive summary email`,
        url: targetUrl,
        metrics: [
          { label: 'Provider', value: 'Resend' },
          { label: 'Delivery', value: 'Instant' },
        ],
      },
    ],
  };
}

function constructWorkflowGraph(params: {
  plan: BlueprintPlan;
  modelToUse: string;
  orgName: string;
  validArchetypeSet: Set<string>;
}): { nodes: WorkflowNodeType[]; edges: Edge[] } {
  const { plan, modelToUse, orgName, validArchetypeSet } = params;
  const resolver = resolveArchetype(validArchetypeSet);

  const nodes: WorkflowNodeType[] = plan.steps.map((step, idx) => {
    const stepNumber = idx + 1;
    const x = 60 + idx * 310;
    const y = 140 + (stepNumber % 2 === 0 ? 30 : 0);
    const nodeId = `node-ai-${Date.now()}-${idx}`;

    return {
      id: nodeId,
      type: 'workflowStep',
      position: { x, y },
      data: {
        stepNumber,
        title: step.title,
        category: step.category,
        badge: step.badge,
        description: step.description,
        actionSummary: step.actionSummary,
        url: step.url || plan.targetUrl || 'https://example.com',
        status: 'idle',
        archetype: resolver(step.archetype),
        emailProvider: step.emailProvider || 'resend',
        aiModel: modelToUse,
        selector: step.selector,
        payload: step.payload,
        metrics: step.metrics || [
          { label: 'Stage', value: `Step 0${stepNumber}` },
          { label: 'Org', value: orgName },
        ],
        logLines: [
          `Initialized node for Organization: "${orgName}"`,
          `Action directive: "${step.actionSummary}"`,
        ],
      },
    };
  });

  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 2 },
    });
  }

  return { nodes, edges };
}

export class AiWorkflowGenerator {
  static async getSupportedArchetypes(): Promise<{
    archetypes: string[];
    schemaString: string;
    guideString: string;
  }> {
    let templates: Partial<NodeTemplate>[] = [];
    try {
      templates = await NodeTemplateService.list();
    } catch (error) {
      console.warn(
        'Failed to fetch node templates from DB, using registry:',
        error,
      );
    }

    const templateArchetypes = templates
      .map((t) => t.archetype)
      .filter((arch): arch is string => Boolean(arch));
    const registryArchetypes = Object.keys(NODE_REGISTRY);

    const archetypes = Array.from(
      new Set([...templateArchetypes, ...registryArchetypes]),
    ).filter((a) => a !== 'auth');

    const guideLines = archetypes.map((arch) => {
      const template = templates.find((t) => t.archetype === arch);
      const desc =
        template?.description ||
        KNOWN_DESCRIPTIONS[arch!] ||
        'Performs autonomous browser automation step';
      return `- "${arch}": ${desc}`;
    });

    return {
      archetypes,
      schemaString: archetypes.join(' | '),
      guideString: guideLines.join('\n'),
    };
  }

  static async generateWorkflow(
    input: GenerateAiWorkflowInput,
  ): Promise<GeneratedWorkflowBlueprintResult> {
    const orgName = input.organizationName || 'Active Organization';
    const orgDirectives =
      input.organizationAiInstructions?.trim() ||
      'Autonomous browser automation with high-accuracy DOM perception and deterministic extraction.';
    const modelToUse = input.aiModel || 'Gemini 2.5 Pro Vision';
    const targetUrl = input.targetUrl?.trim() || 'https://example.com';

    const { archetypes, schemaString, guideString } =
      await this.getSupportedArchetypes();

    const prompt = buildPrompt({
      orgName,
      orgDirectives,
      goal: input.goal,
      targetUrl,
      schemaString,
      guideString,
      archetypes,
    });

    let generatedData: BlueprintPlan | null = null;
    let modelUsed = modelToUse;

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      generatedData = await requestGeminiPlan(prompt, geminiKey);
      if (generatedData) {
        modelUsed = 'gemini-2.5-pro';
      }
    }

    if (!generatedData || !generatedData.steps || generatedData.steps.length === 0) {
      generatedData = buildHeuristicPlan({
        goal: input.goal,
        targetUrl,
        orgName,
        orgDirectives,
        modelToUse,
      });
    }

    const validArchetypeSet = new Set(archetypes.map((a) => a.toLowerCase()));
    const { nodes, edges } = constructWorkflowGraph({
      plan: generatedData,
      modelToUse,
      orgName,
      validArchetypeSet,
    });

    const createdWorkflow = await WorkflowService.create(
      {
        name: generatedData.name,
        description: generatedData.description,
        category: generatedData.category || 'Autonomous Extraction',
        targetUrl: generatedData.targetUrl || targetUrl,
        aiModel: modelToUse,
        sandboxEnv: input.sandboxEnv || 'Chromium 128 (CDP Protocol)',
        nodes,
        edges,
        status: 'idle',
      },
      input.userId,
      input.organizationId,
    );

    return {
      workflow: {
        ...createdWorkflow,
        organizationId: input.organizationId,
      },
      explanation: generatedData.explanation,
      modelUsed,
    };
  }
}
