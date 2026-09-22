'use client';

import React, { useCallback, useRef, useState } from 'react';
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
  type Edge,
  type DefaultEdgeOptions,
  type FitViewOptions,
  type ReactFlowInstance,
  type EdgeChange,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowNode } from './WorkflowNode';
import type { WorkflowNodeType, NodeTemplate } from './types';

// Must be defined outside component to prevent React Flow re-mounting all nodes on every render
const NODE_TYPES: NodeTypes = {
  workflowStep: WorkflowNode,
};

const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  animated: true,
  style: { stroke: '#71717a', strokeWidth: 2 },
};

const FIT_VIEW_OPTIONS: FitViewOptions = {
  padding: 0.25,
};

interface WorkflowCanvasProps {
  workflowId: string;
  initialNodes: WorkflowNodeType[];
  initialEdges: Edge[];
  onSelectNode: (node: WorkflowNodeType | null) => void;
  onSaveWorkflow?: (nodes: WorkflowNodeType[], edges: Edge[]) => void;
  onGraphChange?: (nodes: WorkflowNodeType[], edges: Edge[]) => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt?: Date | null;
  externalNodeUpdate?: { id: string; data: Partial<WorkflowNodeType['data']> } | null;
  externalNodesUpdates?: Array<{ id: string; data: Partial<WorkflowNodeType['data']> }> | null;
}

