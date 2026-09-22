"use client";

import React from "react";
import Link from "next/link";
import { BotIcon, GitHubIcon } from "@/components/ui/icons";
import { OrgSwitcher } from "@/components/organization/OrgSwitcher";

export function WorkflowNavbar() {
  return (
    <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex w-full max-w-[1880px] items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
        {/* Left: Brand & Studio indicator & Organization Switcher */}
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

          <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

          {/* Organization Switcher mounted in the Navbar (switch only on workflow page) */}
          <div className="flex items-center">
            <OrgSwitcher switchOnly />
          </div>
        </div>

        {/* Center: Cluster status */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-zinc-200/80 bg-zinc-50/80 px-3 py-1 text-xs text-zinc-600">
          <span className="font-medium text-zinc-800">Cluster 01</span>
          <span className="text-zinc-400">•</span>
          <span>CDP Session Active</span>
          <span className="text-zinc-400">•</span>
          <span className="text-emerald-700 font-mono text-[11px]">Online</span>
        </div>

        {/* Right: Navigation Actions */}
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
  );
}
