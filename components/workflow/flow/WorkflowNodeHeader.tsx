'use client';

import React, { memo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { CheckIcon } from '@/components/ui/icons';
import type { StepNodeStatus } from './types';

export function formatDuration(ms?: number): string | null {
  if (ms === undefined || ms === null) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export interface WorkflowNodeHeaderProps {
  stepNumber: number;
  category: string;
  status: StepNodeStatus;
  isPremium?: boolean;
  durationMs?: number;
}

function WorkflowNodeHeaderComponent({
  stepNumber,
  category,
  status,
  isPremium,
  durationMs,
}: WorkflowNodeHeaderProps) {
  const isRunning = status === 'running';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const durationText = formatDuration(durationMs);

  return (
    <div className="flex items-center justify-between gap-2 mb-2.5">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold font-mono transition-colors ${
            isRunning
              ? 'bg-emerald-500 text-white animate-pulse'
              : isFailed
                ? 'bg-rose-100 text-rose-700 font-bold'
                : isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-zinc-100 text-zinc-700'
          }`}
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isFailed ? (
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
          ) : isCompleted ? (
            <CheckIcon className="h-3.5 w-3.5" />
          ) : (
            `0${stepNumber}`
          )}
        </div>
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider truncate max-w-[110px]">
          {category}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {isPremium && (
          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200">
            PRO
          </span>
        )}
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
            isRunning
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
              : isFailed
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-zinc-50 text-zinc-400 border-zinc-200/60'
          }`}
        >
          {isRunning ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Running
            </>
          ) : isFailed ? (
            <>
              <AlertCircle className="h-2.5 w-2.5 text-rose-500" />
              Failed {durationText ? `(${durationText})` : ''}
            </>
          ) : isCompleted ? (
            <>
              <CheckIcon className="h-2.5 w-2.5 text-emerald-600" />
              Done {durationText ? `(${durationText})` : ''}
            </>
          ) : (
            'Pending'
          )}
        </span>
      </div>
    </div>
  );
}

export const WorkflowNodeHeader = memo(WorkflowNodeHeaderComponent);
