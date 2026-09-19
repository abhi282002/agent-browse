"use client";

import React, { useState } from "react";
import type { WorkflowBlueprint } from "../types";
import { BotIcon, SparklesIcon, TerminalIcon, ChromeIcon, ShieldCheckIcon } from "@/components/ui/icons";

interface CreateWorkflowViewProps {
  onCancel: () => void;
  onCreate: (params: {
    name: string;
    description: string;
    category: string;
    targetUrl: string;
    aiModel?: string;
    sandboxEnv?: string;
  }) => void;
}

const BLUEPRINTS = [
  {
    id: "custom",
    title: "Blank Canvas",
    category: "Custom Automation",
    description: "Start from a clean slate and assemble custom navigation, perception, and action nodes.",
    defaultUrl: "https://example.com",
    badge: "Custom",
  },
  {
    id: "scrape",
    title: "Web Scraper & Entity Extractor",
    category: "Data Extraction",
    description: "Autonomously traverses pagination, parses table rows, solves captchas, and outputs JSON.",
    defaultUrl: "https://news.ycombinator.com",
    badge: "Extraction",
  },
  {
    id: "monitor",
    title: "E-Commerce Stock & Price Monitor",
    category: "Price Intelligence",
    description: "Periodically checks inventory levels, extracts SKU pricing, and alerts on discount thresholds.",
    defaultUrl: "https://bestbuy.com/site/computer-cards-components",
    badge: "Price Intel",
  },
  {
    id: "form",
    title: "Form Automation & Lead Qualification",
    category: "Auth & Form",
    description: "Fills CRM forms, verifies domain records, submits credentials, and extracts confirmation tokens.",
    defaultUrl: "https://linkedin.com/search/results",
    badge: "Lead Gen",
  },
];

const AI_MODELS = [
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro Vision", latency: "High Accuracy • Multimodal DOM" },
  { id: "claude-3.7", name: "Claude 3.7 Sonnet", latency: "High Precision • Computer Use CDP" },
  { id: "gpt-4o", name: "GPT-4o Vision", latency: "Low Latency • General Tools" },
];

const SANDBOX_PROFILES = [
  { id: "chrome-cdp", name: "Chromium 128 (CDP Protocol)", detail: "Isolated VM with CDP DevTools stream" },
  { id: "stealth-proxy", name: "Stealth Proxy Residential Pool", detail: "Bypasses Cloudflare / Akamai / TLS checks" },
  { id: "mobile-viewport", name: "Mobile Viewport Emulation", detail: "iPhone 15 Pro user-agent & touch events" },
];

export function CreateWorkflowView({ onCancel, onCreate }: CreateWorkflowViewProps) {
  const [selectedBlueprint, setSelectedBlueprint] = useState("custom");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Web Automation");
  const [targetUrl, setTargetUrl] = useState("https://");
  const [description, setDescription] = useState("");
  const [aiModel, setAiModel] = useState("Gemini 2.5 Pro Vision");
  const [sandboxEnv, setSandboxEnv] = useState("Chromium 128 (CDP Protocol)");
  const [error, setError] = useState<string | null>(null);

  const handleSelectBlueprint = (bp: typeof BLUEPRINTS[0]) => {
    setSelectedBlueprint(bp.id);
    setName(bp.title === "Blank Canvas" ? "" : bp.title);
    setCategory(bp.category);
    setTargetUrl(bp.defaultUrl);
    setDescription(bp.description);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a workflow name.");
      return;
    }
    if (!targetUrl.trim() || targetUrl === "https://") {
      setError("Please enter a valid starting URL.");
      return;
    }

    onCreate({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      targetUrl: targetUrl.trim(),
      aiModel,
      sandboxEnv,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
            <BotIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              Create Autonomous Workflow
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              Configure goal heuristics, cloud browser profiles, and autonomous agent models.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          ← Cancel
        </button>
      </div>

      {/* Blueprint Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-800 uppercase tracking-wider text-[11px]">
            1. Select Starting Blueprint
          </span>
          <span className="text-zinc-400">Pre-seeds workflow execution nodes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BLUEPRINTS.map((bp) => {
            const isSelected = selectedBlueprint === bp.id;
            return (
              <div
                key={bp.id}
                onClick={() => handleSelectBlueprint(bp)}
                className={`flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10 shadow-xs"
                    : "border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {bp.category}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/70">
                      {bp.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900">{bp.title}</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">
                    {bp.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflow Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="font-bold text-zinc-800 uppercase tracking-wider text-[11px]">
          2. Workflow Parameters &amp; Objectives
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Category / Domain
            </label>
            <input
              type="text"
              placeholder="e.g. Academic Research"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700 block mb-1">
            Target Starting URL
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 focus-within:bg-white focus-within:border-zinc-900">
            <ChromeIcon className="h-4 w-4 text-zinc-400 shrink-0" />
            <input
              type="url"
              required
              placeholder="https://example.com/target"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full bg-transparent font-mono text-xs text-zinc-900 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700 block mb-1">
            Agent Goal &amp; High-Level Heuristics
          </label>
          <textarea
            rows={3}
            placeholder="Describe what the agent should accomplish once the page loads (e.g. search for keywords, filter records, click submit, extract PDFs)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors"
          />
        </div>

        {/* AI Model & Sandbox Configuration */}
        <div className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] pt-2">
          3. Runtime Engine &amp; Environment
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Multimodal Vision Model
            </label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors cursor-pointer"
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.latency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Sandbox Browser Profile
            </label>
            <select
              value={sandboxEnv}
              onChange={(e) => setSandboxEnv(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none transition-colors cursor-pointer"
            >
              {SANDBOX_PROFILES.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer active:scale-[0.99]"
          >
            <SparklesIcon className="h-4 w-4 text-emerald-400" />
            <span>Initialize Workflow Studio</span>
          </button>
        </div>
      </form>
    </div>
  );
}
