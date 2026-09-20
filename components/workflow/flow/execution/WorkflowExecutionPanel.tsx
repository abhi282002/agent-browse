"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { WorkflowBlueprint } from "../types";
import type { WorkflowExecutionResult } from "@/server/services/browserbaseService";
import { PlayIcon, SparklesIcon, ChromeIcon, BotIcon } from "@/components/ui/icons";

interface WorkflowExecutionPanelProps {
  workflow: WorkflowBlueprint;
  onRunLocal: () => void;
  isLocalRunning: boolean;
  onEditWorkflow?: () => void;
}

export function WorkflowExecutionPanel({
  workflow,
  onRunLocal,
  isLocalRunning,
  onEditWorkflow,
}: WorkflowExecutionPanelProps) {
  const { data: integrations } = trpc.execution.getIntegrationsStatus.useQuery(undefined, {
    staleTime: 30 * 1000,
  });
  const { data: currentUser } = trpc.auth.me.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  const [isRunningCloud, setIsRunningCloud] = useState(false);
  const [cloudResult, setCloudResult] = useState<WorkflowExecutionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startExecutionMutation = trpc.execution.startExecution.useMutation({
    onSuccess: (data) => {
      setIsRunningCloud(false);
      if ("result" in data && data.result) {
        setCloudResult(data.result as WorkflowExecutionResult);
      }
    },
    onError: (err) => {
      setIsRunningCloud(false);
      setErrorMessage(err.message);
    },
  });

  const handleRunCloud = () => {
    setIsRunningCloud(true);
    setErrorMessage(null);
    setCloudResult(null);

    startExecutionMutation.mutate({
      workflowId: workflow.id,
      workflowName: workflow.name,
      targetUrl: workflow.targetUrl,
      aiModel: workflow.aiModel,
      userEmail: currentUser?.email,
      nodes: workflow.nodes.map((node) => ({
        id: node.id,
        data: {
          stepNumber: node.data.stepNumber,
          title: node.data.title,
          category: node.data.category,
          badge: node.data.badge,
          description: node.data.description,
          actionSummary: node.data.actionSummary,
          url: node.data.url,
          archetype: node.data.archetype,
        },
      })),
    });
  };

  const isBusy = isLocalRunning || isRunningCloud;

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 space-y-3">
      {/* Target and Steps Info */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-medium">Target Web URL</span>
          <div className="flex items-center gap-1.5 max-w-[190px]">
            <span
              className="text-[11px] font-mono text-zinc-700 truncate"
              title={workflow.targetUrl}
            >
              {workflow.targetUrl}
            </span>
            {onEditWorkflow && (
              <button
                type="button"
                onClick={onEditWorkflow}
                className="text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer text-xs p-0.5 rounded hover:bg-zinc-200/60 shrink-0"
                title="Edit Target URL & Workflow Settings"
              >
                ✏️
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-medium">Node Pipeline</span>
          <span className="font-semibold text-zinc-800 font-mono">
            {workflow.nodes.length} Steps
          </span>
        </div>

        {currentUser?.email && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Operator Context</span>
            <span
              className="text-[11px] font-mono text-zinc-700 truncate max-w-[160px]"
              title={currentUser.email}
            >
              {currentUser.email}
            </span>
          </div>
        )}
      </div>

      {/* Cloud Integrations Status Bar */}
      <div className="pt-2 border-t border-zinc-200/70 space-y-1 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 font-medium flex items-center gap-1">
            <ChromeIcon className="h-3 w-3 text-zinc-500" />
            <span>Browserbase</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-xs">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                integrations?.browserbase.isConfigured ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
              }`}
            />
            <span className={integrations?.browserbase.isConfigured ? "text-emerald-700" : "text-zinc-600"}>
              {integrations?.browserbase.isConfigured ? "Live Cloud CDP" : "Simulation"}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-500 font-medium flex items-center gap-1">
            <SparklesIcon className="h-3 w-3 text-emerald-600" />
            <span>Trigger.dev</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-xs">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                integrations?.triggerDev.isConfigured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className={integrations?.triggerDev.isConfigured ? "text-emerald-700" : "text-amber-800"}>
              {integrations?.triggerDev.isConfigured ? "V3 Orchestrator" : "Direct Runner"}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-500 font-medium flex items-center gap-1">
            <BotIcon className="h-3 w-3 text-indigo-500" />
            <span>Autonomous Agent</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-xs text-indigo-700">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                integrations?.agents?.gemini.isConfigured || integrations?.agents?.grok.isConfigured
                  ? "bg-indigo-500 animate-pulse"
                  : "bg-zinc-400"
              }`}
            />
            <span>{workflow.aiModel || "Gemini 2.5 Pro"}</span>
          </span>
        </div>
      </div>

      {/* Cloud Execution Live Feedback */}
      {cloudResult && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900 space-y-1.5">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Pipeline Executed!</span>
            </span>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">
              {cloudResult.successfulSteps}/{cloudResult.totalSteps} Steps
            </span>
          </div>

          <div className="text-[11px] text-emerald-800">
            Session: <span className="font-mono font-medium">{cloudResult.sessionId}</span>
          </div>

          {cloudResult.liveViewUrl && (
            <a
              href={cloudResult.liveViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
            >
              <span>View Session on Browserbase ↗</span>
            </a>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-1.5 pt-1">
        {/* Run on Browserbase / Trigger.dev */}
        <button
          type="button"
          onClick={handleRunCloud}
          disabled={isBusy || workflow.nodes.length === 0}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 font-semibold text-xs text-white hover:bg-zinc-800 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          title="Run pipeline with Stagehand on Browserbase cloud Chromium"
        >
          {isRunningCloud ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Running Cloud Agent...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>Run on Browserbase & Trigger.dev</span>
            </>
          )}
        </button>

        {/* Local Fast Simulation */}
        <button
          type="button"
          onClick={onRunLocal}
          disabled={isBusy || workflow.nodes.length === 0}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white font-medium text-xs text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          title="Run quick local step simulation"
        >
          {isLocalRunning ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <PlayIcon className="h-3.5 w-3.5 text-zinc-600" />
              <span>Quick Local Simulation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
