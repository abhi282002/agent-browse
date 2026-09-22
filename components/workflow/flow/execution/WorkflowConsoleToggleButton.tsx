'use client';

import { Terminal } from 'lucide-react';

export interface WorkflowConsoleToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  isRunning?: boolean;
  className?: string;
}

export function WorkflowConsoleToggleButton({
  isOpen,
  onToggle,
  isRunning = false,
  className = '',
}: WorkflowConsoleToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer shadow-2xs ${
        isOpen
          ? 'border-zinc-800 bg-zinc-900 text-white font-semibold'
          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
      } ${className}`}
      title="Toggle Real-time Execution Console & Browserbase Session Relay"
    >
      <Terminal className="h-3.5 w-3.5 text-emerald-400" />
      <span className="hidden sm:inline">Console</span>
      {isRunning && (
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
    </button>
  );
}
