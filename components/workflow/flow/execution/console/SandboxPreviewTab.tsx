'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface SandboxPreviewTabProps {
  isRunning: boolean;
  currentTargetUrl: string;
  currentStepTitle?: string;
}

export function SandboxPreviewTab({
  isRunning,
  currentTargetUrl,
  currentStepTitle,
}: SandboxPreviewTabProps) {
  return (
    <div className="h-full w-full flex flex-col p-4 overflow-y-auto space-y-4">
      {/* Live sandbox specs card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Cloud Chromium Sandbox Telemetry</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            Puppeteer / CDP v128
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-mono">
              Status
            </div>
            <div className="text-emerald-400 font-bold mt-0.5">
              {isRunning ? 'Running' : 'Idle'}
            </div>
          </div>
          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-mono">
              Resolution
            </div>
            <div className="text-zinc-200 font-mono font-bold mt-0.5">
              1280x800
            </div>
          </div>
          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-mono">
              Anti-Bot
            </div>
            <div className="text-emerald-400 font-bold mt-0.5">
              Stealth Enabled
            </div>
          </div>
          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-mono">
              Live CDP Port
            </div>
            <div className="text-zinc-200 font-mono font-bold mt-0.5">
              9222 (WSS)
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1">
            Active Target URL
          </div>
          <div className="text-zinc-200 truncate">{currentTargetUrl}</div>
        </div>

        {currentStepTitle && (
          <div className="text-xs text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
            <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1">
              Current Action
            </div>
            <div className="text-emerald-400">{currentStepTitle}</div>
          </div>
        )}
      </div>
    </div>
  );
}
