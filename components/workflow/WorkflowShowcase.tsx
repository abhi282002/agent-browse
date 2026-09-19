"use client";

import React, { useState, useEffect } from "react";
import { PlayIcon, PauseIcon, RefreshCwIcon, BotIcon, SparklesIcon, ChromeIcon } from "@/components/ui/icons";
import { WORKFLOW_STEPS } from "./workflowData";
import { WorkflowNodeCard } from "./WorkflowNodeCard";
import { WorkflowConnector } from "./WorkflowConnector";
import { BrowserLiveMock } from "./BrowserLiveMock";
import { WorkflowDashboard } from "./flow/WorkflowDashboard";

export function WorkflowShowcase() {
  const [viewMode, setViewMode] = useState<"flow" | "sandbox">("flow");
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-cycle through workflow steps in sandbox mode
  useEffect(() => {
    if (!isPlaying || viewMode !== "sandbox") return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 3200);

    return () => clearInterval(timer);
  }, [isPlaying, viewMode]);

  const currentStep = WORKFLOW_STEPS[currentStepIndex];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header bar with view modes & controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <BotIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                Autonomous Execution Graph
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CDP Sandbox Active
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Interactive node graph with live browser telemetry and deterministic controls.
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Interactive React Flow vs Live Browser Replay */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-100/80 p-1">
            <button
              type="button"
              onClick={() => setViewMode("flow")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "flow"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <SparklesIcon className="h-3.5 w-3.5 text-emerald-600" />
              <span>Interactive Flow</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("sandbox")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "sandbox"
                  ? "bg-white text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <ChromeIcon className="h-3.5 w-3.5 text-zinc-700" />
              <span>Live Browser Sandbox</span>
            </button>
          </div>

          {viewMode === "sandbox" && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <PauseIcon className="h-3 w-3" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-3 w-3" />
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
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
                title="Restart animation flow"
              >
                <RefreshCwIcon className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "flow" ? (
        <WorkflowDashboard />
      ) : (
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
      )}
    </div>
  );
}
