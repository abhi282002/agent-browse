"use client";

import React, { useState, useEffect } from "react";
import { PlayIcon, PauseIcon, RefreshCwIcon, BotIcon } from "@/components/ui/icons";
import { WORKFLOW_STEPS } from "./workflowData";
import { WorkflowNodeCard } from "./WorkflowNodeCard";
import { WorkflowConnector } from "./WorkflowConnector";
import { BrowserLiveMock } from "./BrowserLiveMock";

export function WorkflowShowcase() {
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-cycle through workflow steps
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 3200);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const currentStep = WORKFLOW_STEPS[currentStepIndex];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header bar with controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <BotIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                Live Agent Execution Graph
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Node: 0{currentStep.stepNumber} / 0{WORKFLOW_STEPS.length}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Watch how our multimodal agent navigates live web pages and automates workflows.
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <>
                <PauseIcon className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-3.5 w-3.5" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentStepIndex(0);
              setIsPlaying(true);
            }}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
            title="Restart animation flow"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Grid: Workflow Nodes on Left / Browser Sandbox View on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Nodes Timeline Column */}
        <div className="lg:col-span-6 flex flex-col">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isLast = index === WORKFLOW_STEPS.length - 1;

            return (
              <div key={step.id} className="flex flex-col">
                <WorkflowNodeCard
                  step={step}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  onSelect={() => {
                    setCurrentStepIndex(index);
                    setIsPlaying(false);
                  }}
                />
                {!isLast && (
                  <WorkflowConnector
                    isActive={isActive}
                    isCompleted={isCompleted}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Live Headless Browser Sandbox Tile */}
        <div className="lg:col-span-6 flex flex-col gap-4 sticky top-6">
          <BrowserLiveMock currentStep={currentStep} />

          {/* Quick Specs / Capabilities badge row */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 shadow-2xs">
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Sandbox Protocol
              </div>
              <div className="mt-0.5 text-xs font-bold text-zinc-800">
                Chrome DevTools (CDP)
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 shadow-2xs">
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Vision Engine
              </div>
              <div className="mt-0.5 text-xs font-bold text-zinc-800">
                Multimodal 120 FPS
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 shadow-2xs">
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Anti-Bot Bypass
              </div>
              <div className="mt-0.5 text-xs font-bold text-zinc-800">
                Human Jitter &amp; TLS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
