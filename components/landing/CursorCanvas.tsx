'use client';

import React from 'react';
import { AnimatedCursorItem } from './AnimatedCursorItem';
import type { CursorTarget } from './types';

export const agentCursorsList: CursorTarget[] = [
  {
    name: 'Agent #1 (Stagehand)',
    color: '#10b981',
    badgeBg: 'bg-emerald-600',
    path: [
      { x: '10%', y: '18%', duration: 3.2 },
      { x: '54%', y: '14%', duration: 3.5 },
      { x: '74%', y: '38%', duration: 3.0 },
      { x: '10%', y: '18%', duration: 3.8 },
    ],
  },
  {
    name: 'Agent #2 (Vision LLM)',
    color: '#8b5cf6',
    badgeBg: 'bg-violet-600',
    path: [
      { x: '18%', y: '58%', duration: 3.2 },
      { x: '50%', y: '74%', duration: 3.6 },
      { x: '78%', y: '70%', duration: 3.2 },
      { x: '18%', y: '58%', duration: 3.8 },
    ],
  },
  {
    name: 'Agent #3 (CDP Sync)',
    color: '#f59e0b',
    badgeBg: 'bg-amber-600',
    path: [
      { x: '74%', y: '38%', duration: 3.4 },
      { x: '78%', y: '70%', duration: 3.2 },
      { x: '54%', y: '14%', duration: 3.6 },
      { x: '74%', y: '38%', duration: 3.8 },
    ],
  },
];

export const CursorCanvas: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {agentCursorsList.map((cursor, idx) => (
        <AnimatedCursorItem key={cursor.name} cursor={cursor} initialDelay={0.45 + idx * 0.4} />
      ))}
    </div>
  );
};
