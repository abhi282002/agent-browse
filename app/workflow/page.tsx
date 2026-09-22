import React from "react";
import { WorkflowNavbar } from "@/components/workflow/WorkflowNavbar";
import { WorkflowDashboard } from "@/components/workflow/flow/WorkflowDashboard";

export const metadata = {
  title: "Workflow Studio — AgentBrowse",
  description: "Interactive React Flow graph editor and execution pipeline for autonomous browser agents.",
};

export default function WorkflowPage() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col justify-between">
      {/* Top Navigation */}
      <WorkflowNavbar />

      {/* Main Studio Viewport */}
      <main className="mx-auto w-full max-w-[1880px] flex-1 px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900">
              Agent Workflow Studio
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Design, inspect, and execute multi-step browser automation graphs with real-time telemetry.
            </p>
          </div>
        </div>

        {/* Workflow Dashboard (Canvas with Grid View + Right Sidebar + Modal) */}
        <WorkflowDashboard />
      </main>

      {/* Footer */}
      <footer className="mt-6 border-t border-zinc-200/80 bg-white/70 py-3 text-xs text-zinc-500">
        <div className="mx-auto flex w-full max-w-[1880px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800">AgentBrowse Studio</span>
            <span>— Autonomous Browser Automation Runtime</span>
          </div>
          <div className="text-zinc-400 text-[11px] font-mono">
            React Flow v12 • CDP v128
          </div>
        </div>
      </footer>
    </div>
  );
}
