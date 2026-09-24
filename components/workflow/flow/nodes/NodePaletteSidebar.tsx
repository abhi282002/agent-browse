'use client';

import React from 'react';
import type { NodeTemplate } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaletteHeader } from './palette/PaletteHeader';
import { PaletteSearch } from './palette/PaletteSearch';
import { PaletteCategoryTabs } from './palette/PaletteCategoryTabs';
import { PaletteCategoryGroup } from './palette/PaletteCategoryGroup';
import { PaletteEmptyState } from './palette/PaletteEmptyState';
import { usePaletteFilter } from './palette/usePaletteFilter';

interface NodePaletteSidebarProps {
  onAddNode: (
    template: NodeTemplate,
    overrides?: { url?: string; actionSummary?: string; title?: string },
  ) => void;
  onOpenCatalog: () => void;
}

export function NodePaletteSidebar({ onAddNode, onOpenCatalog }: NodePaletteSidebarProps) {
  const { search, setSearch, selectedTab, setSelectedTab, selectedKey, setSelectedKey, grouped, templates, isLoading } =
    usePaletteFilter();
  const categoryKeys = Object.keys(grouped);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 shadow-xs overflow-hidden">
      <PaletteHeader totalCount={templates.length} onOpenCatalog={onOpenCatalog} />
      <PaletteSearch value={search} onChange={setSearch} />
      <PaletteCategoryTabs selected={selectedTab} onSelect={setSelectedTab} />

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2.5">
          {categoryKeys.length === 0 && !isLoading ? (
            <PaletteEmptyState
              hasSearch={Boolean(search)}
              onClearSearch={() => setSearch('')}
              onOpenCatalog={onOpenCatalog}
            />
          ) : (
            categoryKeys.map((cat) => (
              <PaletteCategoryGroup
                key={cat}
                category={cat}
                templates={grouped[cat]}
                selectedKey={selectedKey}
                onSelectKey={setSelectedKey}
                onAddFromForm={(tpl, overrides) => {
                  onAddNode(tpl, overrides);
                  setSelectedKey(null);
                }}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
