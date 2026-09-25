'use client';

import React from 'react';
import { Square } from 'lucide-react';
import { PlayIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

export interface WorkflowRunButtonProps {
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

export function WorkflowRunButton({
  isRunning,
  onRun,
  onStop,
  disabled = false,
  className = '',
}: WorkflowRunButtonProps) {
  if (isRunning) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={onStop}
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1 text-xs font-bold shadow-xs transition-all cursor-pointer bg-rose-600 hover:bg-rose-700 active:scale-98 text-white shadow-rose-600/20 group h-8 shrink-0 ${className}`}
        title="Stop active workflow execution"
      >
        <span className="h-2 w-2 rounded-full bg-white animate-ping mr-0.5" />
        <Square className="h-3 w-3 fill-current text-white transition-transform group-hover:scale-110" />
        <span>Stop Agent</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={onRun}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1 text-xs font-bold shadow-xs transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-600/20 disabled:opacity-80 h-8 shrink-0 ${className}`}
      title="Execute workflow with autonomous browser agent"
    >
      <PlayIcon className="h-3.5 w-3.5 fill-current" />
      <span>Run Workflow</span>
    </Button>
  );
}
