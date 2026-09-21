'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react';
import { SparklesIcon } from '@/components/ui/icons';

interface LiveblocksStatusContextValue {
  isConfigured: boolean;
  isLoading: boolean;
  roomId: string;
}

const LiveblocksStatusContext = createContext<LiveblocksStatusContextValue>({
  isConfigured: false,
  isLoading: true,
  roomId: '',
});

export const useLiveblocksStatus = () => useContext(LiveblocksStatusContext);

export interface LiveblocksWorkflowProviderProps {
  workflowId: string;
  children: React.ReactNode;
  fallback: React.ReactNode;
}

// Module-level cache for auth configuration status to prevent re-fetching on room switches
let liveblocksConfiguredCache: boolean | null = null;
let liveblocksConfiguredPromise: Promise<boolean> | null = null;

function checkLiveblocksConfigured(): Promise<boolean> {
  if (liveblocksConfiguredCache !== null) {
    return Promise.resolve(liveblocksConfiguredCache);
  }
  if (!liveblocksConfiguredPromise) {
    liveblocksConfiguredPromise = fetch('/api/liveblocks-auth')
      .then((res) => res.json())
      .then((data) => {
        liveblocksConfiguredCache = Boolean(data?.configured);
        return liveblocksConfiguredCache;
      })
      .catch(() => {
        liveblocksConfiguredCache = false;
        return false;
      });
  }
  return liveblocksConfiguredPromise;
}

export function LiveblocksWorkflowProvider({
  workflowId,
  children,
  fallback,
}: LiveblocksWorkflowProviderProps) {
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY?.trim();
  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    if (publicKey) return true;
    return liveblocksConfiguredCache ?? false;
  });
  const [checkingConfig, setCheckingConfig] = useState<boolean>(() => {
    if (publicKey) return false;
    return liveblocksConfiguredCache === null;
  });

  const safeRoomId = `workflow-${workflowId}`;

  useEffect(() => {
    if (publicKey || liveblocksConfiguredCache !== null) {
      return;
    }

    let isMounted = true;
    checkLiveblocksConfigured().then((configured) => {
      if (isMounted) {
        setIsConfigured(configured);
        setCheckingConfig(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [publicKey]);

  // While checking config, show subtle loading indicator
  if (checkingConfig) {
    return (
      <div className="relative h-[calc(100vh-190px)] min-h-[570px] w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/50 flex flex-col items-center justify-center gap-2 shadow-xs">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-800" />
        <span className="text-xs text-zinc-500">Initializing workspace session...</span>
      </div>
    );
  }

  // If Liveblocks is not configured, gracefully render fallback with a setup banner
  if (!isConfigured) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {/* Notice for enabling live multiplayer */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-4 py-2 text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong>Real-Time Multiplayer Available:</strong> To enable live collaborative editing, shared cursor tracking, and presence, add <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px] text-blue-900">LIVEBLOCKS_SECRET_KEY</code> to your <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px] text-blue-900">.env</code>.
            </span>
          </div>
          <span className="rounded-md border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            Local Mode Active
          </span>
        </div>

        {/* Fallback to standard React Flow canvas */}
        {fallback}
      </div>
    );
  }

  // Active Liveblocks Multiplayer mode
  const content = (
    <RoomProvider id={safeRoomId}>
      <LiveblocksStatusContext.Provider
        value={{
          isConfigured: true,
          isLoading: false,
          roomId: safeRoomId,
        }}
      >
        {children}
      </LiveblocksStatusContext.Provider>
    </RoomProvider>
  );

  return publicKey ? (
    <LiveblocksProvider publicApiKey={publicKey}>{content}</LiveblocksProvider>
  ) : (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      {content}
    </LiveblocksProvider>
  );
}
