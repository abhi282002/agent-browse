"use client";

import type { WorkflowBlueprint, WorkflowNodeType } from "./types";
import { WorkflowExecutionPanel } from "./execution/WorkflowExecutionPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  onOpenEditWorkflow?: () => void;
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
  onOpenEditWorkflow,
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
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200/90 bg-white shadow-xs overflow-y-auto overscroll-contain">
      <div className="flex flex-col gap-4 p-4 lg:p-5">
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

          <div className="flex items-center gap-1 flex-wrap justify-end">
            {onSaveWorkflow && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onSaveWorkflow}
                disabled={isSaving}
                title="Save workflow nodes & edges to database"
                className={
                  saveStatus === "saved"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-50"
                    : saveStatus === "error"
                      ? "border-red-300 bg-red-50 text-red-800 hover:bg-red-50"
                      : ""
                }
              >
                {isSaving ? (
                  <>
                    <span className="h-2.5 w-2.5 animate-spin rounded-full border border-current/30 border-t-current" />
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
              </Button>
            )}

            {onOpenNodeCatalog && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onOpenNodeCatalog}
                title="Add Step Node"
              >
                + Step
              </Button>
            )}

            {onOpenEditWorkflow && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onOpenEditWorkflow}
                title="Edit Workflow Settings & Target URL"
              >
                ✏️ Edit
              </Button>
            )}

            <Button
              type="button"
              size="xs"
              onClick={onOpenCreateModal}
            >
              <SparklesIcon className="h-3 w-3 text-emerald-400" />
              <span>+ New</span>
            </Button>
          </div>
        </div>

        {/* Workflow Name */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <h3
                title={workflow.name}
                className="text-base font-bold text-zinc-900 tracking-tight leading-snug truncate"
              >
                {workflow.name}
              </h3>
              {onOpenEditWorkflow && (
                <button
                  type="button"
                  onClick={onOpenEditWorkflow}
                  className="text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer text-xs p-0.5 rounded hover:bg-zinc-100 shrink-0"
                  title="Edit Workflow Settings"
                >
                  ✏️
                </button>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {workflow.category}
            </Badge>
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
        onEditWorkflow={onOpenEditWorkflow}
      />

      {/* Selected Node Details Inspector */}
      {activeStepData && (
        <div className="flex flex-col gap-3">
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
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={onOpenNodeConfig}
                  title="Edit and configure step parameters"
                >
                  Edit
                </Button>
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
          <ScrollArea className="flex-1 rounded-xl border border-zinc-900/90 bg-zinc-950 p-3 max-h-[160px]">
            <div className="text-zinc-300 font-mono text-[11px] space-y-1.5">
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
          </ScrollArea>
        </div>
      )}
      </div>
    </div>
  );
}
