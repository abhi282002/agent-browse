'use client';

import React from 'react';
import { TerminalIcon } from '@/components/ui/icons';

export const AnimationStageHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 px-4 py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          Agent Runtime Orchestrator
        </span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
        <TerminalIcon className="h-3 w-3 text-emerald-500" />
        <span>3 Live Agents Connected</span>
      </div>
    </div>
  );
};
