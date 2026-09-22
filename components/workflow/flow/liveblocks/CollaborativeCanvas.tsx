'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type OnConnect,
  type NodeTypes,
  type Node,
  type Edge,
  type DefaultEdgeOptions,
  type FitViewOptions,
  type ReactFlowInstance,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '@liveblocks/react-ui/styles.css';
import '@liveblocks/react-flow/styles.css';

import { useLiveblocksFlow, Cursors } from '@liveblocks/react-flow';
import { WorkflowNode } from '../WorkflowNode';
import type { WorkflowNodeType, NodeTemplate } from '../types';
import { BotIcon, SparklesIcon } from '@/components/ui/icons';
import { CollaboratorAvatars } from './CollaboratorAvatars';

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

export interface CollaborativeCanvasProps {
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
  externalNodeAdd?: { template: NodeTemplate; customData?: Partial<WorkflowNodeType['data']> } | null;
  externalNodeDeleteId?: string | null;
}

export function CollaborativeCanvas({
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
  externalNodeAdd = null,
  externalNodeDeleteId = null,
}: CollaborativeCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
    WorkflowNodeType,
    Edge
  > | null>(null);

  // Connect to Liveblocks Flow using the room storage
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
    isLoading,
  } = useLiveblocksFlow<WorkflowNodeType, Edge>({
    nodes: {
      initial: initialNodes,
    },
    edges: {
      initial: initialEdges,
    },
  });

  // Stable refs for latest nodes and edges to avoid dependency cycles in effects
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // Track previous external props to prevent repeated dispatches
  const prevExternalUpdateRef = useRef(externalNodeUpdate);
  const prevExternalAddRef = useRef(externalNodeAdd);
  const prevExternalDeleteRef = useRef(externalNodeDeleteId);

  // Handle node drag stop - notifies parent of new node positions only on user interaction
  const handleNodeDragStop = useCallback(() => {
    if (nodesRef.current && edgesRef.current) {
      onGraphChange?.(nodesRef.current as WorkflowNodeType[], edgesRef.current);
    }
  }, [onGraphChange]);

  // Handle external node updates (e.g. from NodeConfigDrawer)
  useEffect(() => {
    if (!externalNodeUpdate) return;
    if (prevExternalUpdateRef.current === externalNodeUpdate) return;
    prevExternalUpdateRef.current = externalNodeUpdate;

    const currentNodes = nodesRef.current;
    if (!currentNodes) return;

    const existingNode = currentNodes.find((n) => n.id === externalNodeUpdate.id);
    if (!existingNode) return;

    const updatedNode: WorkflowNodeType = {
      ...existingNode,
      data: {
        ...existingNode.data,
        ...externalNodeUpdate.data,
      },
    };

    onNodesChange([{ type: 'replace', id: updatedNode.id, item: updatedNode }]);
  }, [externalNodeUpdate, onNodesChange]);

  // Handle batch external node updates (e.g. from execution engine step progress)
  const prevExternalBatchRef = useRef(externalNodesUpdates);
  useEffect(() => {
    if (!externalNodesUpdates || externalNodesUpdates.length === 0) return;
    if (prevExternalBatchRef.current === externalNodesUpdates) return;
    prevExternalBatchRef.current = externalNodesUpdates;

    const currentNodes = nodesRef.current;
    if (!currentNodes) return;

    const changes = externalNodesUpdates
      .map((update) => {
        const existingNode = currentNodes.find((n) => n.id === update.id);
        if (!existingNode) return null;
        return {
          type: 'replace' as const,
          id: existingNode.id,
          item: {
            ...existingNode,
            data: {
              ...existingNode.data,
              ...update.data,
            },
          },
        };
      })
      .filter(Boolean);

    if (changes.length > 0) {
      onNodesChange(changes as any);
    }
  }, [externalNodesUpdates, onNodesChange]);

  // Handle external node adds (e.g. from NodeCatalogModal or button)
  useEffect(() => {
    if (!externalNodeAdd) return;
    if (prevExternalAddRef.current === externalNodeAdd) return;
    prevExternalAddRef.current = externalNodeAdd;

    const currentNodes = nodesRef.current || [];
    const { template, customData } = externalNodeAdd;
    const stepNumber = currentNodes.length + 1;
    const lastNode = currentNodes[currentNodes.length - 1];
    const newX = lastNode ? lastNode.position.x + 310 : 60;
    const newY = lastNode ? 120 + (stepNumber % 2 === 0 ? 30 : 0) : 120;
    const nodeId = `node-${Date.now()}`;

    const newNode: WorkflowNodeType = {
      id: nodeId,
      type: 'workflowStep',
      position: { x: newX, y: newY },
      data: {
        stepNumber,
        title: customData?.title || template.title,
        category: customData?.category || template.category,
        badge: customData?.badge || template.badge,
        description: customData?.description || template.description,
        actionSummary: customData?.actionSummary || template.actionSummary,
        url: customData?.url || 'https://example.com',
        status: 'idle',
        metrics: customData?.metrics || template.defaultMetrics,
        logLines: customData?.logLines || template.defaultLogs || [],
        archetype: template.archetype,
        emailProvider:
          customData?.emailProvider ||
          template.emailProvider ||
          (template.archetype === 'email'
            ? template.defaultMetrics
                ?.find((m) => m.label.toLowerCase() === 'provider')
                ?.value.toLowerCase()
                .includes('nodemailer')
              ? 'nodemailer'
              : 'resend'
            : undefined),
        selector: customData?.selector,
        payload: customData?.payload,
        timeoutMs: customData?.timeoutMs || 5000,
        isPremium: template.isPremium ?? false,
      },
    };

    onNodesChange([{ type: 'add', item: newNode }]);

    if (lastNode) {
      onConnect({
        source: lastNode.id,
        target: nodeId,
        sourceHandle: null,
        targetHandle: null,
      });
    }

    onSelectNode(newNode);
  }, [externalNodeAdd, onNodesChange, onConnect, onSelectNode]);

  // Handle external node deletion
  useEffect(() => {
    if (!externalNodeDeleteId) return;
    if (prevExternalDeleteRef.current === externalNodeDeleteId) return;
    prevExternalDeleteRef.current = externalNodeDeleteId;

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    if (!currentNodes || !currentEdges) return;

    const targetNode = currentNodes.find((n) => n.id === externalNodeDeleteId);
    if (!targetNode) return;

    const attachedEdges = currentEdges.filter(
      (e) => e.source === externalNodeDeleteId || e.target === externalNodeDeleteId
    );

    onDelete({
      nodes: [targetNode],
      edges: attachedEdges,
    });
    onSelectNode(null);
  }, [externalNodeDeleteId, onDelete, onSelectNode]);

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

        const stepNumber = (nodes?.length || 0) + 1;
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

        // Broadcast node addition via Liveblocks
        onNodesChange([{ type: 'add', item: newNode }]);
        onSelectNode(newNode);
      } catch (err) {
        console.error('Failed to parse dropped template:', err);
      }
    },
    [nodes, rfInstance, onSelectNode, onNodesChange]
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

  // Loading state while connecting to Liveblocks room
  if (isLoading) {
    return (
      <div className="relative h-[calc(100vh-190px)] min-h-[570px] w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/50 flex flex-col items-center justify-center gap-3 shadow-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs animate-pulse">
          <BotIcon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Syncing collaborative canvas with Liveblocks...</span>
        </div>
        <p className="text-[11px] text-zinc-400">Room: {workflowId}</p>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="relative h-[calc(100vh-190px)] min-h-[570px] w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/50 overflow-hidden shadow-xs"
    >
      <ReactFlow<WorkflowNodeType, Edge>
        nodes={nodes ?? []}
        edges={edges ?? []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={NODE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        fitViewOptions={FIT_VIEW_OPTIONS}
        onInit={setRfInstance}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        {/* Real-time Multiplayer Cursors */}
        <Cursors />

        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#d4d4d8"
        />
        <Controls
          className="bg-white! border-zinc-200! rounded-xl! shadow-xs!"
          showInteractive={false}
        />
        <MiniMap
          nodeStrokeColor="#71717a"
          nodeColor="#e4e4e7"
          maskColor="rgba(244, 244, 245, 0.7)"
          className="rounded-xl! border-zinc-200! bg-white/80! backdrop-blur-xs!"
        />
      </ReactFlow>

      {/* Floating Teammate Collaborators Panel */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="rounded-xl border border-zinc-200/90 bg-white/95 px-3 py-1.5 shadow-2xs backdrop-blur-md">
          <CollaboratorAvatars />
        </div>
      </div>

      {/* Floating Canvas Save & Multiplayer Status Bar */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        {/* Liveblocks Connected Indicator */}
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Liveblocks Multiplayer Active</span>
        </div>

        {/* Database Persistence Status Badge */}
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md transition-all shadow-2xs ${
            saveStatus === 'saving' || isSaving
              ? 'border-amber-200 bg-amber-50/90 text-amber-800'
              : saveStatus === 'saved'
                ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
                : saveStatus === 'error'
                  ? 'border-rose-200 bg-rose-50/90 text-rose-800'
                  : 'border-zinc-200/80 bg-white/90 text-zinc-600'
          }`}
        >
          {saveStatus === 'saving' || isSaving ? (
            <>
              <span className="h-2 w-2 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              <span>Saving to DB...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Saved to DB</span>
            </>
          ) : saveStatus === 'error' ? (
            <>
              <span className="text-rose-600 font-bold">✕</span>
              <span>DB Save failed</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              <span>
                {lastSavedAt
                  ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'All changes synced'}
              </span>
            </>
          )}
        </div>

        {/* Manual Save Button */}
        {onSaveWorkflow && (
          <button
            type="button"
            onClick={() =>
              nodes && edges && onSaveWorkflow(nodes as WorkflowNodeType[], edges)
            }
            disabled={isSaving || saveStatus === 'saving'}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-700 shadow-2xs backdrop-blur-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-60"
            title="Persist flow changes to PostgreSQL database"
          >
            <SparklesIcon className="h-3 w-3 text-emerald-500" />
            <span>Save to DB</span>
          </button>
        )}
      </div>
    </div>
  );
}
