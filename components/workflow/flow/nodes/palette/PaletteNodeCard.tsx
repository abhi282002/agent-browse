'use client';

import React from 'react';
import { GripVertical, Plus } from 'lucide-react';
import type { NodeTemplate } from '../../types';
import { ARCHETYPE_STYLES } from './paletteTypes';

interface PaletteNodeCardProps {
  template: NodeTemplate;
  isSelected: boolean;
  onClick: () => void;
}

export const PaletteNodeCard: React.FC<PaletteNodeCardProps> = ({ template, isSelected, onClick }) => {
  const style = ARCHETYPE_STYLES[template.archetype] ?? {
    icon: '⚡',
    badge: 'bg-zinc-50 text-zinc-600 border-zinc-200',
    iconBg: 'bg-zinc-100 text-zinc-600',
    borderHover: 'hover:border-zinc-300',
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/agentbrowse-node', JSON.stringify(template));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={onClick}
      className={`group relative flex cursor-grab active:cursor-grabbing items-center gap-2.5 rounded-xl border p-2 transition-all select-none ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-400'
          : `border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${style.borderHover} hover:bg-zinc-50/80 hover:shadow-xs`
      }`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${style.iconBg} shadow-2xs`}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {template.title}
          </span>
          <span className={`shrink-0 rounded px-1.5 py-0.2 text-[8px] font-mono uppercase font-semibold border ${style.badge}`}>
            {template.archetype}
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
          {template.description || template.actionSummary}
        </p>
      </div>
      <div className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
        <Plus className="h-3.5 w-3.5 hover:text-emerald-600" />
      </div>
    </div>
  );
};
