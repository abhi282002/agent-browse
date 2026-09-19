"use client";


import type { WorkflowBlueprint, WorkflowNodeType } from "./types";
import { WorkflowExecutionPanel } from "./execution/WorkflowExecutionPanel";
import {
  BotIcon,
  TerminalIcon,
  SparklesIcon,
} from "@/components/ui/icons";

interface WorkflowSidebarProps {
  workflow: WorkflowBlueprint;
  allWorkflows: WorkflowBlueprint[];
  onSelectWorkflow: (id: string) => void;
  selectedNode: WorkflowNodeType | null;
  onOpenCreateModal: () => void;
  onOpenNodeCatalog?: () => void;
  onOpenNodeConfig?: () => void;
  onRunWorkflow: () => void;
  isRunning: boolean;
  onSaveWorkflow?: () => void;
  isSaving?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
}

export function WorkflowSidebar({
  workflow,
  allWorkflows,
  onSelectWorkflow,
  selectedNode,
  onOpenCreateModal,
  onOpenNodeCatalog,
  onOpenNodeConfig,
  onRunWorkflow,
  isRunning,
  onSaveWorkflow,
  isSaving = false,
  saveStatus = "idle",
}: WorkflowSidebarProps) {
  // Default to first running or first node if none selected
  const activeStepData =
    selectedNode?.data ??
    workflow.nodes.find((n) => n.data.status === "running")?.data ??
    workflow.nodes[0]?.data;

  return (
    <div className="flex flex-col gap-4 h-full w-full rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
      {/* Top Header: Workflow Info & Switcher */}
      <div className="space-y-3 pb-4 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-2xs">
              <BotIcon className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Active Workflow
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onSaveWorkflow && (
              <button
                type="button"
                onClick={onSaveWorkflow}
                disabled={isSaving}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                  saveStatus === "saved"
                    ? "bg-emerald-600 text-white"
                    : saveStatus === "error"
                    ? "bg-red-600 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                } disabled:opacity-50`}
                title="Save workflow nodes & edges to database"
              >
                {isSaving ? (
                  <>
                    <span className="h-2.5 w-2.5 animate-spin rounded-full border border-white/30 border-t-white" />
                    <span>Saving...</span>
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <span>✓</span>
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save</span>
                  </>
                )}
              </button>
            )}

            {onOpenNodeCatalog && (
              <button
                type="button"
                onClick={onOpenNodeCatalog}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer shadow-2xs"
                title="Add Step Node"
              >
                <span>+ Step</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
            >
              <SparklesIcon className="h-3 w-3 text-emerald-400" />
              <span>+ New Wf</span>
            </button>
          </div>
        </div>

        {/* Workflow Name with Switcher Dropdown */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-zinc-900 tracking-tight leading-snug">
              {workflow.name}
            </h3>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/70 shrink-0">
              {workflow.category}
            </span>
          </div>
          <p className="text-xs text-zinc-500 line-clamp-2">
            {workflow.description}
          </p>
        </div>

        {/* Quick Workflow Switcher if multiple exist */}
        {allWorkflows.length > 1 && (
          <div className="pt-1">
            <label className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
              Switch Workflow
            </label>
            <select
              value={workflow.id}
              onChange={(e) => onSelectWorkflow(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
            >
              {allWorkflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name} ({wf.nodes.length} steps)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Execution Controls & Target */}
      <WorkflowExecutionPanel
        workflow={workflow}
        onRunLocal={onRunWorkflow}
        isLocalRunning={isRunning}
      />

      {/* Selected Node Details Inspector */}
      {activeStepData && (
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900 font-mono text-[11px] font-bold text-white">
                0{activeStepData.stepNumber}
              </span>
              <span className="text-xs font-bold text-zinc-900">
                {activeStepData.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-600">
                {activeStepData.badge}
              </span>
              {onOpenNodeConfig && (
                <button
                  type="button"
                  onClick={onOpenNodeConfig}
                  className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-colors cursor-pointer"
                  title="Edit and configure step parameters"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200/70 bg-white p-3 space-y-2 text-xs">
            <div>
              <div className="text-[10px] uppercase font-semibold text-zinc-400 mb-0.5">
                Action Heuristic
              </div>
              <p className="text-zinc-700 text-[11px] leading-relaxed">
                {activeStepData.actionSummary}
              </p>
            </div>

            {/* Metrics pills */}
            {activeStepData.metrics && activeStepData.metrics.length > 0 && (
              <div className="pt-2 border-t border-zinc-100">
                <div className="text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">
                  Step Telemetry
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {activeStepData.metrics.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-zinc-50 p-1.5 border border-zinc-100"
                    >
                      <div className="text-[9px] text-zinc-400 truncate">{m.label}</div>
                      <div className="font-mono text-xs font-bold text-zinc-800">
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Terminal Console Logs */}
          <div className="flex-1 rounded-xl border border-zinc-900/90 bg-zinc-950 p-3 text-zinc-300 font-mono text-[11px] space-y-1.5 overflow-y-auto max-h-[160px]">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <TerminalIcon className="h-3 w-3 text-emerald-400" />
                <span>CDP Console</span>
              </span>
              <span className="text-[9px] text-emerald-400">Live</span>
            </div>
            {activeStepData.logLines?.map((log, idx) => (
              <div key={idx} className="flex gap-1.5 text-[10px] leading-tight">
                <span className="text-emerald-500 select-none">&gt;</span>
                <span className="text-zinc-300">{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
