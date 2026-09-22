'use client';

import React from 'react';

interface SessionRelayFooterProps {
  currentTargetUrl: string;
}

export function SessionRelayFooter({
  currentTargetUrl,
}: SessionRelayFooterProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1 bg-zinc-900/70 border-t border-zinc-800 text-[10px] text-zinc-500 shrink-0 font-mono">
      <span className="truncate">Active Origin: {currentTargetUrl}</span>
      <span className="text-emerald-500 font-semibold">
        Stagehand V4 Cloud Agent
      </span>
    </div>
  );
}
