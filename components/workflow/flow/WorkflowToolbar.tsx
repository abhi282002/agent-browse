"use client";

import React from "react";
import {
  Sparkles,
  GitFork,
  Settings,
  Clock,
  Plus,
  Save,
  Check,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
          <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
          <span className="text-emerald-800">Saved</span>
        </>
      );
    case "error":
      return (
        <>
          <X className="h-3.5 w-3.5 text-red-600 font-bold" />
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
          <Save className="h-3.5 w-3.5 text-zinc-500" />
          <span>Save</span>
        </>
      );
  }
}

function getHostname(url?: string): string | null {
  if (!url) return null;
  try {
    const formatted =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    return new URL(formatted).hostname.replace(/^www\./, "");
  } catch {
    return null;
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
    <div className="flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-zinc-200/90 shadow-2xs w-full">
      {/* Left: Workflow Selector + Save + Sync Indicator */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Modern Workflow Selector Dropdown */}
        <Select
          value={activeWorkflow.id}
          onValueChange={(val) => {
            if (val) selectWorkflow(val);
          }}
        >
          <SelectTrigger className="h-8 w-[200px] sm:w-[240px] md:w-[270px] rounded-xl border border-zinc-200/90 bg-white hover:bg-zinc-50/80 px-2.5 text-xs font-semibold text-zinc-900 shadow-2xs transition-colors cursor-pointer flex items-center gap-2 shrink-0 focus-visible:ring-1 focus-visible:ring-zinc-400">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900 text-white shrink-0 shadow-2xs">
              <GitFork className="h-3 w-3" />
            </div>
            <span className="truncate flex-1 text-left text-xs font-semibold text-zinc-900">
              {activeWorkflow.name}
            </span>
            <span className="hidden sm:inline-flex text-[10px] text-zinc-400 font-normal px-1.5 py-0.5 rounded bg-zinc-100/90 shrink-0">
              {activeWorkflow.nodes.length} steps
            </span>
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            align="start"
            sideOffset={6}
            className="w-[320px] sm:w-[380px] rounded-2xl border border-zinc-200/90 bg-white p-1.5 shadow-xl"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 mb-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <GitFork className="h-3 w-3 text-zinc-400" />
                <span>Workflows</span>
              </div>
              <span className="text-[10px] font-medium text-zinc-400">
                {workflows.length} blueprints
              </span>
            </div>
            <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
              {workflows.map((wf) => {
                const isSelected = wf.id === activeWorkflow.id;
                const hostname = getHostname(wf.targetUrl);
                return (
                  <SelectItem
                    key={wf.id}
                    value={wf.id}
                    className={`group rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50/70 text-emerald-950 font-semibold"
                        : "text-zinc-700 hover:bg-zinc-100/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 w-full min-w-0 pr-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200 group-hover:text-zinc-700"
                        }`}
                      >
                        <GitFork className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="truncate text-xs font-semibold text-zinc-900 max-w-[230px]">
                          {wf.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-normal">
                          {wf.nodes.length} nodes{hostname ? ` • ${hostname}` : ""}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          </SelectContent>
        </Select>

        {/* Save Button with Tooltip */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="sm"
                onClick={() => saveWorkflow()}
                disabled={isSaving}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer h-8 shadow-2xs shrink-0 ${getSaveStatusBadgeColor(
                  saveStatus
                )} disabled:opacity-50`}
              >
                {getSaveButtonContent(saveStatus, isSaving)}
              </Button>
            }
          />
          <TooltipContent side="bottom" sideOffset={6}>
            <span className="font-semibold block">Save Blueprint</span>
            <span className="text-zinc-400 text-[10px] block">Persist nodes, edges and settings to database</span>
          </TooltipContent>
        </Tooltip>

        {/* Sync Status Badge with Tooltip */}
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[11px] font-medium text-zinc-500 h-8 cursor-help">
                {isSyncing ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-amber-700 text-[10px] font-semibold">Syncing</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-600 text-[10px] font-medium">Synced</span>
                  </>
                )}
              </div>
            }
          />
          <TooltipContent side="bottom" sideOffset={6}>
            <span className="font-semibold block">
              {isSyncing ? "Syncing..." : "Database Synchronized"}
            </span>
            <span className="text-zinc-400 text-[10px] block">
              All workflow state is saved and in sync
            </span>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right: Actions Segmented Group + AI Generate + Console + Run Workflow */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Utility Action Group: Settings, Schedule, New */}
        <div className="flex items-center rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-0.5 shadow-2xs h-8">
          {isAdmin && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onOpenAdminModal}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium text-amber-800 hover:bg-amber-100/60 transition-colors cursor-pointer"
                  >
                    <span>⚙️</span>
                  </button>
                }
              />
              <TooltipContent side="bottom" sideOffset={6}>
                <span className="font-semibold block">Admin Node Studio</span>
                <span className="text-zinc-400 text-[10px] block">Manage, create or customize Free/PRO nodes</span>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Settings Button + Tooltip */}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onOpenEditModal}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 hover:bg-white hover:shadow-2xs hover:text-zinc-900 transition-all cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              }
            />
            <TooltipContent side="bottom" sideOffset={6}>
              <span className="font-semibold block">Workflow Settings</span>
              <span className="text-zinc-400 text-[10px] block">Edit workflow name, target URL & description</span>
            </TooltipContent>
          </Tooltip>

          {/* Schedule Button + Tooltip */}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onOpenScheduleSheet}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 hover:bg-white hover:shadow-2xs hover:text-zinc-900 transition-all cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5" />
                </button>
              }
            />
            <TooltipContent side="bottom" sideOffset={6}>
              <span className="font-semibold block">Automated Schedule</span>
              <span className="text-zinc-400 text-[10px] block">Set up recurring cron runs & automated execution</span>
            </TooltipContent>
          </Tooltip>

          {/* New Workflow Button + Tooltip */}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onOpenCreateView}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 hover:bg-white hover:shadow-2xs hover:text-zinc-900 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              }
            />
            <TooltipContent side="bottom" sideOffset={6}>
              <span className="font-semibold block">New Blueprint</span>
              <span className="text-zinc-400 text-[10px] block">Create a fresh workflow automation graph</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* AI Generate Button with Tooltip */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="sm"
                onClick={onOpenAiGenerate}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition-colors cursor-pointer shadow-2xs h-8 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span className="hidden sm:inline">AI Generate</span>
              </Button>
            }
          />
          <TooltipContent side="bottom" sideOffset={6}>
            <span className="font-semibold block">AI Workflow Generator</span>
            <span className="text-zinc-400 text-[10px] block">Describe your automation goal to generate nodes</span>
          </TooltipContent>
        </Tooltip>

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
