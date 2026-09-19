"use client";

import React, { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type NodeTypes,
  type Node,
  type DefaultEdgeOptions,
  type FitViewOptions,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowNode } from "./WorkflowNode";
import type { WorkflowNodeType } from "./types";

// Must be defined outside component to prevent React Flow re-mounting all nodes on every render
const NODE_TYPES: NodeTypes = {
  workflowStep: WorkflowNode,
};

const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  animated: true,
  style: { stroke: "#71717a", strokeWidth: 2 },
};

const FIT_VIEW_OPTIONS: FitViewOptions = {
  padding: 0.25,
};

interface WorkflowCanvasProps {
  workflowId: string;
  initialNodes: WorkflowNodeType[];
  initialEdges: any[];
  onSelectNode: (node: WorkflowNodeType | null) => void;
  selectedNodeId?: string;
}

export function WorkflowCanvas({
  workflowId,
  initialNodes,
  initialEdges,
  onSelectNode,
  selectedNodeId,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes only when initialNodes length or workflow changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [workflowId, initialNodes.length, setNodes]);

  // Sync edge changes if new edge added
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [workflowId, initialEdges.length, setEdges]);

  // Handle connection
  const onConnect: OnConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node as WorkflowNodeType);
    },
    [onSelectNode]
  );

  const handlePaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  return (
    <div className="relative h-[560px] w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/50 overflow-hidden shadow-xs">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={0.4}
        maxZoom={1.6}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      >
        {/* Grid View Background - clean, performant line grid */}
        <Background
          variant={BackgroundVariant.Lines}
          gap={32}
          size={1}
          color="#e4e4e7"
          className="bg-zinc-50/80"
        />

        {/* Interactive Controls */}
        <Controls
          className="!rounded-xl !border !border-zinc-200/80 !bg-white !shadow-sm !p-1 overflow-hidden [&>button]:!border-zinc-100 [&>button]:!text-zinc-600 hover:[&>button]:!bg-zinc-50"
          showInteractive={false}
        />

        {/* MiniMap */}
        <MiniMap
          nodeStrokeWidth={2}
          nodeColor={(n) => {
            if (n.data?.status === "running") return "#10b981";
            if (n.data?.status === "completed") return "#71717a";
            return "#e4e4e7";
          }}
          className="!rounded-xl !border !border-zinc-200/80 !bg-white/95 !shadow-sm overflow-hidden"
          maskColor="rgba(244, 244, 245, 0.7)"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Floating Canvas Helper Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-xs text-zinc-600 shadow-2xs">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-zinc-800">Grid Canvas:</span>
        <span>Drag nodes, zoom or click step to inspect</span>
      </div>
    </div>
  );
}
