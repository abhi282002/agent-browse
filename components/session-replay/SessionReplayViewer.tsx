'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Film,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { BrowserReplay } from '@/components/VideoPlayer/BrowserSessionReplay';
import { SessionPagesBar, type SessionPageItem } from '@/components/workflow/flow/execution/console/SessionPagesBar';
import { RecentSessionsPicker } from './RecentSessionsPicker';

interface SessionReplayViewerProps {
  initialSessionId?: string;
  initialPageId?: string;
}

export function SessionReplayViewer({
  initialSessionId = '',
  initialPageId = '',
}: SessionReplayViewerProps) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    initialPageId || null,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // Query pages for the selected session
  const fetchSessionPages = trpc.execution.fetchSessionPages.useQuery(
    { sessionId: sessionId || '' },
    {
      enabled: !!sessionId,
    },
  );

  const pages: SessionPageItem[] =
    (fetchSessionPages.data as SessionPageItem[]) || [];

  // Active page ID selection
  const activePageId =
    (selectedPageId && pages.some((p) => p.pageId === selectedPageId))
      ? selectedPageId
      : pages[0]?.pageId;

  const activePage = pages.find((p) => p.pageId === activePageId);

  const handleCopy = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
    fetchSessionPages.refetch();
  };

  const durationSec =
    activePage?.startTimeMs !== undefined && activePage?.endTimeMs !== undefined
      ? ((activePage.endTimeMs - activePage.startTimeMs) / 1000).toFixed(1)
      : null;

  return (
    <div
      className={`flex flex-col gap-6 w-full ${
        isFullscreen ? 'fixed inset-0 z-50 bg-zinc-950 p-4' : ''
      }`}
    >
      {/* Top Controls & Session Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
            <Film className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-zinc-100">
                Session Replay Stream
              </span>
              {sessionId && (
                <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-md px-2 py-0.5">
                  <span className="font-mono text-xs text-zinc-300 truncate max-w-[200px] sm:max-w-[320px]">
                    {sessionId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-zinc-500 hover:text-zinc-200 p-0.5 transition-colors cursor-pointer"
                    title="Copy Session ID"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
              <span>Pages: {pages.length}</span>
              {durationSec && (
                <>
                  <span>•</span>
                  <span>Duration: {durationSec}s</span>
                </>
              )}
              {activePage?.url && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[240px] text-zinc-300">
                    {activePage.url}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {sessionId && (
            <a
              href={`https://browserbase.com/sessions/${sessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors shadow-xs"
            >
              <span>Browserbase Inspector</span>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
            </a>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Reload Video Stream"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Theater Fullscreen' : 'Theater Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Pages Navigation Toolbar */}
      {pages.length > 0 && (
        <SessionPagesBar
          pages={pages}
          activePageId={activePageId}
          onSelectPage={setSelectedPageId}
        />
      )}

      {/* Main Large Theater Video Player */}
      <div className="relative w-full bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex items-center justify-center min-h-[500px] lg:min-h-[640px]">
        {sessionId && activePageId ? (
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
            <BrowserReplay
              key={`${sessionId}-${activePageId}-${reloadKey}`}
              sessionId={sessionId}
              pageId={activePageId}
              autoPlay={false}
              className="w-full max-h-[75vh] object-contain rounded-xl shadow-xl"
            />
          </div>
        ) : fetchSessionPages.isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400 gap-3">
            <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
            <span className="text-sm font-semibold text-zinc-200">
              Retrieving session recordings...
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              Loading playlist manifest from Browserbase
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center max-w-md gap-3">
            <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
              <Film className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-zinc-200">
              {sessionId
                ? 'No Replay Video Available Yet'
                : 'Select a Session to View Replay'}
            </h3>
            <p className="text-xs text-zinc-400">
              {sessionId
                ? 'This session may still be in progress, or recordings are still being encoded by Browserbase.'
                : 'Choose a session from the list below or paste a Browserbase session ID to stream the recording in full-screen theater quality.'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Row: Recent Sessions Selector & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Recent Sessions Picker */}
        <div className="lg:col-span-2">
          <RecentSessionsPicker
            selectedSessionId={sessionId}
            onSelectSession={(newId) => {
              setSessionId(newId);
              setSelectedPageId(null);
            }}
          />
        </div>

        {/* Right Col: Session Specs Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Replay Information</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                HLS VOD Stream
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
                <div className="text-zinc-500 text-[10px] uppercase">
                  Session ID
                </div>
                <div className="text-zinc-200 truncate mt-0.5">
                  {sessionId || 'None selected'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px] uppercase">
                    Page ID
                  </div>
                  <div className="text-emerald-400 font-semibold mt-0.5">
                    {activePageId || 'N/A'}
                  </div>
                </div>
                <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px] uppercase">
                    Duration
                  </div>
                  <div className="text-zinc-200 mt-0.5">
                    {durationSec ? `${durationSec}s` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 border-t border-zinc-800/80 pt-3">
            Recordings stream fragmented MP4 (.m4s) segments via Browserbase Cloud CDN using Hls.js.
          </div>
        </div>
      </div>
    </div>
  );
}
