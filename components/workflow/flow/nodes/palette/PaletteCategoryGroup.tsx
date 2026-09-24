'use client';

import React from 'react';
import type { NodeTemplate } from '../../types';
import { PaletteNodeItem } from './PaletteNodeItem';

interface PaletteCategoryGroupProps {
  category: string;
  templates: NodeTemplate[];
  selectedKey: string | null;
  onSelectKey: (key: string | null) => void;
  onAddFromForm: (
    tpl: NodeTemplate,
    overrides: { url: string; actionSummary: string; title: string },
  ) => void;
}

export const PaletteCategoryGroup: React.FC<PaletteCategoryGroupProps> = ({
  category,
  templates,
  selectedKey,
  onSelectKey,
  onAddFromForm,
}) => {
  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          {category}
        </span>
        <span className="text-[9px] font-mono text-zinc-400">
          {templates.length}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {templates.map((tpl) => {
          const key = `${tpl.id ?? tpl.title}::${tpl.archetype}`;
          const isSelected = selectedKey === key;
          return (
            <PaletteNodeItem
              key={key}
              template={tpl}
              isSelected={isSelected}
              onSelect={() => onSelectKey(isSelected ? null : key)}
              onCancel={() => onSelectKey(null)}
              onAddFromForm={onAddFromForm}
            />
          );
        })}
      </div>
    </div>
  );
};
