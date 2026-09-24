'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type Edge,
  type FitViewOptions,
  type DefaultEdgeOptions,
  type ReactFlowInstance,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '@liveblocks/react-ui/styles.css';
import '@liveblocks/react-flow/styles.css';

import { useLiveblocksFlow, Cursors } from '@liveblocks/react-flow';
import { WorkflowNode } from '../WorkflowNode';
import type { WorkflowNodeType, NodeTemplate } from '../types';
import { useCollaborativeCanvasEffects } from './hooks/useCollaborativeCanvasEffects';
import { useCanvasDropHandler } from './hooks/useCanvasDropHandler';
import { CanvasLoadingState } from './CanvasLoadingState';
import { CanvasStatusBar } from './CanvasStatusBar';

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
  externalNodeUpdate?: {
    id: string;
    data: Partial<WorkflowNodeType['data']>;
  } | null;
  externalNodesUpdates?: Array<{
    id: string;
    data: Partial<WorkflowNodeType['data']>;
  }> | null;
  externalNodeAdd?: {
    template: NodeTemplate;
    customData?: Partial<WorkflowNodeType['data']>;
  } | null;
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

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
    isLoading,
  } = useLiveblocksFlow<WorkflowNodeType, Edge>({
    nodes: { initial: initialNodes },
    edges: { initial: initialEdges },
  });

  // Stable refs to avoid stale closures in effects
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // Handle external state synchronisation (config drawer, execution engine, palette adds, deletes)
  useCollaborativeCanvasEffects({
    externalNodeUpdate,
    externalNodesUpdates,
    externalNodeAdd,
    externalNodeDeleteId,
    nodesRef,
    edgesRef,
    onNodesChange,
    onConnect,
    onDelete,
    onSelectNode,
  });

  const { onDragOver, onDrop } = useCanvasDropHandler({
    nodes,
    rfInstance,
    wrapperRef,
    onNodesChange,
    onSelectNode,
  });

  const handleNodeDragStop = useCallback(() => {
    if (nodesRef.current && edgesRef.current) {
      onGraphChange?.(nodesRef.current as WorkflowNodeType[], edgesRef.current);
    }
  }, [onGraphChange]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node as WorkflowNodeType);
    },
    [onSelectNode],
  );

  const handlePaneClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  if (isLoading) {
    return <CanvasLoadingState workflowId={workflowId} />;
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

      <CanvasStatusBar
        isSaving={isSaving}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        nodes={nodes}
        edges={edges}
        onSaveWorkflow={onSaveWorkflow}
      />
    </div>
  );
}
