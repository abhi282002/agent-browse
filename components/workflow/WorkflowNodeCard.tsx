"use client";

import React from "react";
import { motion } from "motion/react";
import { CheckIcon, SparklesIcon } from "@/components/ui/icons";
import { WorkflowStep } from "./workflowData";

interface WorkflowNodeCardProps {
  step: WorkflowStep;
  isActive: boolean;
  isCompleted: boolean;
  onSelect: () => void;
}

export function WorkflowNodeCard({
  step,
  isActive,
  isCompleted,
  onSelect,
}: WorkflowNodeCardProps) {
  return (
    <motion.div
      onClick={onSelect}
      layout
      transition={{ duration: 0.2 }}
      className={`group relative cursor-pointer rounded-xl border p-3.5 transition-all select-none ${
        isActive
          ? "border-zinc-800 bg-white shadow-md ring-1 ring-zinc-800/10"
          : isCompleted
          ? "border-zinc-200/80 bg-white/80 hover:border-zinc-300 hover:bg-white"
          : "border-zinc-200/60 bg-zinc-50/50 hover:border-zinc-200 hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Step indicator and text */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? "bg-zinc-900 text-white shadow-xs"
                : isCompleted
                ? "bg-zinc-100 text-zinc-700 border border-zinc-200"
                : "bg-zinc-100 text-zinc-400"
            }`}
          >
            {isCompleted ? (
              <CheckIcon className="h-3.5 w-3.5 text-zinc-800 stroke-[2.5]" />
            ) : (
              <span>0{step.stepNumber}</span>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold tracking-tight transition-colors ${
                  isActive ? "text-zinc-900" : isCompleted ? "text-zinc-800" : "text-zinc-600"
                }`}
              >
                {step.title}
              </span>
              <span className="text-[10px] uppercase font-medium tracking-wider text-zinc-400">
                • {step.category}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500 leading-snug line-clamp-1">
              {step.description}
            </p>
          </div>
        </div>

        {/* Right status badge */}
        <div className="shrink-0">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Executing
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
              Passed
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-zinc-100/70 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Expanded details when active */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2.5 pt-2.5 border-t border-zinc-100 flex flex-col gap-2"
        >
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-mono bg-zinc-50 p-1.5 rounded border border-zinc-200/60">
            <SparklesIcon className="h-3 w-3 text-amber-500 shrink-0" />
            <span className="truncate">{step.actionSummary}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            {step.metrics.map((m, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="text-zinc-400">{m.label}:</span>
                <span className="font-semibold text-zinc-800">{m.value}</span>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
