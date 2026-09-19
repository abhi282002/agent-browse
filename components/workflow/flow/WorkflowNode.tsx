"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { WorkflowNodeType } from "./types";
import { CheckIcon, TerminalIcon } from "@/components/ui/icons";

function WorkflowNodeComponent({ data, selected }: NodeProps<WorkflowNodeType>) {
  const isRunning = data.status === "running";
  const isCompleted = data.status === "completed";

  return (
    <div
      className={`relative w-[270px] rounded-2xl border bg-white p-4 transition-all duration-200 shadow-sm cursor-pointer select-none ${
        selected
          ? "border-zinc-900 ring-2 ring-zinc-900/10 shadow-md"
          : isRunning
          ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10"
          : isCompleted
          ? "border-zinc-200 hover:border-zinc-300"
          : "border-zinc-200/90 hover:border-zinc-300"
      }`}
    >
      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-zinc-400 hover:!bg-emerald-500 transition-colors"
      />

      {/* Header: Step Indicator, Category & Status Pill */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold font-mono transition-colors ${
              isRunning
                ? "bg-emerald-500 text-white animate-pulse"
                : isCompleted
                ? "bg-emerald-100 text-emerald-800"
                : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {isCompleted ? <CheckIcon className="h-3.5 w-3.5" /> : `0${data.stepNumber}`}
          </div>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider truncate max-w-[120px]">
            {data.category}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {data.isPremium && (
            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200">
              PRO
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
              isRunning
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                : isCompleted
                ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                : "bg-zinc-50 text-zinc-400 border-zinc-200/60"
            }`}
          >
            {isRunning ? "Running" : isCompleted ? "Done" : "Pending"}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-zinc-900 tracking-tight leading-snug line-clamp-1 mb-1">
        {data.title}
      </h4>

      {/* Action Summary Description */}
      <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mb-3">
        {data.actionSummary || data.description}
      </p>

      {/* Footer / URL & Quick Metric */}
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
        <div className="flex items-center gap-1 truncate max-w-[150px]" title={data.url}>
          <TerminalIcon className="h-3 w-3 shrink-0 text-zinc-400" />
          <span className="truncate">{data.url.replace(/^https?:\/\//, "")}</span>
        </div>

        {data.metrics && data.metrics.length > 0 && (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700 shrink-0">
            {data.metrics[0].value}
          </span>
        )}
      </div>

      {/* Source Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-zinc-400 hover:!bg-emerald-500 transition-colors"
      />
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);
