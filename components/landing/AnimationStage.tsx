'use client';

import React from 'react';
import { ConnectionLinesSvg } from './ConnectionLinesSvg';
import { FloatingNodesCanvas } from './FloatingNodesCanvas';
import { CursorCanvas } from './CursorCanvas';

export const AnimationStage: React.FC = () => {
  return (
    <div className="relative w-full h-[320px] sm:h-[360px] overflow-hidden select-none">
      <ConnectionLinesSvg />
      <FloatingNodesCanvas />
      <CursorCanvas />
    </div>
  );
};
