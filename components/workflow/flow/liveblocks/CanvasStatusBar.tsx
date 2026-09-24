'use client';

import type { Edge } from '@xyflow/react';
import { SparklesIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { CollaboratorAvatars } from './CollaboratorAvatars';
import type { WorkflowNodeType } from '../types';

interface CanvasStatusBarProps {
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  nodes: WorkflowNodeType[] | null | undefined;
  edges: Edge[] | null | undefined;
  onSaveWorkflow?: (nodes: WorkflowNodeType[], edges: Edge[]) => void;
}

export function CanvasStatusBar({
  isSaving,
  saveStatus,
  lastSavedAt,
  nodes,
  edges,
  onSaveWorkflow,
}: CanvasStatusBarProps) {
  return (
    <>
      {/* Floating Teammate Collaborators Panel */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="rounded-xl border border-zinc-200/90 bg-white/95 px-3 py-1.5 shadow-2xs backdrop-blur-md">
          <CollaboratorAvatars />
        </div>
      </div>

      {/* Floating Canvas Save & Multiplayer Status Bar */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        {/* Liveblocks Connected Indicator */}
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Liveblocks Multiplayer Active</span>
        </div>

        {/* Database Persistence Status Badge */}
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md transition-all shadow-2xs ${
            saveStatus === 'saving' || isSaving
              ? 'border-amber-200 bg-amber-50/90 text-amber-800'
              : saveStatus === 'saved'
                ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
                : saveStatus === 'error'
                  ? 'border-rose-200 bg-rose-50/90 text-rose-800'
                  : 'border-zinc-200/80 bg-white/90 text-zinc-600'
          }`}
        >
          {saveStatus === 'saving' || isSaving ? (
            <>
              <span className="h-2 w-2 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              <span>Saving to DB...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Saved to DB</span>
            </>
          ) : saveStatus === 'error' ? (
            <>
              <span className="text-rose-600 font-bold">✕</span>
              <span>DB Save failed</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              <span>
                {lastSavedAt
                  ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'All changes synced'}
              </span>
            </>
          )}
        </div>

        {/* Manual Save Button */}
        {onSaveWorkflow && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              nodes &&
              edges &&
              onSaveWorkflow(nodes as WorkflowNodeType[], edges)
            }
            disabled={isSaving || saveStatus === 'saving'}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-700 shadow-2xs backdrop-blur-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-60 h-auto"
            title="Persist flow changes to PostgreSQL database"
          >
            <SparklesIcon className="h-3 w-3 text-emerald-500" />
            <span>Save to DB</span>
          </Button>
        )}
      </div>
    </>
  );
}
