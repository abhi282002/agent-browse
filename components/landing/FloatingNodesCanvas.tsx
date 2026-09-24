'use client';

import React from 'react';
import { FloatingNodeItem } from './FloatingNodeItem';
import type { NodeCoordinate } from './types';

export const floatingNodesList: NodeCoordinate[] = [
  { id: 'n1', label: 'Navigate(targetUrl)', category: 'Stagehand', color: 'emerald', x: '6%', y: '16%', delay: 0.04, entrance: { offsetX: -75, offsetY: -50 } },
  { id: 'n2', label: 'Extract(domTree)', category: 'Vision AI', color: 'cyan', x: '52%', y: '12%', delay: 0.10, entrance: { offsetX: 0, offsetY: -80 } },
  { id: 'n3', label: 'BypassCaptcha()', category: 'Security', color: 'violet', x: '72%', y: '36%', delay: 0.16, entrance: { offsetX: 85, offsetY: -40 } },
  { id: 'n4', label: 'AutoFill(formData)', category: 'Action', color: 'amber', x: '14%', y: '56%', delay: 0.22, entrance: { offsetX: -85, offsetY: 20 } },
  { id: 'n5', label: 'SyncCdpSession()', category: 'Browserbase', color: 'indigo', x: '48%', y: '72%', delay: 0.28, entrance: { offsetX: -15, offsetY: 80 } },
  { id: 'n6', label: 'TriggerPipeline()', category: 'Trigger.dev', color: 'fuchsia', x: '76%', y: '68%', delay: 0.34, entrance: { offsetX: 80, offsetY: 45 } },
];

export const FloatingNodesCanvas: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {floatingNodesList.map((node) => (
        <FloatingNodeItem key={node.id} node={node} />
      ))}
    </div>
  );
};
