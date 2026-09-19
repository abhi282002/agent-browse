import React from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { WorkflowShowcase } from "@/components/workflow/WorkflowShowcase";
import { BotIcon, ShieldCheckIcon, TerminalIcon, ExternalLinkIcon, GitHubIcon, SparklesIcon } from "@/components/ui/icons";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-2xs">
              <BotIcon className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-zinc-900">
                AgentBrowse
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 border border-zinc-200">
                Cloud VM Preview
              </span>
            </div>
          </div>

          {/* Center Sandbox Status */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-zinc-200/80 bg-zinc-50/80 px-3 py-1 text-xs text-zinc-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-zinc-800">Cluster 01</span>
            <span className="text-zinc-400">•</span>
            <span>Chromium 128 (CDP)</span>
            <span className="text-zinc-400">•</span>
            <span className="text-emerald-700 font-mono text-[11px]">99.98% Uptime</span>
          </div>

          {/* Right Links */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <Link
              href="/workflow"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>Workflow Studio</span>
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
            <a
              href="#docs"
              className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <TerminalIcon className="h-3.5 w-3.5" />
              <span>Docs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8 sm:py-12">
        {/* Intro Subhead */}
        <div className="mb-8 text-center sm:text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 border border-zinc-200/80 shadow-2xs mb-3">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Browser Automation with Autonomous AI Agents</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
            Give AI agents the keys to the web.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-600 leading-relaxed">
            Provision cloud browsers, inspect live DOM trees, bypass captchas, and automate complex web journeys with end-to-end telemetry and deterministic controls.
          </p>
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Auth Card + Highlights */}
          <div className="xl:col-span-4 flex flex-col gap-6 order-2 xl:order-1">
            <AuthCard />

            {/* Platform metrics & trust card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-800">
                <span>Infrastructure Telemetry</span>
                <span className="text-emerald-600 text-[11px] font-mono">Live Sync</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-100">
                  <div className="text-[10px] uppercase font-medium text-zinc-400">Actions Today</div>
                  <div className="text-lg font-bold text-zinc-900 mt-0.5">4,819,204</div>
                  <div className="text-[10px] text-emerald-600 font-medium">↑ 14% vs yesterday</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-100">
                  <div className="text-[10px] uppercase font-medium text-zinc-400">Avg. Step Latency</div>
                  <div className="text-lg font-bold text-zinc-900 mt-0.5">48ms</div>
                  <div className="text-[10px] text-zinc-500">Sub-second DOM parsing</div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                  <span>Encrypted CDP Proxy</span>
                </span>
                <a href="#security" className="text-zinc-700 hover:text-zinc-900 font-medium flex items-center gap-1 text-[11px]">
                  <span>Security Whitepaper</span>
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Workflow Demonstration */}
          <div className="xl:col-span-8 order-1 xl:order-2">
            <WorkflowShowcase />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-200/80 bg-white/70 py-6 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BotIcon className="h-4 w-4 text-zinc-800" />
            <span className="font-semibold text-zinc-800">AgentBrowse Inc.</span>
            <span>— The open runtime for web agents.</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span>SOC-2 Type II</span>
            <span>•</span>
            <span>GDPR Compliant</span>
            <span>•</span>
            <span>Zero Data Retention Sandbox</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
