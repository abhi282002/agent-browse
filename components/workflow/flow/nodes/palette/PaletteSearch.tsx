'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface PaletteSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export const PaletteSearch: React.FC<PaletteSearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Search actions, triggers, AI..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 pl-8 pr-7 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white dark:focus:bg-zinc-900 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
