"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { SparklesIcon } from "@/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { WorkflowConsoleToggleButton } from "./execution/WorkflowConsoleToggleButton";
import { WorkflowRunButton } from "./execution/WorkflowRunButton";
import type { WorkflowBlueprint } from "./types";

export type SaveWorkflowStatus = "idle" | "saving" | "saved" | "error";

export interface WorkflowToolbarProps {
  workflows: WorkflowBlueprint[];
  activeWorkflow: WorkflowBlueprint;
  selectWorkflow: (id: string) => void;
  saveWorkflow: () => Promise<void> | void;
  isSaving: boolean;
  saveStatus: SaveWorkflowStatus;
  isSyncing: boolean;
  isAdmin: boolean;
  isRunning: boolean;
  isConsoleOpen: boolean;

  onOpenAdminModal: () => void;
  onOpenEditModal: () => void;
  onOpenScheduleSheet: () => void;
  onOpenCreateView: () => void;
  onOpenAiGenerate: () => void;
  onToggleConsole: () => void;
  onRunPipeline: () => void;
  onStopPipeline: () => void;
}

/**
 * Returns tailored Tailwind CSS classes based on the save status
 * using an explicit switch statement as requested.
 */
export function getSaveStatusBadgeColor(status: SaveWorkflowStatus): string {
  switch (status) {
    case "saved":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "error":
      return "border-red-300 bg-red-50 text-red-800";
    case "saving":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "idle":
    default:
      return "border-zinc-300/80 bg-white text-zinc-700 hover:bg-zinc-50";
  }
}

/**
 * Returns the inner icon and label for the save button
 * using switch logic for determinism.
 */
export function getSaveButtonContent(status: SaveWorkflowStatus, isSaving: boolean) {
  if (isSaving) {
    return (
      <>
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-ping" />
        <span>Saving...</span>
      </>
    );
  }

  switch (status) {
    case "saved":
      return (
        <>
          <span className="text-emerald-600 font-bold">✓</span>
          <span className="text-emerald-800">Saved</span>
        </>
      );
    case "error":
      return (
        <>
          <span className="text-red-600 font-bold">✕</span>
          <span className="text-red-800">Retry</span>
        </>
      );
    case "saving":
      return (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
          <span className="text-amber-800">Saving...</span>
        </>
      );
    case "idle":
    default:
      return (
        <>
          <span>💾</span>
          <span>Save</span>
        </>
      );
  }
}

export function WorkflowToolbar({
  workflows,
  activeWorkflow,
  selectWorkflow,
  saveWorkflow,
  isSaving,
  saveStatus,
  isSyncing,
  isAdmin,
  isRunning,
  isConsoleOpen,
  onOpenAdminModal,
  onOpenEditModal,
  onOpenScheduleSheet,
  onOpenCreateView,
  onOpenAiGenerate,
  onToggleConsole,
  onRunPipeline,
  onStopPipeline,
}: WorkflowToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap bg-white/80 backdrop-blur-xs p-2.5 rounded-2xl border border-zinc-200/90 shadow-2xs">
      {/* Left: Save + Admin Studio + Target URL pill + Sync status + Node count */}
      <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
        <Button
          type="button"
          size="sm"
          onClick={() => saveWorkflow()}
          disabled={isSaving}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer h-auto ${getSaveStatusBadgeColor(
            saveStatus
          )} disabled:opacity-50`}
          title="Save current workflow and nodes to PostgreSQL"
        >
          {getSaveButtonContent(saveStatus, isSaving)}
        </Button>

        {isAdmin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenAdminModal}
            className="flex items-center gap-1 rounded-lg border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer h-auto"
            title="Admin studio to create, edit, or customize Free/PRO nodes"
          >
            <span>⚙️ Admin Node Studio</span>
          </Button>
        )}

        {/* Workflow Settings Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenEditModal}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer h-auto"
          title="Edit Workflow Settings & Configuration"
        >
          <span>⚙️ Settings</span>
        </Button>

        <span className="hidden md:inline text-zinc-300">•</span>

        <span className="hidden md:flex items-center gap-1">
          {isSyncing ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-amber-700">Syncing...</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 font-medium">DB Synced</span>
            </>
          )}
        </span>

        <span className="hidden lg:inline text-zinc-300">•</span>
        <span className="hidden lg:inline text-zinc-500">
          Nodes: {activeWorkflow.nodes.length}
        </span>
      </div>

      {/* Right: Switch Workflow + Edit Settings + Schedule + New + AI Generate + Console + Run */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Switch Workflow dropdown */}
        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-2 py-0.5 shadow-2xs hover:border-zinc-300 transition-colors">
          <span className="text-xs pl-1">🗂️</span>
          <Select
            value={activeWorkflow.id}
            onValueChange={(val) => {
              if (val) selectWorkflow(val);
            }}
          >
            <SelectTrigger className="border-0 bg-transparent h-7 text-xs font-semibold text-zinc-800 p-1 focus-visible:ring-0 shadow-none cursor-pointer max-w-[160px] sm:max-w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workflows.map((wf) => (
                <SelectItem key={wf.id} value={wf.id}>
                  {wf.name} ({wf.nodes.length} steps)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Edit Workflow */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenEditModal}
          className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors cursor-pointer shadow-2xs h-auto"
          title="Edit Workflow Settings & Target URL"
        >
          <span>✏️</span>
          <span className="hidden sm:inline">Edit</span>
        </Button>

        {/* Schedule Workflow */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenScheduleSheet}
          className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors cursor-pointer shadow-2xs h-auto"
          title="Set up automated schedule for this workflow"
        >
          <span>⏰</span>
          <span className="hidden sm:inline">Schedule</span>
        </Button>

        {/* + New Workflow */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenCreateView}
          className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors cursor-pointer shadow-2xs h-auto"
          title="Create a new workflow blueprint"
        >
          <SparklesIcon className="h-3.5 w-3.5 text-zinc-500" />
          <span className="hidden sm:inline">New</span>
        </Button>

        {/* Generate with AI (Opens Left-Side Sheet) */}
        <Button
          type="button"
          size="sm"
          onClick={onOpenAiGenerate}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition-colors cursor-pointer shadow-2xs h-auto"
          title="Generate an autonomous workflow blueprint using AI"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span className="hidden sm:inline">AI Generate</span>
        </Button>

        {/* Toggle Execution Console */}
        <WorkflowConsoleToggleButton
          isOpen={isConsoleOpen}
          onToggle={onToggleConsole}
          isRunning={isRunning}
        />

        {/* Run/Stop Workflow Button */}
        <WorkflowRunButton
          isRunning={isRunning}
          onRun={onRunPipeline}
          onStop={onStopPipeline}
        />
      </div>
    </div>
  );
}
