"use client";

import { useState, useCallback } from "react";
import type { Edge } from "@xyflow/react";
import { trpc } from "@/lib/trpc/client";
import type {
  WorkflowBlueprint,
  WorkflowNodeType,
  WorkflowNodeData,
  NodeTemplate,
} from "../types";
import { DEFAULT_WORKFLOWS, createWorkflowFromBlueprint } from "../defaultFlows";

export function useWorkflowManager() {
  const [localWorkflows, setLocalWorkflows] = useState<WorkflowBlueprint[] | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(DEFAULT_WORKFLOWS[0].id);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // tRPC Queries & Mutations
  const utils = trpc.useContext();
  const { data: serverWorkflows } = trpc.workflow.getAll.useQuery(undefined, {
    staleTime: 10 * 1000,
    refetchOnWindowFocus: false,
  });

  const createMutation = trpc.workflow.create.useMutation({
    onSuccess: (savedWf) => {
      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? DEFAULT_WORKFLOWS;
        return base.map((w) =>
          w.name === savedWf.name ? (savedWf as unknown as WorkflowBlueprint) : w
        );
      });
      utils.workflow.getAll.invalidate();
    },
  });

  const updateMutation = trpc.workflow.update.useMutation();

  const deleteMutation = trpc.workflow.delete.useMutation({
    onSuccess: () => {
      utils.workflow.getAll.invalidate();
    },
  });

  // Derived workflows: uses local state if modified, else server data, else default
  const workflows: WorkflowBlueprint[] =
    localWorkflows ??
    ((serverWorkflows && serverWorkflows.length > 0)
      ? (serverWorkflows as unknown as WorkflowBlueprint[])
      : DEFAULT_WORKFLOWS);

  const activeWorkflow =
    workflows.find((w) => w.id === activeWorkflowId) || workflows[0] || DEFAULT_WORKFLOWS[0];

  const selectWorkflow = useCallback((id: string) => {
    setActiveWorkflowId(id);
    setSelectedNode(null);
  }, []);

  const createWorkflow = useCallback(
    (params: {
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

      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? DEFAULT_WORKFLOWS;
        return [newWf, ...base];
      });
      setActiveWorkflowId(newWf.id);
      setSelectedNode(null);

      createMutation.mutate({
        name: newWf.name,
        description: newWf.description,
        category: newWf.category,
        targetUrl: newWf.targetUrl,
        aiModel: newWf.aiModel,
        sandboxEnv: newWf.sandboxEnv,
        nodes: newWf.nodes,
        edges: newWf.edges,
        status: newWf.status,
      });

      return newWf;
    },
    [createMutation, serverWorkflows]
  );

  const deleteWorkflow = useCallback(
    (id: string) => {
      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? DEFAULT_WORKFLOWS;
        return base.filter((w) => w.id !== id);
      });
      deleteMutation.mutate({ id });
    },
    [deleteMutation, serverWorkflows]
  );

  const addNode = useCallback(
    (template: NodeTemplate, customData?: Partial<WorkflowNodeData>) => {
      const stepNumber = activeWorkflow.nodes.length + 1;
      const lastNode = activeWorkflow.nodes[activeWorkflow.nodes.length - 1];
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
          url: customData?.url || activeWorkflow.targetUrl || "https://example.com",
          status: "idle",
          metrics: customData?.metrics || template.defaultMetrics,
          logLines: customData?.logLines || template.defaultLogs,
          archetype: template.archetype,
          selector: customData?.selector,
          payload: customData?.payload,
          timeoutMs: customData?.timeoutMs || 5000,
          isPremium: template.isPremium ?? false,
        },
      };

      const newEdges: Edge[] = [...activeWorkflow.edges];
      if (lastNode) {
        newEdges.push({
          id: `edge-${lastNode.id}-${nodeId}`,
          source: lastNode.id,
          target: nodeId,
          animated: true,
          style: { stroke: "#71717a", strokeWidth: 2 },
        });
      }

      const updatedNodes = [...activeWorkflow.nodes, newNode];

      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? DEFAULT_WORKFLOWS;
        return base.map((wf) => {
          if (wf.id !== activeWorkflow.id) return wf;
          return {
            ...wf,
            nodes: updatedNodes,
            edges: newEdges,
          };
        });
      });

      setSelectedNode(newNode);

      updateMutation.mutate({
        id: activeWorkflow.id,
        nodes: updatedNodes,
        edges: newEdges,
      });
    },
    [activeWorkflow, updateMutation, serverWorkflows]
  );

  const updateNode = useCallback(
    (nodeId: string, updatedData: Partial<WorkflowNodeData>) => {
      let updatedNodes: WorkflowNodeType[] = [];

      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? DEFAULT_WORKFLOWS;
        return base.map((wf) => {
          if (wf.id !== activeWorkflow.id) return wf;

          updatedNodes = wf.nodes.map((node) => {
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
        });
      });

      updateMutation.mutate({
        id: activeWorkflow.id,
        nodes: updatedNodes,
      });
    },
    [activeWorkflow.id, updateMutation, serverWorkflows]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      let updatedNodes: WorkflowNodeType[] = [];
      let updatedEdges: Edge[] = [];

      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? DEFAULT_WORKFLOWS;
        return base.map((wf) => {
          if (wf.id !== activeWorkflow.id) return wf;

          updatedNodes = wf.nodes
            .filter((node) => node.id !== nodeId)
            .map((node, index) => ({
              ...node,
              data: {
                ...node.data,
                stepNumber: index + 1,
              },
            }));

          updatedEdges = wf.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          );

          setSelectedNode(null);
          return { ...wf, nodes: updatedNodes, edges: updatedEdges };
        });
      });

      updateMutation.mutate({
        id: activeWorkflow.id,
        nodes: updatedNodes,
        edges: updatedEdges,
      });
    },
    [activeWorkflow.id, updateMutation, serverWorkflows]
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

      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? DEFAULT_WORKFLOWS;
        return base.map((wf) => {
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
        });
      });

      setSelectedNode(activeWorkflow.nodes[currentIdx] || null);
      currentIdx++;
    }, 1100);
  }, [isRunning, activeWorkflow, serverWorkflows]);

  return {
    workflows,
    activeWorkflow,
    activeWorkflowId,
    selectedNode,
    isRunning,
    isSyncing: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    selectWorkflow,
    createWorkflow,
    deleteWorkflow,
    addNode,
    updateNode,
    deleteNode,
    setSelectedNode,
    runPipeline,
  };
}
