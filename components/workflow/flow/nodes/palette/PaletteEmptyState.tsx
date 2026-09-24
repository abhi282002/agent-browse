'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface PaletteEmptyStateProps {
  hasSearch: boolean;
  onClearSearch: () => void;
  onOpenCatalog: () => void;
}

export const PaletteEmptyState: React.FC<PaletteEmptyStateProps> = ({
  hasSearch,
  onClearSearch,
  onOpenCatalog,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        {hasSearch ? 'No matching nodes' : 'No templates available'}
      </p>
      <p className="text-[11px] text-zinc-400 mt-1 max-w-[180px]">
        {hasSearch ? 'Try a different keyword or category' : 'Browse full catalog to add templates'}
      </p>
      <div className="flex items-center gap-2 mt-3">
        {hasSearch && (
          <Button variant="outline" size="xs" onClick={onClearSearch} className="text-[11px]">
            Clear
          </Button>
        )}
        <Button variant="default" size="xs" onClick={onOpenCatalog} className="text-[11px]">
          Catalog
        </Button>
      </div>
    </div>
  );
};
