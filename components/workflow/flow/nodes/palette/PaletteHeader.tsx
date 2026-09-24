'use client';

import React from 'react';
import { BotIcon, SparklesIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

interface PaletteHeaderProps {
  totalCount: number;
  onOpenCatalog: () => void;
}

export const PaletteHeader: React.FC<PaletteHeaderProps> = ({ totalCount, onOpenCatalog }) => {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-3.5 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs">
          <BotIcon className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
          Node Library
        </span>
        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-500">
          {totalCount}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onOpenCatalog}
        title="Open Full Node Catalog"
        className="text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50/60"
      >
        <SparklesIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
