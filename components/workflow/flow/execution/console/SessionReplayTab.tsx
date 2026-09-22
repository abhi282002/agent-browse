'use client';

import React from 'react';
import { ExternalLink, Lock, Wifi, Loader2 } from 'lucide-react';
import { ChromeIcon } from '@/components/ui/icons';
import { BrowserReplay } from '@/components/VideoPlayer/BrowserSessionReplay';

interface SessionReplayTabProps {
  displaySessionId?: string;
  activePageId?: string;
  isLoadingPages: boolean;
  isRunning: boolean;
  currentTargetUrl: string;
  displayLiveUrl?: string;
  reloadKey?: number;
}

export function SessionReplayTab({
  displaySessionId,
  activePageId,
  isLoadingPages,
  isRunning,
  currentTargetUrl,
  displayLiveUrl,
  reloadKey = 0,
}: SessionReplayTabProps) {
  return (
    <div className="h-full w-full flex flex-col flex-1 overflow-hidden">
      {displaySessionId && activePageId ? (
        <div className="relative h-full w-full flex-1 flex flex-col p-2 bg-zinc-950">
          <BrowserReplay
            key={`${displaySessionId}-${activePageId}-${reloadKey}`}
            sessionId={displaySessionId}
            pageId={activePageId}
            className="w-full h-full max-h-full object-contain rounded-xl"
            autoPlay={isRunning}
          />
        </div>
      ) : isLoadingPages ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950/50">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mb-3" />
          <h4 className="text-sm font-semibold text-zinc-200">
            Retrieving Session Replay...
          </h4>
          <p className="text-xs text-zinc-400 max-w-sm mt-1">
            Connecting to Browserbase and fetching replay recordings.
          </p>
        </div>
      ) : (
        /* Fallback / Viewport simulation when replay is not yet available */
        <div className="flex-1 flex flex-col justify-between p-4 bg-zinc-900/40">
          {/* Browser address bar */}
          <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800 shadow-xs mb-3">
            <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-mono text-zinc-300 truncate flex-1">
              {currentTargetUrl}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
              <Wifi className="h-3 w-3 text-emerald-400" />
              <span>CDP 9222</span>
            </div>
          </div>

          {/* Viewport content area */}
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl p-8 text-center bg-zinc-950/50">
            <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-emerald-400">
              <ChromeIcon className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-200">
              {isRunning
                ? 'Browserbase Session in Progress'
                : displaySessionId
                  ? 'Replay Processing / Awaiting Pages'
                  : 'Session Standby / Relay Ready'}
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              {isRunning
                ? `Autonomous agent actively interacting with ${currentTargetUrl}. Video recording will become available as pages finish.`
                : displaySessionId
                  ? 'Session recorded. Video replay pages will appear once processing completes.'
                  : 'Run the workflow to allocate a cloud Chromium browser and stream the replay.'}
            </p>

            {displayLiveUrl && (
              <a
                href={displayLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-1.5 transition-colors shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Browserbase Session Inspector ↗</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
