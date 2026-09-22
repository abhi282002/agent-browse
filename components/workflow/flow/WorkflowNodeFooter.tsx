"use client";

import React, { memo } from "react";
import { Clock } from "lucide-react";
import { TerminalIcon } from "@/components/ui/icons";
import type { StepNodeStatus } from "./types";
import { formatDuration } from "./WorkflowNodeHeader";

export interface WorkflowNodeFooterProps {
  url?: string;
  status: StepNodeStatus;
  durationMs?: number;
  metrics?: { label: string; value: string }[];
}

function WorkflowNodeFooterComponent({
  url,
  status,
  durationMs,
  metrics,
}: WorkflowNodeFooterProps) {
  const isRunning = status === "running";
  const durationText = formatDuration(durationMs);

  return (
    <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
      <div className="flex items-center gap-1 truncate max-w-[140px]" title={url}>
        <TerminalIcon className="h-3 w-3 shrink-0 text-zinc-400" />
        <span className="truncate">{url ? url.replace(/^https?:\/\//, "") : "no-target"}</span>
      </div>

      {durationText ? (
        <span className="flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700 shrink-0">
          <Clock className="h-2.5 w-2.5 text-zinc-400" />
          {durationText}
        </span>
      ) : isRunning ? (
        <span className="flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 shrink-0 animate-pulse">
          <Clock className="h-2.5 w-2.5 text-emerald-500" />
          timing...
        </span>
      ) : metrics && metrics.length > 0 ? (
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700 shrink-0">
          {metrics[0].value}
        </span>
      ) : null}
    </div>
  );
}

export const WorkflowNodeFooter = memo(WorkflowNodeFooterComponent);
