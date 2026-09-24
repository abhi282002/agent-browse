'use client';

import React from 'react';
import type { NodeTemplate } from '../../types';
import { PaletteNodeCard } from './PaletteNodeCard';
import { NodeAddForm } from '../NodeAddForm';

interface PaletteNodeItemProps {
  template: NodeTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onCancel: () => void;
  onAddFromForm: (
    tpl: NodeTemplate,
    overrides: { url: string; actionSummary: string; title: string },
  ) => void;
}

export const PaletteNodeItem: React.FC<PaletteNodeItemProps> = ({
  template,
  isSelected,
  onSelect,
  onCancel,
  onAddFromForm,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <PaletteNodeCard
        template={template}
        isSelected={isSelected}
        onClick={onSelect}
      />
      {isSelected && (
        <NodeAddForm
          template={template}
          onAdd={onAddFromForm}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};
