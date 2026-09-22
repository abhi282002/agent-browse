'use client';

import React, { useState } from 'react';
import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';
import { trpc } from '@/lib/trpc/client';
import {
  SessionRelayHeader,
  type SessionRelayTabType,
} from './SessionRelayHeader';
import { SessionPagesBar, type SessionPageItem } from './SessionPagesBar';
import { SessionReplayTab } from './SessionReplayTab';
import { SandboxPreviewTab } from './SandboxPreviewTab';
import { StepTelemetryTab } from './StepTelemetryTab';
import { SessionRelayFooter } from './SessionRelayFooter';

interface BrowserbaseSessionRelayProps {
  sessionId?: string;
  liveViewUrl?: string;
  isRunning: boolean;
  activeUrl?: string;
  currentStepTitle?: string;
  executionResult?: WorkflowExecutionResult | null;
}

export function BrowserbaseSessionRelay({
  sessionId,
  liveViewUrl,
  isRunning,
  activeUrl,
  currentStepTitle,
  executionResult,
}: BrowserbaseSessionRelayProps) {
  const [activeTab, setActiveTab] = useState<SessionRelayTabType>('relay');
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const displaySessionId = sessionId || executionResult?.sessionId;
  const displayLiveUrl = liveViewUrl || executionResult?.liveViewUrl;
  const currentTargetUrl =
    activeUrl || executionResult?.targetUrl || 'https://browserbase.com';

  const fetchSessionPages = trpc.execution.fetchSessionPages.useQuery(
    { sessionId: displaySessionId || '' },
    {
      enabled: !!displaySessionId,
      refetchInterval: (query) => {
        // Automatically poll for pages if session is running or if no pages found yet
        if (isRunning || (query.state.data && query.state.data.length === 0)) {
          return 3000;
        }
        return false;
      },
    },
  );

  const pages: SessionPageItem[] =
    (fetchSessionPages.data as SessionPageItem[]) || [];

  // Determine active page ID (default to first page if not explicitly selected)
  const activePageId =
    (selectedPageId && pages.some((p) => p.pageId === selectedPageId))
      ? selectedPageId
      : pages[0]?.pageId;

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
    fetchSessionPages.refetch();
  };

  return (
    <div
      className={`flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans ${
        isFullscreen ? 'fixed inset-0 z-50 bg-zinc-950' : ''
      }`}
    >
      {/* Top Header Bar */}
      <SessionRelayHeader
        displaySessionId={displaySessionId}
        displayLiveUrl={displayLiveUrl}
        isRunning={isRunning}
        hasExecutionResult={!!executionResult}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={handleRefresh}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* Interactive Session Pages Navigation Bar */}
      <SessionPagesBar
        pages={pages}
        activePageId={activePageId}
        onSelectPage={setSelectedPageId}
      />

      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden bg-zinc-950 flex flex-col">
        {activeTab === 'relay' && (
          <SessionReplayTab
            displaySessionId={displaySessionId}
            activePageId={activePageId}
            isLoadingPages={fetchSessionPages.isLoading}
            isRunning={isRunning}
            currentTargetUrl={currentTargetUrl}
            displayLiveUrl={displayLiveUrl}
            reloadKey={reloadKey}
          />
        )}

        {activeTab === 'sandbox' && (
          <SandboxPreviewTab
            isRunning={isRunning}
            currentTargetUrl={currentTargetUrl}
            currentStepTitle={currentStepTitle}
          />
        )}

        {activeTab === 'telemetry' && (
          <StepTelemetryTab executionResult={executionResult} />
        )}
      </div>

      {/* Footer Info Bar */}
      <SessionRelayFooter currentTargetUrl={currentTargetUrl} />
    </div>
  );
}

