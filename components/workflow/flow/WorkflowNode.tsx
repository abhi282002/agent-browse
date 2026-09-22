"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { WorkflowNodeType, StepNodeStatus } from "./types";
import { WorkflowNodeHeader } from "./WorkflowNodeHeader";
import { WorkflowNodeFooter } from "./WorkflowNodeFooter";

function getNodeStatusClasses(status: StepNodeStatus, selected?: boolean): string {
  if (selected) {
    return "border-zinc-900 ring-2 ring-zinc-900/10 shadow-md";
  }

  switch (status) {
    case "running":
      return "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10";
    case "failed":
      return "border-rose-500 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10";
    case "completed":
      return "border-zinc-200 hover:border-zinc-300";
    case "idle":
    default:
      return "border-zinc-200/90 hover:border-zinc-300";
  }
}

function WorkflowNodeComponent({ data, selected }: NodeProps<WorkflowNodeType>) {
  const isFailed = data.status === "failed";
  const statusClasses = getNodeStatusClasses(data.status, selected);

  return (
    <div
      className={`relative w-[280px] rounded-2xl border bg-white p-4 transition-all duration-200 shadow-sm cursor-pointer select-none ${statusClasses}`}
    >
      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-zinc-400 hover:!bg-emerald-500 transition-colors"
      />

      {/* Header: Step Indicator, Category & Status Pill */}
      <WorkflowNodeHeader
        stepNumber={data.stepNumber}
        category={data.category}
        status={data.status}
        isPremium={data.isPremium}
        durationMs={data.durationMs}
      />

      {/* Title */}
      <h4 className="text-xs font-bold text-zinc-900 tracking-tight leading-snug line-clamp-1 mb-1">
        {data.title}
      </h4>

      {/* Action Summary Description */}
      <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mb-2.5">
        {data.actionSummary || data.description}
      </p>

      {/* Error Callout if Failed */}
      {isFailed && data.errorMessage && (
        <div className="mb-2.5 rounded-lg bg-rose-50/90 border border-rose-200 p-2 text-[10px] text-rose-700 leading-snug break-words">
          <span className="font-semibold block text-rose-800 mb-0.5">Error:</span>
          <span className="line-clamp-2">{data.errorMessage}</span>
        </div>
      )}

      {/* Footer / URL & Quick Metric / Duration */}
      <WorkflowNodeFooter
        url={data.url}
        status={data.status}
        durationMs={data.durationMs}
        metrics={data.metrics}
      />

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
