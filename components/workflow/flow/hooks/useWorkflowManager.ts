"use client";

import { useState, useCallback } from "react";
import type { Edge } from "@xyflow/react";
import { trpc } from "@/lib/trpc/client";
import type {
  WorkflowBlueprint,
  WorkflowNodeType,
  WorkflowNodeData,
  NodeTemplate,
  StepNodeStatus,
} from "../types";
import type { WorkflowExecutionResult } from "@/server/services/browserbaseService";
import { createWorkflowFromBlueprint } from "../defaultFlows";

export function useWorkflowManager() {
  const [localWorkflows, setLocalWorkflows] = useState<WorkflowBlueprint[] | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // tRPC Queries & Mutations
  const utils = trpc.useContext();
  const { data: currentUser } = trpc.auth.me.useQuery(undefined, {
    staleTime: 60 * 1000,
  });
  const { data: serverWorkflows } = trpc.workflow.getAll.useQuery(undefined, {
    staleTime: 10 * 1000,
    refetchOnWindowFocus: false,
  });

  const createMutation = trpc.workflow.create.useMutation({
    onSuccess: (savedWf) => {
      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
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

  // Derived workflows: strictly uses local state if modified, else database workflows
  const workflows: WorkflowBlueprint[] =
    localWorkflows ?? ((serverWorkflows as unknown as WorkflowBlueprint[]) ?? []);

  const activeWorkflow: WorkflowBlueprint | null =
    (activeWorkflowId ? workflows.find((w) => w.id === activeWorkflowId) : null) ||
    workflows[0] ||
    null;

  const selectWorkflow = useCallback((id: string) => {
    setActiveWorkflowId(id);
    setSelectedNode(null);
  }, []);

  const createWorkflow = useCallback(
    (params: {
      name: string;
      description: string;
      category: string;
      targetUrl?: string;
      aiModel?: string;
      sandboxEnv?: string;
    }) => {
      const newWf = createWorkflowFromBlueprint(params);
      newWf.aiModel = params.aiModel || "Gemini 2.5 Pro Vision";
      newWf.sandboxEnv = params.sandboxEnv || "Chromium 128 (CDP Sandbox)";

      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return [newWf, ...base];
      });
      setActiveWorkflowId(newWf.id);
      setSelectedNode(null);

      createMutation.mutate({
        name: newWf.name,
        description: newWf.description,
        category: newWf.category,
        targetUrl: newWf.targetUrl || "",
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
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return base.filter((w) => w.id !== id);
      });
      deleteMutation.mutate({ id });
    },
    [deleteMutation, serverWorkflows]
  );

  const addNode = useCallback(
    (template: NodeTemplate, customData?: Partial<WorkflowNodeData>) => {
      if (!activeWorkflow) return;
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
          logLines: customData?.logLines || template.defaultLogs || [],
          archetype: template.archetype,
          emailProvider:
            customData?.emailProvider ||
            template.emailProvider ||
            (template.archetype === 'email'
              ? template.defaultMetrics?.find((m) => m.label.toLowerCase() === 'provider')?.value.toLowerCase().includes('nodemailer')
                ? 'nodemailer'
                : 'resend'
              : undefined),
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
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
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
      if (!activeWorkflow) return;

      const updatedNodes = activeWorkflow.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            ...updatedData,
          },
        };
      });

      const updatedSelectedNode = updatedNodes.find((n) => n.id === nodeId) || null;
      if (updatedSelectedNode) {
        setSelectedNode(updatedSelectedNode);
      }

      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return base.map((wf) =>
          wf.id === activeWorkflow.id ? { ...wf, nodes: updatedNodes } : wf
        );
      });

      updateMutation.mutate({
        id: activeWorkflow.id,
        nodes: updatedNodes,
        edges: activeWorkflow.edges,
      });
    },
    [activeWorkflow, updateMutation, serverWorkflows]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (!activeWorkflow) return;

      const updatedNodes = activeWorkflow.nodes
        .filter((node) => node.id !== nodeId)
        .map((node, index) => ({
          ...node,
          data: {
            ...node.data,
            stepNumber: index + 1,
          },
        }));

      const updatedEdges = activeWorkflow.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );

      setSelectedNode(null);

      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return base.map((wf) =>
          wf.id === activeWorkflow.id ? { ...wf, nodes: updatedNodes, edges: updatedEdges } : wf
        );
      });

      updateMutation.mutate({
        id: activeWorkflow.id,
        nodes: updatedNodes,
        edges: updatedEdges,
      });
    },
    [activeWorkflow, updateMutation, serverWorkflows]
  );

  const updateWorkflowDetails = useCallback(
    async (details: {
      name?: string;
      description?: string;
      category?: string;
      targetUrl?: string;
      aiModel?: string;
      sandboxEnv?: string;
      updateNodeUrls?: boolean;
    }) => {
      if (!activeWorkflow) return;

      const oldTargetUrl = activeWorkflow.targetUrl;
      let updatedNodes = activeWorkflow.nodes;

      if (details.targetUrl && details.updateNodeUrls) {
        updatedNodes = activeWorkflow.nodes.map((node) => {
          if (
            node.data.url === oldTargetUrl ||
            !node.data.url ||
            node.data.url === "https://example.com"
          ) {
            return {
              ...node,
              data: {
                ...node.data,
                url: details.targetUrl!,
              },
            };
          }
          return node;
        });
      }

      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return base.map((wf) => {
          if (wf.id !== activeWorkflow.id) return wf;
          return {
            ...wf,
            name: details.name !== undefined ? details.name : wf.name,
            description: details.description !== undefined ? details.description : wf.description,
            category: details.category !== undefined ? details.category : wf.category,
            targetUrl: details.targetUrl !== undefined ? details.targetUrl : wf.targetUrl,
            aiModel: details.aiModel !== undefined ? details.aiModel : wf.aiModel,
            sandboxEnv: details.sandboxEnv !== undefined ? details.sandboxEnv : wf.sandboxEnv,
            nodes: updatedNodes,
          };
        });
      });

      await updateMutation.mutateAsync({
        id: activeWorkflow.id,
        name: details.name,
        description: details.description,
        category: details.category,
        targetUrl: details.targetUrl,
        aiModel: details.aiModel,
        sandboxEnv: details.sandboxEnv,
        ...(details.updateNodeUrls ? { nodes: updatedNodes } : {}),
      });

      await utils.workflow.getAll.invalidate();
    },
    [activeWorkflow, updateMutation, serverWorkflows, utils]
  );

  const updateGraph = useCallback(
    (newNodes: WorkflowNodeType[], newEdges: Edge[]) => {
      const targetId = activeWorkflow?.id;
      if (!targetId) return;
      setLocalWorkflows((prev) => {
        const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return base.map((wf) => {
          if (wf.id !== targetId) return wf;
          return {
            ...wf,
            nodes: newNodes,
            edges: newEdges,
          };
        });
      });
    },
    [activeWorkflow?.id, serverWorkflows]
  );

  const saveWorkflow = useCallback(
    async (overrideNodes?: WorkflowNodeType[], overrideEdges?: Edge[]) => {
      if (!activeWorkflow) return;
      const nodesToSave = overrideNodes ?? activeWorkflow.nodes;
      const edgesToSave = overrideEdges ?? activeWorkflow.edges;

      setSaveStatus("saving");

      try {
        await updateMutation.mutateAsync({
          id: activeWorkflow.id,
          nodes: nodesToSave,
          edges: edgesToSave,
        });

        setLocalWorkflows((prev) => {
          const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
          return base.map((wf) => {
            if (wf.id !== activeWorkflow.id) return wf;
            return {
              ...wf,
              nodes: nodesToSave,
              edges: edgesToSave,
            };
          });
        });

        await utils.workflow.getAll.invalidate();
        setSaveStatus("saved");
        setLastSavedAt(new Date());

        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      } catch (err) {
        console.error("Failed to save workflow:", err);
        setSaveStatus("error");
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      }
    },
    [activeWorkflow, updateMutation, serverWorkflows, utils]
  );

  const startExecutionMutation = trpc.execution.startExecution.useMutation({
    onSuccess: (data) => {
      setIsRunning(false);
      if ("result" in data && data.result) {
        const result = data.result as WorkflowExecutionResult;
        setExecutionResult(result);
        setLocalWorkflows((prev) => {
          const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
          return base.map((wf) => {
            if (wf.id !== activeWorkflow?.id) return wf;
            const updatedNodes = wf.nodes.map((node) => {
              const stepRes = result.steps.find((s) => s.stepId === node.id);
              if (stepRes) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    status: (stepRes.status === "completed" ? "completed" : "failed") as StepNodeStatus,
                    logLines: [...(node.data.logLines || []), ...stepRes.logs],
                  },
                };
              }
              return node;
            });
            return {
              ...wf,
              nodes: updatedNodes,
              status: (result.status as "idle" | "running" | "completed" | "paused") || "completed",
            };
          });
        });
      }
    },
    onError: (err) => {
      setIsRunning(false);
      setExecutionError(err.message);
      console.error("[useWorkflowManager] Execution error:", err.message);
    },
  });

  const runPipeline = useCallback(async () => {
    if (!activeWorkflow || isRunning) return;
    if (activeWorkflow.nodes.length === 0) {
      setExecutionError("Workflow has no step nodes to execute. Please add at least one node to run.");
      return;
    }

    setIsRunning(true);
    setExecutionError(null);
    setExecutionResult(null);

    // Immediate UI feedback: mark first step as running
    setLocalWorkflows((prev) => {
      const base = prev ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
      return base.map((wf) => {
        if (wf.id !== activeWorkflow.id) return wf;
        const updatedNodes = wf.nodes.map((node, i) => ({
          ...node,
          data: {
            ...node.data,
            status: (i === 0 ? "running" : "idle") as StepNodeStatus,
          },
        }));
        return { ...wf, nodes: updatedNodes, status: "running" as const };
      });
    });

    try {
      await startExecutionMutation.mutateAsync({
        workflowId: activeWorkflow.id,
        workflowName: activeWorkflow.name,
        targetUrl: activeWorkflow.targetUrl,
        aiModel: activeWorkflow.aiModel,
        userEmail: currentUser?.email,
        nodes: activeWorkflow.nodes.map((node) => ({
          id: node.id,
          data: {
            stepNumber: node.data.stepNumber,
            title: node.data.title,
            category: node.data.category,
            badge: node.data.badge,
            description: node.data.description,
            actionSummary: node.data.actionSummary,
            url: node.data.url,
            archetype: node.data.archetype,
          },
        })),
      });
    } catch (err) {
      console.error("Workflow execution failed:", err);
      setIsRunning(false);
    }
  }, [activeWorkflow, isRunning, currentUser, startExecutionMutation, serverWorkflows]);

  return {
    workflows,
    activeWorkflow,
    activeWorkflowId,
    selectedNode,
    isRunning: isRunning || startExecutionMutation.isPending,
    isSyncing: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    saveWorkflow,
    updateGraph,
    saveStatus,
    lastSavedAt,
    isSaving: saveStatus === "saving" || updateMutation.isPending,
    selectWorkflow,
    createWorkflow,
    deleteWorkflow,
    addNode,
    updateNode,
    deleteNode,
    updateWorkflowDetails,
    setSelectedNode,
    runPipeline,
    executionResult,
    executionError,
    setExecutionError,
    isAdmin: currentUser?.role === "admin",
    currentUser,
    clearExecutionError: () => setExecutionError(null),
  };
}
