"use client";

import { useState, useCallback } from "react";
import type { Edge } from "@xyflow/react";
import type {
  WorkflowBlueprint,
  WorkflowNodeType,
  WorkflowNodeData,
  NodeTemplate,
} from "../types";
import { DEFAULT_WORKFLOWS, createWorkflowFromBlueprint } from "../defaultFlows";

export function useWorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowBlueprint[]>(DEFAULT_WORKFLOWS);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(DEFAULT_WORKFLOWS[0].id);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const activeWorkflow =
    workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  const selectWorkflow = useCallback((id: string) => {
    setActiveWorkflowId(id);
    setSelectedNode(null);
  }, []);

  const createWorkflow = useCallback((params: {
    name: string;
    description: string;
    category: string;
    targetUrl: string;
    aiModel?: string;
    sandboxEnv?: string;
  }) => {
    const newWf = createWorkflowFromBlueprint(params);
    newWf.aiModel = params.aiModel || "Gemini 2.5 Pro Vision";
    newWf.sandboxEnv = params.sandboxEnv || "Chromium 128 (CDP Sandbox)";
    setWorkflows((prev) => [newWf, ...prev]);
    setActiveWorkflowId(newWf.id);
    setSelectedNode(null);
    return newWf;
  }, []);

  const addNode = useCallback(
    (template: NodeTemplate, customData?: Partial<WorkflowNodeData>) => {
      setWorkflows((prev) =>
        prev.map((wf) => {
          if (wf.id !== activeWorkflow.id) return wf;

          const stepNumber = wf.nodes.length + 1;
          const lastNode = wf.nodes[wf.nodes.length - 1];
          const newX = lastNode ? lastNode.position.x + 310 : 60;
          const newY = lastNode ? 120 + (stepNumber % 2 === 0 ? 30 : 0) : 120;
          const nodeId = `node-${Date.now()}`;

          const newNode: WorkflowNodeType = {
            id: nodeId,
            type: "workflowStep",
            position: { x: newX, y: newY },
            data: {
              stepNumber,
              title: customData?.title || template.title,
              category: customData?.category || template.category,
              badge: customData?.badge || template.badge,
              description: customData?.description || template.description,
              actionSummary: customData?.actionSummary || template.actionSummary,
              url: customData?.url || wf.targetUrl || "https://example.com",
              status: "idle",
              metrics: customData?.metrics || template.defaultMetrics,
              logLines: customData?.logLines || template.defaultLogs,
              archetype: template.archetype,
              selector: customData?.selector,
              payload: customData?.payload,
              timeoutMs: customData?.timeoutMs || 5000,
            },
          };

          const newEdges: Edge[] = [...wf.edges];
          if (lastNode) {
            newEdges.push({
              id: `edge-${lastNode.id}-${nodeId}`,
              source: lastNode.id,
              target: nodeId,
              animated: true,
              style: { stroke: "#71717a", strokeWidth: 2 },
            });
          }

          setSelectedNode(newNode);
          return {
            ...wf,
            nodes: [...wf.nodes, newNode],
            edges: newEdges,
          };
        })
      );
    },
    [activeWorkflow.id]
  );

  const updateNode = useCallback(
    (nodeId: string, updatedData: Partial<WorkflowNodeData>) => {
      setWorkflows((prev) =>
        prev.map((wf) => {
          if (wf.id !== activeWorkflow.id) return wf;

          const updatedNodes = wf.nodes.map((node) => {
            if (node.id !== nodeId) return node;
            const merged = {
              ...node,
              data: {
                ...node.data,
                ...updatedData,
              },
            };
            setSelectedNode(merged);
            return merged;
          });

          return { ...wf, nodes: updatedNodes };
        })
      );
    },
    [activeWorkflow.id]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setWorkflows((prev) =>
        prev.map((wf) => {
          if (wf.id !== activeWorkflow.id) return wf;

          const filteredNodes = wf.nodes
            .filter((node) => node.id !== nodeId)
            .map((node, index) => ({
              ...node,
              data: {
                ...node.data,
                stepNumber: index + 1,
              },
            }));

          const filteredEdges = wf.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          );

          setSelectedNode(null);
          return { ...wf, nodes: filteredNodes, edges: filteredEdges };
        })
      );
    },
    [activeWorkflow.id]
  );

  const runPipeline = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);

    const totalNodes = activeWorkflow.nodes.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= totalNodes) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }

      setWorkflows((prev) =>
        prev.map((wf) => {
          if (wf.id !== activeWorkflow.id) return wf;

          const updatedNodes = wf.nodes.map((node, i) => {
            if (i === currentIdx) {
              return {
                ...node,
                data: { ...node.data, status: "running" as const },
              };
            }
            if (i < currentIdx) {
              return {
                ...node,
                data: { ...node.data, status: "completed" as const },
              };
            }
            return {
              ...node,
              data: { ...node.data, status: "idle" as const },
            };
          });

          return { ...wf, nodes: updatedNodes };
        })
      );

      setSelectedNode(activeWorkflow.nodes[currentIdx] || null);
      currentIdx++;
    }, 1100);
  }, [isRunning, activeWorkflow]);

  return {
    workflows,
    activeWorkflow,
    activeWorkflowId,
    selectedNode,
    isRunning,
    selectWorkflow,
    createWorkflow,
    addNode,
    updateNode,
    deleteNode,
    setSelectedNode,
    runPipeline,
  };
}
