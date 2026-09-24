'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { Edge } from '@xyflow/react';
import type { WorkflowNodeType, NodeTemplate } from '../../types';

interface UseCollaborativeCanvasEffectsParams {
  externalNodeUpdate: { id: string; data: Partial<WorkflowNodeType['data']> } | null;
  externalNodesUpdates: Array<{ id: string; data: Partial<WorkflowNodeType['data']> }> | null;
  externalNodeAdd: { template: NodeTemplate; customData?: Partial<WorkflowNodeType['data']> } | null;
  externalNodeDeleteId: string | null;
  nodesRef: RefObject<WorkflowNodeType[] | null>;
  edgesRef: RefObject<Edge[] | null>;
  onNodesChange: (changes: any[]) => void;
  onConnect: (connection: { source: string; target: string; sourceHandle: null; targetHandle: null }) => void;
  onDelete: (params: { nodes: WorkflowNodeType[]; edges: Edge[] }) => void;
  onSelectNode: (node: WorkflowNodeType | null) => void;
}

export function useCollaborativeCanvasEffects({
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
}: UseCollaborativeCanvasEffectsParams) {
  const prevExternalUpdateRef = useRef(externalNodeUpdate);
  const prevExternalBatchRef = useRef(externalNodesUpdates);
  const prevExternalAddRef = useRef(externalNodeAdd);
  const prevExternalDeleteRef = useRef(externalNodeDeleteId);

  // Handle external single node update (e.g. from NodeConfigDrawer)
  useEffect(() => {
    if (!externalNodeUpdate) return;
    if (prevExternalUpdateRef.current === externalNodeUpdate) return;
    prevExternalUpdateRef.current = externalNodeUpdate;

    const currentNodes = nodesRef.current;
    if (!currentNodes) return;

    const existingNode = currentNodes.find((node) => node.id === externalNodeUpdate.id);
    if (!existingNode) return;

    const updatedNode: WorkflowNodeType = {
      ...existingNode,
      data: { ...existingNode.data, ...externalNodeUpdate.data },
    };

    onNodesChange([{ type: 'replace', id: updatedNode.id, item: updatedNode }]);
  }, [externalNodeUpdate, onNodesChange, nodesRef]);

  // Handle batch external node updates (e.g. from execution engine step progress)
  useEffect(() => {
    if (!externalNodesUpdates || externalNodesUpdates.length === 0) return;
    if (prevExternalBatchRef.current === externalNodesUpdates) return;
    prevExternalBatchRef.current = externalNodesUpdates;

    const currentNodes = nodesRef.current;
    if (!currentNodes) return;

    const changes = externalNodesUpdates
      .map((update) => {
        const existingNode = currentNodes.find((node) => node.id === update.id);
        if (!existingNode) return null;
        return {
          type: 'replace' as const,
          id: existingNode.id,
          item: { ...existingNode, data: { ...existingNode.data, ...update.data } },
        };
      })
      .filter(Boolean);

    if (changes.length > 0) {
      onNodesChange(changes as any);
    }
  }, [externalNodesUpdates, onNodesChange, nodesRef]);

  // Handle external node add (e.g. from NodeCatalogModal or palette button)
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
                ?.find((metric: { label: string; value: string }) => metric.label.toLowerCase() === 'provider')
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
  }, [externalNodeAdd, onNodesChange, onConnect, onSelectNode, nodesRef]);

  // Handle external node deletion
  useEffect(() => {
    if (!externalNodeDeleteId) return;
    if (prevExternalDeleteRef.current === externalNodeDeleteId) return;
    prevExternalDeleteRef.current = externalNodeDeleteId;

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    if (!currentNodes || !currentEdges) return;

    const targetNode = currentNodes.find((node) => node.id === externalNodeDeleteId);
    if (!targetNode) return;

    const attachedEdges = currentEdges.filter(
      (edge) => edge.source === externalNodeDeleteId || edge.target === externalNodeDeleteId,
    );

    onDelete({ nodes: [targetNode], edges: attachedEdges });
    onSelectNode(null);
  }, [externalNodeDeleteId, onDelete, onSelectNode, nodesRef, edgesRef]);
}
