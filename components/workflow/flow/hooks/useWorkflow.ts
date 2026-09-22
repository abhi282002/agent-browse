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
import { createWorkflowFromBlueprint } from "../defaultFlows";

export function useWorkflow() {
  const [localWorkflows, setLocalWorkflows] = useState<WorkflowBlueprint[] | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

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
    onSuccess: (savedWorkflow) => {
      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return baseWorkflows.map((workflowItem) =>
          workflowItem.name === savedWorkflow.name ? (savedWorkflow as unknown as WorkflowBlueprint) : workflowItem
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
    (activeWorkflowId ? workflows.find((workflow) => workflow.id === activeWorkflowId) : null) ||
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
      const newWorkflow = createWorkflowFromBlueprint(params);
      newWorkflow.aiModel = params.aiModel || "Gemini 2.5 Pro Vision";
      newWorkflow.sandboxEnv = params.sandboxEnv || "Chromium 128 (CDP Sandbox)";

      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return [newWorkflow, ...baseWorkflows];
      });
      setActiveWorkflowId(newWorkflow.id);
      setSelectedNode(null);

      createMutation.mutate({
        name: newWorkflow.name,
        description: newWorkflow.description,
        category: newWorkflow.category,
        targetUrl: newWorkflow.targetUrl || "",
        aiModel: newWorkflow.aiModel,
        sandboxEnv: newWorkflow.sandboxEnv,
        nodes: newWorkflow.nodes,
        edges: newWorkflow.edges,
        status: newWorkflow.status,
      });

      return newWorkflow;
    },
    [createMutation, serverWorkflows]
  );

  const deleteWorkflow = useCallback(
    (id: string) => {
      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return baseWorkflows.filter((workflow) => workflow.id !== id);
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
              ? template.defaultMetrics?.find((metric) => metric.label.toLowerCase() === 'provider')?.value.toLowerCase().includes('nodemailer')
                ? 'nodemailer'
                : 'resend'
              : undefined),
          selector: customData?.selector,
          payload: customData?.payload,
          authEmail: customData?.authEmail,
          authPassword: customData?.authPassword,
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

      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return baseWorkflows.map((workflow) => {
          if (workflow.id !== activeWorkflow.id) return workflow;
          return {
            ...workflow,
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

      const updatedSelectedNode = updatedNodes.find((node) => node.id === nodeId) || null;
      if (updatedSelectedNode) {
        setSelectedNode(updatedSelectedNode);
      }

      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return baseWorkflows.map((workflow) =>
          workflow.id === activeWorkflow.id ? { ...workflow, nodes: updatedNodes } : workflow
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

      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return baseWorkflows.map((workflow) =>
          workflow.id === activeWorkflow.id ? { ...workflow, nodes: updatedNodes, edges: updatedEdges } : workflow
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

      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return baseWorkflows.map((workflow) => {
          if (workflow.id !== activeWorkflow.id) return workflow;
          return {
            ...workflow,
            name: details.name !== undefined ? details.name : workflow.name,
            description: details.description !== undefined ? details.description : workflow.description,
            category: details.category !== undefined ? details.category : workflow.category,
            targetUrl: details.targetUrl !== undefined ? details.targetUrl : workflow.targetUrl,
            aiModel: details.aiModel !== undefined ? details.aiModel : workflow.aiModel,
            sandboxEnv: details.sandboxEnv !== undefined ? details.sandboxEnv : workflow.sandboxEnv,
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
      setLocalWorkflows((previousWorkflows) => {
        const baseWorkflows = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
        return baseWorkflows.map((workflow) => {
          if (workflow.id !== targetId) return workflow;
          return {
            ...workflow,
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
      // Sanitize nodes before persisting to DB: persistent blueprint should never have transient status: "running"
      const nodesToSave = (overrideNodes ?? activeWorkflow.nodes).map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: (node.data.status === "running" ? "idle" : node.data.status) as StepNodeStatus,
        },
      }));
      const edgesToSave = overrideEdges ?? activeWorkflow.edges;

      setSaveStatus("saving");

      try {
        await updateMutation.mutateAsync({
          id: activeWorkflow.id,
          nodes: nodesToSave,
          edges: edgesToSave,
        });

        setLocalWorkflows((previousWorkflows) => {
          const baseWorkflows = previousWorkflows ?? (serverWorkflows as unknown as WorkflowBlueprint[]) ?? [];
          return baseWorkflows.map((workflow) => {
            if (workflow.id !== activeWorkflow.id) return workflow;
            return {
              ...workflow,
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
      } catch (error) {
        console.error("Failed to save workflow:", error);
        setSaveStatus("error");
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      }
    },
    [activeWorkflow, updateMutation, serverWorkflows, utils]
  );

  return {
    workflows,
    activeWorkflow,
    activeWorkflowId,
    selectedNode,
    setSelectedNode,
    selectWorkflow,
    createWorkflow,
    deleteWorkflow,
    addNode,
    updateNode,
    deleteNode,
    updateWorkflowDetails,
    updateGraph,
    saveWorkflow,
    saveStatus,
    lastSavedAt,
    isSaving: saveStatus === "saving" || updateMutation.isPending,
    isSyncing: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    isAdmin: currentUser?.role === "admin",
    currentUser,
    localWorkflows,
    setLocalWorkflows,
    serverWorkflows,
  };
}
