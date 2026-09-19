"use client";

import React, { useState } from "react";
import type { WorkflowBlueprint } from "./types";
import { createWorkflowFromBlueprint } from "./defaultFlows";
import { BotIcon, SparklesIcon } from "@/components/ui/icons";

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (workflow: WorkflowBlueprint) => void;
}

const PRESET_TEMPLATES = [
  {
    name: "HackerNews Trending Extractor",
    category: "Data Extraction",
    targetUrl: "https://news.ycombinator.com",
    description: "Extracts top 30 stories with vote count, comments link, and author metadata into JSON.",
  },
  {
    name: "Autonomous Lead Enrichment Bot",
    category: "Lead Intelligence",
    targetUrl: "https://linkedin.com/search/results",
    description: "Traverses profile cards, verifies email MX records, and normalizes company domains.",
  },
  {
    name: "Flight & Travel Fare Monitor",
    category: "Price Tracker",
    targetUrl: "https://google.com/travel/flights",
    description: "Monitors roundtrip itineraries, extracts airline tariffs, and triggers discount webhooks.",
  },
];

export function CreateWorkflowModal({
  isOpen,
  onClose,
  onCreate,
}: CreateWorkflowModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Data Extraction");
  const [targetUrl, setTargetUrl] = useState("https://");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a workflow name.");
      return;
    }
    if (!targetUrl.trim() || targetUrl === "https://") {
      setError("Please enter a valid target URL.");
      return;
    }

    const newWf = createWorkflowFromBlueprint({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      targetUrl: targetUrl.trim(),
    });

    onCreate(newWf);
    // Reset and close
    setName("");
    setDescription("");
    setTargetUrl("https://");
    setError(null);
    onClose();
  };

  const handleApplyPreset = (template: typeof PRESET_TEMPLATES[0]) => {
    setName(template.name);
    setCategory(template.category);
    setTargetUrl(template.targetUrl);
    setDescription(template.description);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-2xs">
              <BotIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Create New Workflow
              </h3>
              <p className="text-xs text-zinc-500">
                Define an agent pipeline to execute across browser sandboxes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Quick Blueprints
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyPreset(tpl)}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-colors cursor-pointer"
              >
                <SparklesIcon className="h-3 w-3 text-emerald-500" />
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Workflow Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Arxiv Reasoning Scraper"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Price Monitor"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Target Starting URL
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 font-mono focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Prompt &amp; Objective
            </label>
            <textarea
              rows={3}
              placeholder="Describe the agent's browser automation instructions, steps, or extraction targets..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
            >
              Initialize Workflow Graph
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
