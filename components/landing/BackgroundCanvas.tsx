'use client';

import React from 'react';
import { FloatingNodesCanvas } from './FloatingNodesCanvas';
import { CursorCanvas } from './CursorCanvas';
import { ConnectionLinesSvg } from './ConnectionLinesSvg';

export const BackgroundCanvas: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/3 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-violet-400/15 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:32px_32px]" />
      <ConnectionLinesSvg />
      <FloatingNodesCanvas />
      <CursorCanvas />
    </div>
  );
};
