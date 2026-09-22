'use client';

import React from 'react';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SessionPageItem {
  pageId: string;
  url?: string;
  title?: string;
  startTimeMs?: number;
  endTimeMs?: number;
}

interface SessionPagesBarProps {
  pages: SessionPageItem[];
  activePageId?: string;
  onSelectPage: (pageId: string) => void;
}

export function SessionPagesBar({
  pages,
  activePageId,
  onSelectPage,
}: SessionPagesBarProps) {
  if (!pages || pages.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-xs shrink-0 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 shrink-0">
          <Film className="h-3.5 w-3.5 text-emerald-400" />
          <span>Pages ({pages.length}):</span>
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto py-0.5">
          {pages.map((page, index) => {
            const isSelected = activePageId === page.pageId;
            const displayTitle =
              page.title ||
              (page.url ? page.url.replace(/^https?:\/\//, '') : `Page ${index + 1}`);

            return (
              <Button
                key={page.pageId}
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => onSelectPage(page.pageId)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer shrink-0 border h-auto ${
                  isSelected
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 shadow-xs font-semibold hover:bg-emerald-950'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}
                title={`Page ${index + 1}: ${page.url || page.pageId}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-emerald-400' : 'bg-zinc-600'
                  }`}
                />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {index + 1}. {displayTitle}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
      {activePageId && (
        <span className="text-[10px] font-mono text-zinc-500 shrink-0 hidden sm:inline-block">
          ID: {activePageId.slice(0, 8)}...
        </span>
      )}
    </div>
  );
}
