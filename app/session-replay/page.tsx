'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BotIcon, SparklesIcon } from '@/components/ui/icons';
import { SessionReplayViewer } from '@/components/session-replay/SessionReplayViewer';
import { Loader2 } from 'lucide-react';

function SessionReplayPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const pageId = searchParams.get('pageId') || '';

  return (
    <SessionReplayViewer
      initialSessionId={sessionId}
      initialPageId={pageId}
    />
  );
}

export default function SessionReplayPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex w-full max-w-[1880px] items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5">
          {/* Left: Brand & Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-white shadow-2xs">
                <BotIcon className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm font-bold tracking-tight text-zinc-100">
                AgentBrowse
              </span>
            </Link>

            <span className="text-zinc-700">/</span>

            <Link
              href="/workflow"
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Workflow Studio
            </Link>

            <span className="text-zinc-700">/</span>

            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Session Replay Theater</span>
            </span>
          </div>

          {/* Center Cluster status */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400 font-mono">
            <span className="text-zinc-300 font-medium">HLS Video VOD</span>
            <span className="text-zinc-600">•</span>
            <span>Cloud CDP Screencast</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400">Ready</span>
          </div>

          {/* Right Navigation Actions */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <Link
              href="/workflow"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-2xs"
            >
              <SparklesIcon className="h-3.5 w-3.5 text-emerald-200" />
              <span>Open Workflow Studio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Theater Content */}
      <main className="flex-1 mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8 flex flex-col">
        <Suspense
          fallback={
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-zinc-400 gap-3">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
              <span className="text-xs font-mono">Loading session replay theater...</span>
            </div>
          }
        >
          <SessionReplayPageContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-4 sm:px-6 py-4 text-center text-xs text-zinc-600 font-mono">
        AgentBrowse Autonomous Browser Sessions • Powered by Stagehand & Browserbase
      </footer>
    </div>
  );
}
