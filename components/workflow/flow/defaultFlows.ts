import type { Edge } from "@xyflow/react";
import type { WorkflowBlueprint, WorkflowNodeType } from "./types";
import { WORKFLOW_STEPS } from "../workflowData";

// Generate primary Arxiv research nodes & edges based on existing WORKFLOW_STEPS
const primaryNodes: WorkflowNodeType[] = WORKFLOW_STEPS.map((step, idx) => ({
  id: step.id,
  type: "workflowStep",
  position: { x: 40 + idx * 300, y: 120 + (idx % 2 === 0 ? 0 : 40) },
  data: {
    stepNumber: step.stepNumber,
    title: step.title,
    category: step.category,
    badge: step.badge,
    description: step.description,
    actionSummary: step.actionSummary,
    url: step.url,
    status: idx === 1 ? "running" : idx === 0 ? "completed" : "idle",
    metrics: step.metrics,
    logLines: step.logLines,
  },
}));

const primaryEdges: Edge[] = [
  {
    id: "e1-2",
    source: "step-1",
    target: "step-2",
    animated: true,
    style: { stroke: "#10b981", strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "step-2",
    target: "step-3",
    animated: true,
    style: { stroke: "#71717a", strokeWidth: 2 },
  },
  {
    id: "e3-4",
    source: "step-3",
    target: "step-4",
    animated: true,
    style: { stroke: "#71717a", strokeWidth: 2 },
  },
  {
    id: "e4-5",
    source: "step-4",
    target: "step-5",
    animated: true,
    style: { stroke: "#71717a", strokeWidth: 2 },
  },
];

export const DEFAULT_WORKFLOWS: WorkflowBlueprint[] = [
  {
    id: "wf-arxiv-research",
    name: "Arxiv Research & PDF Extraction",
    description: "Autonomously searches scientific papers on Arxiv, traverses pagination, resolves PDF links, and exports schema-validated JSON records.",
    category: "Academic Research",
    targetUrl: "https://arxiv.org/list/cs.AI/recent",
    status: "running",
    createdAt: "Just now",
    nodes: primaryNodes,
    edges: primaryEdges,
  },
  {
    id: "wf-ecommerce-monitor",
    name: "GPU & Hardware Price Monitor",
    description: "Monitors real-time stock levels, solves bot captchas, navigates multi-retailer inventory tables, and triggers webhook alerts.",
    category: "Price Intelligence",
    targetUrl: "https://bestbuy.com/site/computer-cards-components",
    status: "idle",
    createdAt: "2 hours ago",
    nodes: [
      {
        id: "ecom-1",
        type: "workflowStep",
        position: { x: 50, y: 120 },
        data: {
          stepNumber: 1,
          title: "Session Initialization",
          category: "CDP Session",
          badge: "Browser",
          description: "Spawns headless Chrome with custom canvas fingerprinting resistance.",
          actionSummary: "Allocating clean proxy pool & spoofing hardware specs",
          url: "agent://proxy/eu-west/connect",
          status: "completed",
          metrics: [{ label: "Proxy Latency", value: "32ms" }],
          logLines: ["Proxy session authenticated", "UserAgent spoofed: Win64; Chrome 128"],
        },
      },
      {
        id: "ecom-2",
        type: "workflowStep",
        position: { x: 360, y: 120 },
        data: {
          stepNumber: 2,
          title: "Product Search & Filter",
          category: "DOM Action",
          badge: "Perception",
          description: "Inputs search query 'RTX 4090' and applies stock availability filters.",
          actionSummary: "Clicking 'In Stock Only' checkbox",
          url: "https://retailer.example.com/search",
          status: "idle",
          metrics: [{ label: "Items Filtered", value: "128" }],
          logLines: ["Filters dispatched", "DOM layout stabilized"],
        },
      },
      {
        id: "ecom-3",
        type: "workflowStep",
        position: { x: 670, y: 120 },
        data: {
          stepNumber: 3,
          title: "Extract Price Matrix",
          category: "Scraper",
          badge: "Extraction",
          description: "Parses SKU prices, calculates discount margin, and flags deals under MSRP.",
          actionSummary: "Serializing items into discount telemetry array",
          url: "agent://artifacts/prices.json",
          status: "idle",
          metrics: [{ label: "Deals Found", value: "3 SKUs" }],
          logLines: ["Discount engine run", "Export bundle saved to S3"],
        },
      },
    ],
    edges: [
      { id: "ee-1-2", source: "ecom-1", target: "ecom-2", animated: true, style: { stroke: "#71717a", strokeWidth: 2 } },
      { id: "ee-2-3", source: "ecom-2", target: "ecom-3", animated: true, style: { stroke: "#71717a", strokeWidth: 2 } },
    ],
  },
];

export function createWorkflowFromBlueprint(params: {
  name: string;
  description: string;
  category: string;
  targetUrl: string;
}): WorkflowBlueprint {
  const id = `wf-${Date.now()}`;
  const nodes: WorkflowNodeType[] = [
    {
      id: `${id}-node-1`,
      type: "workflowStep",
      position: { x: 60, y: 130 },
      data: {
        stepNumber: 1,
        title: "Navigation & Handshake",
        category: params.category || "Orchestration",
        badge: "Init",
        description: `Navigates to ${params.targetUrl} and initializes browser telemetry sandbox.`,
        actionSummary: "Connecting Chromium CDP instance",
        url: params.targetUrl || "https://example.com",
        status: "idle",
        metrics: [{ label: "Protocol", value: "CDP v128" }],
        logLines: [`Opening target: ${params.targetUrl}`, "Allocated ephemeral profile sandbox"],
      },
    },
    {
      id: `${id}-node-2`,
      type: "workflowStep",
      position: { x: 370, y: 130 },
      data: {
        stepNumber: 2,
        title: "Semantic Analysis & Action",
        category: "Vision & Plan",
        badge: "Process",
        description: "Scans interactable DOM nodes and executes automated traversal sequence.",
        actionSummary: "Executing goal instructions with autonomous fallback",
        url: params.targetUrl || "https://example.com",
        status: "idle",
        metrics: [{ label: "AI Grounding", value: "Active" }],
        logLines: ["Analyzing viewport tree", "Dispatched targeted keyboard/pointer events"],
      },
    },
    {
      id: `${id}-node-3`,
      type: "workflowStep",
      position: { x: 680, y: 130 },
      data: {
        stepNumber: 3,
        title: "Telemetry & Export",
        category: "Export Engine",
        badge: "Output",
        description: "Verifies execution integrity, captures session video, and saves structured artifacts.",
        actionSummary: "Packaging runtime logs and extracted data",
        url: "agent://artifacts/result.json",
        status: "idle",
        metrics: [{ label: "Artifacts", value: "Ready" }],
        logLines: ["Generated execution replay artifact", "Task finalized successfully"],
      },
    },
  ];

  const edges: Edge[] = [
    { id: `${id}-e1-2`, source: `${id}-node-1`, target: `${id}-node-2`, animated: true, style: { stroke: "#10b981", strokeWidth: 2 } },
    { id: `${id}-e2-3`, source: `${id}-node-2`, target: `${id}-node-3`, animated: true, style: { stroke: "#71717a", strokeWidth: 2 } },
  ];

  return {
    id,
    name: params.name,
    description: params.description || `Autonomous automation workflow for ${params.targetUrl}`,
    category: params.category || "Custom Automation",
    targetUrl: params.targetUrl,
    status: "idle",
    createdAt: "Just now",
    nodes,
    edges,
  };
}
