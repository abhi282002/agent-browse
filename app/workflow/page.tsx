import React from "react";
import Link from "next/link";
import { WorkflowDashboard } from "@/components/workflow/flow/WorkflowDashboard";
import { BotIcon, GitHubIcon } from "@/components/ui/icons";

export const metadata = {
  title: "Workflow Studio — AgentBrowse",
  description: "Interactive React Flow graph editor and execution pipeline for autonomous browser agents.",
};

export default function WorkflowPage() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Left: Brand & Back link */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-2xs">
                <BotIcon className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-zinc-900">
                AgentBrowse
              </span>
            </Link>

            <span className="text-zinc-300">/</span>

            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Workflow Studio</span>
            </span>
          </div>

          {/* Center Cluster status */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-zinc-200/80 bg-zinc-50/80 px-3 py-1 text-xs text-zinc-600">
            <span className="font-medium text-zinc-800">Cluster 01</span>
            <span className="text-zinc-400">•</span>
            <span>CDP Session Active</span>
            <span className="text-zinc-400">•</span>
            <span className="text-emerald-700 font-mono text-[11px]">Online</span>
          </div>

          {/* Right Navigation Actions */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <Link
              href="/"
              className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <span>← Back to Overview</span>
            </Link>
            <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
            <a
              href="https://github.com/abhi282002/agent-browse"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
      <footer className="mt-8 border-t border-zinc-200/80 bg-white/70 py-4 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
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
