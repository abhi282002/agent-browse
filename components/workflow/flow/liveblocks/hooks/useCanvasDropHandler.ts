'use client';

import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { ReactFlowInstance } from '@xyflow/react';
import type { Edge } from '@xyflow/react';
import type { WorkflowNodeType, NodeTemplate } from '../../types';

interface UseCanvasDropHandlerParams {
  nodes: WorkflowNodeType[] | null | undefined;
  rfInstance: ReactFlowInstance<WorkflowNodeType, Edge> | null;
  wrapperRef: RefObject<HTMLDivElement | null>;
  onNodesChange: (changes: any[]) => void;
  onSelectNode: (node: WorkflowNodeType | null) => void;
}

export function useCanvasDropHandler({
  nodes,
  rfInstance,
  wrapperRef,
  onNodesChange,
  onSelectNode,
}: UseCanvasDropHandlerParams) {
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
                    ?.find((metric: { label: string; value: string }) => metric.label.toLowerCase() === 'provider')
                    ?.value.toLowerCase()
                    .includes('nodemailer')
                  ? 'nodemailer'
                  : 'resend'
                : undefined),
            timeoutMs: 5000,
            isPremium: template.isPremium ?? false,
          },
        };

        onNodesChange([{ type: 'add', item: newNode }]);
        onSelectNode(newNode);
      } catch (dropError) {
        console.error('Failed to parse dropped template:', dropError);
      }
    },
    [nodes, rfInstance, wrapperRef, onSelectNode, onNodesChange],
  );

  return { onDragOver, onDrop };
}
