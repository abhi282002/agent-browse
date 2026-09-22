'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  Video,
  Monitor,
  Database,
  Radio,
} from 'lucide-react';
import { ChromeIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

export type SessionRelayTabType = 'relay' | 'sandbox' | 'telemetry';

interface SessionRelayHeaderProps {
  displaySessionId?: string;
  displayLiveUrl?: string;
  isRunning: boolean;
  hasExecutionResult: boolean;
  activeTab: SessionRelayTabType;
  onTabChange: (tab: SessionRelayTabType) => void;
  onRefresh: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function SessionRelayHeader({
  displaySessionId,
  displayLiveUrl,
  isRunning,
  hasExecutionResult,
  activeTab,
  onTabChange,
  onRefresh,
  isFullscreen,
  onToggleFullscreen,
}: SessionRelayHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs shrink-0 flex-wrap">
      {/* Left: Provider & Session Info */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 font-bold text-zinc-200">
          <ChromeIcon className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="truncate">Browserbase Session Relay</span>
        </div>

        {displaySessionId && (
          <span
            className="rounded bg-zinc-800 text-zinc-300 px-2 py-0.5 font-mono text-[11px] truncate max-w-[140px] sm:max-w-[180px]"
            title={`Session ID: ${displaySessionId}`}
          >
            {displaySessionId}
          </span>
        )}

        {/* Live indicator badge */}
        <div className="flex items-center gap-1 text-[11px]">
          {isRunning ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-0.5 font-semibold text-emerald-400 border border-emerald-800/60">
              <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
              <span>LIVE CDP</span>
            </span>
          ) : hasExecutionResult ? (
            <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-400">
              <span>Recorded Session</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-zinc-500 border border-zinc-800">
              <span>Standby</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: View Mode Tabs */}
      <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-md border border-zinc-800 text-[11px]">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => onTabChange('relay')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer h-auto ${
            activeTab === 'relay'
              ? 'bg-zinc-800 text-white font-semibold hover:bg-zinc-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Video className="h-3 w-3" />
          <span>Relay Video</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => onTabChange('sandbox')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer h-auto ${
            activeTab === 'sandbox'
              ? 'bg-zinc-800 text-white font-semibold hover:bg-zinc-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Monitor className="h-3 w-3" />
          <span>Sandbox Preview</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => onTabChange('telemetry')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer h-auto ${
            activeTab === 'telemetry'
              ? 'bg-zinc-800 text-white font-semibold hover:bg-zinc-800'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Database className="h-3 w-3" />
          <span>Step Telemetry</span>
        </Button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 ml-auto">
        {displaySessionId && (
          <Link
            href={`/session-replay?sessionId=${encodeURIComponent(displaySessionId)}`}
            target="_blank"
            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-[11px] font-medium transition-colors"
            title="Open large session replay theater in a new tab"
          >
            <span>Theater</span>
            <ExternalLink className="h-3 w-3 text-emerald-400" />
          </Link>
        )}

        {displayLiveUrl && (
          <a
            href={displayLiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-[11px] font-medium transition-colors"
            title="Open full session debugger in Browserbase"
          >
            <span>Browserbase</span>
            <ExternalLink className="h-3 w-3 text-zinc-400" />
          </a>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onRefresh}
          className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer h-auto w-auto"
          title="Reload session relay stream"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onToggleFullscreen}
          className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer h-auto w-auto"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Relay'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