export function WorkflowCanvas({
  workflowId,
  initialNodes,
  initialEdges,
  onSelectNode,
  onSaveWorkflow,
  onGraphChange,
  isSaving = false,
  saveStatus = 'idle',
  lastSavedAt = null,
  externalNodeUpdate = null,
  externalNodesUpdates = null,
}: WorkflowCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
    WorkflowNodeType,
    Edge
  > | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const prevNodesLengthRef = useRef(initialNodes.length);
  const prevWfIdRef = useRef(workflowId);

  // Sync single external node update
  React.useEffect(() => {
    if (!externalNodeUpdate) return;
    setNodes((currentNodes) =>
      currentNodes.map((cn) => {
        if (cn.id !== externalNodeUpdate.id) return cn;
        return {
          ...cn,
          data: { ...cn.data, ...externalNodeUpdate.data },
        };
      })
    );
  }, [externalNodeUpdate, setNodes]);

  // Sync batch external nodes updates
  React.useEffect(() => {
    if (!externalNodesUpdates || externalNodesUpdates.length === 0) return;
    setNodes((currentNodes) =>
      currentNodes.map((cn) => {
        const update = externalNodesUpdates.find((u) => u.id === cn.id);
        if (!update) return cn;
        return {
          ...cn,
          data: { ...cn.data, ...update.data },
        };
      })
    );
  }, [externalNodesUpdates, setNodes]);

  // Sync nodes when workflow changes, node count changes, or node data updates
  React.useEffect(() => {
    setNodes((currentNodes) => {
      // If workflow changed or length changed, reset completely
      if (
        prevWfIdRef.current !== workflowId ||
        currentNodes.length !== initialNodes.length
      ) {
        prevWfIdRef.current = workflowId;
        prevNodesLengthRef.current = initialNodes.length;
        return initialNodes;
      }

      // If data updated (like actionSummary, title, status), merge updated data into currentNodes
      // while preserving current dragging coordinates
      return currentNodes.map((cn) => {
        const matching = initialNodes.find((inNode) => inNode.id === cn.id);
        if (!matching) return cn;
        return {
          ...cn,
          data: { ...cn.data, ...matching.data },
        };
      });
    });
    setEdges(initialEdges);
  }, [workflowId, initialNodes, initialEdges, setNodes, setEdges]);

  // Handle connection
  const onConnect: OnConnect = useCallback(
    (params) => {
      const nextEdges = addEdge(
        {
          ...params,
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 2 },
        },
        edges,
      );
      setEdges(nextEdges);
      onGraphChange?.(nodes as WorkflowNodeType[], nextEdges);
    },
    [edges, nodes, onGraphChange, setEdges],
  );

  // Handle node drag stop - notifies parent of new node positions
  const handleNodeDragStop = useCallback(() => {
    onGraphChange?.(nodes as WorkflowNodeType[], edges);
  }, [nodes, edges, onGraphChange]);

  // Handle edge deletions
  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      onEdgesChange(changes);
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        const nextEdges = applyEdgeChanges(changes, edges);
        onGraphChange?.(nodes as WorkflowNodeType[], nextEdges);
      }
    },
    [nodes, edges, onEdgesChange, onGraphChange],
  );

  // HTML5 Drag and Drop handlers from NodePalette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/agentbrowse-node');
      if (!raw) return;

      try {
        const template: NodeTemplate = JSON.parse(raw);
        let position = { x: 200, y: 140 };

        if (rfInstance) {
          position = rfInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
        } else if (wrapperRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect();
          position = {
            x: event.clientX - rect.left - 100,
            y: event.clientY - rect.top - 40,
          };
        }

        const stepNumber = nodes.length + 1;
        const nodeId = `node-${Date.now()}`;
        const newNode: WorkflowNodeType = {
          id: nodeId,
          type: 'workflowStep',
          position,
          data: {
            stepNumber,
            title: template.title,
            category: template.category,
            badge: template.badge,
            description: template.description,
            actionSummary: template.actionSummary,
            url: '',
            status: 'idle',
            metrics: template.defaultMetrics,
            logLines: template.defaultLogs || [],
            archetype: template.archetype,
            emailProvider:
              template.emailProvider ||
              (template.archetype === 'email'
                ? template.defaultMetrics
                    ?.find((m) => m.label.toLowerCase() === 'provider')
                    ?.value.toLowerCase()
                    .includes('nodemailer')
                  ? 'nodemailer'
                  : 'resend'
                : undefined),
            timeoutMs: 5000,
            isPremium: template.isPremium ?? false,
          },
        };

        const updatedNodes = [...nodes, newNode];
        setNodes(updatedNodes);
        prevNodesLengthRef.current = updatedNodes.length;
        onSelectNode(newNode);
        onGraphChange?.(updatedNodes as WorkflowNodeType[], edges);
      } catch (err) {
        console.error('Failed to parse dropped template:', err);
      }
    },
    [nodes, edges, rfInstance, onSelectNode, onGraphChange, setNodes],
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node as WorkflowNodeType);
    },
    [onSelectNode],
  );

  const handlePaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  return (
    <div
      ref={wrapperRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="relative h-[calc(100vh-190px)] min-h-[570px] w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/50 overflow-hidden shadow-xs"
    >
      <ReactFlow<WorkflowNodeType, Edge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onInit={setRfInstance}
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
            if (n.data?.status === 'running') return '#10b981';
            if (n.data?.status === 'completed') return '#71717a';
            return '#e4e4e7';
          }}
          className="!rounded-xl !border !border-zinc-200/80 !bg-white/95 !shadow-sm overflow-hidden"
          maskColor="rgba(244, 244, 245, 0.7)"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Floating Canvas Helper Badge (Top-Left) */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/90 backdrop-blur-xs px-3 py-1 text-xs text-zinc-600 shadow-2xs max-w-[calc(100%-200px)]">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="font-semibold text-zinc-800 shrink-0">
          Interactive Canvas:
        </span>
        <span className="truncate hidden xl:inline">
          Drag nodes to position, connect handles, or drag from palette
        </span>
        <span className="truncate inline xl:hidden">Drag & connect nodes</span>
      </div>

      {/* Floating Canvas Save & Status Badge (Top-Right) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {lastSavedAt && (
          <span className="hidden md:inline rounded-lg bg-white/80 backdrop-blur-xs border border-zinc-200/80 px-2 py-1 text-[10px] font-mono text-zinc-500">
            Saved {lastSavedAt.toLocaleTimeString()}
          </span>
        )}

        <button
          type="button"
          onClick={() => onSaveWorkflow?.(nodes as WorkflowNodeType[], edges)}
          disabled={isSaving}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer ${
            saveStatus === 'saved'
              ? 'bg-emerald-600 text-white'
              : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-98'
          } disabled:opacity-60`}
          title="Save current nodes and edges to PostgreSQL workflow table"
        >
          {isSaving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Saving...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <span className="text-emerald-200">✓</span>
              <span>Saved to DB!</span>
            </>
          ) : saveStatus === 'error' ? (
            <>
              <span>✕</span>
              <span>Failed to Save</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Save Workflow</span>
            </>
          )}
        </button>
      </div>

      {/* Node and Edge Counter Pill (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-mono text-zinc-600 shadow-2xs">
        <span className="font-semibold text-zinc-800">{nodes.length}</span>{' '}
        nodes
        <span>•</span>
        <span className="font-semibold text-zinc-800">{edges.length}</span>{' '}
        edges
      </div>
    </div>
  );
}
