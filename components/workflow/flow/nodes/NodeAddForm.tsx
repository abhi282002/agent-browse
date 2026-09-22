'use client';

import React, { useState } from 'react';
import type { NodeTemplate } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { SparklesIcon } from '@/components/ui/icons';

interface NodeAddFormProps {
  template: NodeTemplate;
  onAdd: (
    template: NodeTemplate,
    overrides: { url: string; actionSummary: string; title: string },
  ) => void;
  onCancel: () => void;
}

const ARCHETYPE_COLORS: Record<string, string> = {
  navigation: 'bg-blue-500/10 text-blue-700 border-blue-200',
  grounding: 'bg-violet-500/10 text-violet-700 border-violet-200',
  action: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  form: 'bg-amber-500/10 text-amber-700 border-amber-200',
  extraction: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
  webhook: 'bg-orange-500/10 text-orange-700 border-orange-200',
  summarization: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
  news_gather: 'bg-rose-500/10 text-rose-700 border-rose-200',
  news_summary: 'bg-pink-500/10 text-pink-700 border-pink-200',
  email: 'bg-teal-500/10 text-teal-700 border-teal-200',
  authentication: 'bg-amber-500/10 text-amber-800 border-amber-300',
  auth: 'bg-amber-500/10 text-amber-800 border-amber-300',
};

export function NodeAddForm({ template, onAdd, onCancel }: NodeAddFormProps) {
  const [title, setTitle] = useState(template.title);
  const [url, setUrl] = useState('');
  const [actionSummary, setActionSummary] = useState(
    template.actionSummary || '',
  );

  const archetypeColor =
    ARCHETYPE_COLORS[template.archetype] ??
    'bg-zinc-100 text-zinc-600 border-zinc-200';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(template, { url, actionSummary, title });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
      {/* Form header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <SparklesIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-zinc-900 truncate">
            Configure Node
          </span>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${archetypeColor}`}
        >
          {template.archetype}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
            Step Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Step title..."
            className="h-7 text-xs"
            required
          />
        </div>

        {/* Target URL */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
            Target URL
          </label>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-7 font-mono text-[11px]"
          />
        </div>

        {/* Instruction */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
            Instruction / Action Summary
          </label>
          <Textarea
            value={actionSummary}
            onChange={(e) => setActionSummary(e.target.value)}
            placeholder="Describe what this step should do..."
            className="min-h-[64px] text-xs resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="submit"
            size="sm"
            className="flex-1 h-7 text-xs font-semibold"
          >
            <SparklesIcon className="h-3 w-3 text-emerald-400 mr-1" />
            Add to Canvas
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
