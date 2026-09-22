'use client';

import React, { useState } from 'react';
import type { WorkflowBlueprint } from './types';
import { createWorkflowFromBlueprint } from './defaultFlows';
import { BotIcon, SparklesIcon } from '@/components/ui/icons';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (workflow: WorkflowBlueprint) => void;
}

const PRESET_TEMPLATES = [
  {
    name: 'HackerNews Trending Extractor',
    category: 'Data Extraction',
    description:
      'Extracts top 30 stories with vote count, comments link, and author metadata into JSON.',
  },
  {
    name: 'Amazon Price Watcher',
    category: 'E-Commerce',
    description:
      'Monitor retail e-commerce prices, identify dynamic price fluctuations, extract product stock metrics, and trigger webhooks.',
  },
  {
    name: 'Hacker News Briefing',
    category: 'News & Briefing',
    description:
      'Scrape top trending developer stories from Hacker News, extract discussions, and compile an executive summary.',
  },
  {
    name: 'GitHub Release Tracker',
    category: 'Developer Tools',
    description:
      'Check release notes, download changelogs, analyze pull request diffs, and notify team on Slack/Discord.',
  },
];

export function CreateWorkflowModal({
  isOpen,
  onClose,
  onCreate,
}: CreateWorkflowModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Autonomous Agent');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApplyPreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setDescription(preset.description);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workflow name is required.');
      return;
    }

    const newWorkflow = createWorkflowFromBlueprint({
      name: name.trim(),
      category: category.trim() || 'Autonomous Agent',
      description: description.trim(),
    });

    onCreate(newWorkflow);
    onClose();

    // Reset Form
    setName('');
    setCategory('Autonomous Agent');
    setDescription('');
    setError(null);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col bg-white border-l border-zinc-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-2xs">
              <BotIcon className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-zinc-900">
                Create New Workflow
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500">
                Define an agent pipeline to execute across browser sandboxes.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Quick Blueprints
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TEMPLATES.map((tpl, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleApplyPreset(tpl)}
                    className="flex items-center gap-1 rounded-lg border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 h-auto"
                  >
                    <SparklesIcon className="h-3 w-3 text-emerald-500" />
                    <span>{tpl.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <Label
                htmlFor="workflow-name"
                className="text-xs font-semibold text-zinc-700 block"
              >
                Workflow Name
              </Label>
              <Input
                id="workflow-name"
                type="text"
                required
                placeholder="e.g. Arxiv Reasoning Scraper"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 bg-zinc-50/50 text-xs focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="workflow-category"
                className="text-xs font-semibold text-zinc-700 block"
              >
                Category
              </Label>
              <Input
                id="workflow-category"
                type="text"
                placeholder="e.g. Price Monitor"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 bg-zinc-50/50 text-xs focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="workflow-prompt"
                className="text-xs font-semibold text-zinc-700 block"
              >
                Prompt &amp; Objective
              </Label>
              <Textarea
                id="workflow-prompt"
                rows={4}
                placeholder="Describe the agent's browser automation instructions, steps, or extraction targets..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-50/50 text-xs focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl bg-zinc-900 px-5 text-xs font-medium text-white hover:bg-zinc-800 shadow-sm"
            >
              Initialize Workflow Graph
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
