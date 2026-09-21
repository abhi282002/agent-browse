import type { Edge } from "@xyflow/react";
import type { WorkflowBlueprint, WorkflowNodeType } from "./types";

/**
 * Creates an initial workflow scaffold with default steps when a user
 * provisions a new workflow from the UI modal.
 *
 * NOTE: All persistent workflows are loaded dynamically from the PostgreSQL database
 * via tRPC (WorkflowService). Hardcoded mock flows have been eliminated from the client bundle.
 */
export function createWorkflowFromBlueprint(params: {
  name: string;
  description: string;
  category: string;
  targetUrl?: string;
}): WorkflowBlueprint {
  const id = `wf-${Date.now()}`;
  const target = params.targetUrl || "";
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
        description: target
          ? `Navigates to ${target} and initializes browser telemetry sandbox.`
          : "Initializes browser telemetry sandbox and prepares agent context.",
        actionSummary: "Connecting Chromium CDP instance",
        url: target,
        status: "idle",
        metrics: [{ label: "Protocol", value: "CDP v128" }],
        logLines: target
          ? [`Opening target: ${target}`, "Allocated ephemeral profile sandbox"]
          : ["Allocated ephemeral profile sandbox"],
        archetype: "open_url",
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
        url: target,
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
    description: params.description || `Autonomous automation workflow for ${params.name}`,
    category: params.category || "Custom Automation",
    targetUrl: target,
    status: "idle",
    createdAt: "Just now",
    nodes,
    edges,
  };
}

// Deprecated empty export for backward compatibility
export const DEFAULT_WORKFLOWS: WorkflowBlueprint[] = [];
