'use client';

import { BotIcon } from '@/components/ui/icons';

interface CanvasLoadingStateProps {
  workflowId: string;
}

export function CanvasLoadingState({ workflowId }: CanvasLoadingStateProps) {
  return (
    <div className="relative h-[calc(100vh-190px)] min-h-[570px] w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/50 flex flex-col items-center justify-center gap-3 shadow-xs">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs animate-pulse">
        <BotIcon className="h-5 w-5" />
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span>Syncing collaborative canvas with Liveblocks...</span>
      </div>
      <p className="text-[11px] text-zinc-400">Room: {workflowId}</p>
    </div>
  );
}
