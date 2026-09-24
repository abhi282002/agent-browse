'use client';

import React from 'react';

const FILTER_PILLS = ['All', 'AI', 'Action', 'Browser', 'Data'] as const;

interface PaletteCategoryTabsProps {
  selected: string;
  onSelect: (cat: string) => void;
}

export const PaletteCategoryTabs: React.FC<PaletteCategoryTabsProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-3 py-1.5 scrollbar-none border-b border-zinc-100 dark:border-zinc-800/60">
      {FILTER_PILLS.map((pill) => {
        const isActive = selected === pill;
        return (
          <button
            key={pill}
            onClick={() => onSelect(pill)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
              isActive
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs font-semibold'
                : 'bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70'
            }`}
          >
            {pill}
          </button>
        );
      })}
    </div>
  );
};
