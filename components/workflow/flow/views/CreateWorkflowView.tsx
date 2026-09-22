"use client";

import React, { useState } from "react";
import { BotIcon, SparklesIcon } from "@/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CreateWorkflowViewProps {
  onCancel: () => void;
  organizationName?: string;
  onCreate: (params: {
    name: string;
    description: string;
    category: string;
    targetUrl?: string;
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
    category: "Lead Gen",
    description: "Populates multi-step forms, handles reCAPTCHAs, and submits authenticated payloads.",
    defaultUrl: "https://linkedin.com",
    badge: "Forms",
  },
];

const AI_MODELS = [
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro Vision", latency: "Google DeepMind • Multimodal DOM" },
  { id: "grok-2-vision", name: "Grok 2 Vision (xAI)", latency: "xAI • Deep Web Reasoning" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", latency: "Google • Low Latency Realtime" },
  { id: "claude-3.7", name: "Claude 3.7 Sonnet", latency: "Anthropic • Computer Use CDP" },
  { id: "gpt-4o", name: "GPT-4o Vision", latency: "OpenAI • General Tools" },
];

const SANDBOX_PROFILES = [
  { id: "chrome-cdp", name: "Chromium 128 (CDP Protocol)", detail: "Isolated VM with CDP DevTools stream" },
  { id: "stealth-proxy", name: "Stealth Proxy Residential Pool", detail: "Bypasses Cloudflare / Akamai / TLS checks" },
  { id: "mobile-viewport", name: "Mobile Viewport Emulation", detail: "iPhone 15 Pro user-agent & touch events" },
];

export function CreateWorkflowView({ onCancel, onCreate, organizationName }: CreateWorkflowViewProps) {
  const [selectedBlueprint, setSelectedBlueprint] = useState("custom");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Web Automation");
  const [description, setDescription] = useState("");
  const [aiModel, setAiModel] = useState("Gemini 2.5 Pro Vision");
  const [sandboxEnv, setSandboxEnv] = useState("Chromium 128 (CDP Protocol)");
  const [error, setError] = useState<string | null>(null);

  const handleSelectBlueprint = (bp: typeof BLUEPRINTS[0]) => {
    setSelectedBlueprint(bp.id);
    setName(bp.title === "Blank Canvas" ? "" : bp.title);
    setCategory(bp.category);
    setDescription(bp.description);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a workflow name.");
      return;
    }

    onCreate({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      targetUrl: "",
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                Create Autonomous Workflow
              </h2>
              {organizationName && (
                <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                  {organizationName}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-zinc-500">
              Configure goal heuristics, cloud browser profiles, and autonomous agent models.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          ← Cancel
        </Button>
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
            <Label className="text-xs font-semibold text-zinc-700 block mb-1">
              Workflow Name
            </Label>
            <Input
              type="text"
              required
              placeholder="e.g. Arxiv Reasoning Scraper"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 transition-colors"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-700 block mb-1">
              Category / Domain
            </Label>
            <Input
              type="text"
              placeholder="e.g. Academic Research"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 transition-colors"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-zinc-700 block mb-1">
            Agent Goal &amp; High-Level Heuristics
          </Label>
          <Textarea
            rows={3}
            placeholder="Describe what the agent should accomplish once the page loads (e.g. search for keywords, filter records, click submit, extract PDFs)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 transition-colors"
          />
        </div>

        {/* AI Model & Sandbox Configuration */}
        <div className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] pt-2">
          3. Runtime Engine &amp; Environment
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-zinc-700 block mb-1">
              Multimodal Vision Model
            </Label>
            <Select
              value={aiModel}
              onValueChange={(val) => {
                if (val) setAiModel(val);
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.name}>
                    {m.name} ({m.latency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-zinc-700 block mb-1">
              Sandbox Browser Profile
            </Label>
            <Select
              value={sandboxEnv}
              onValueChange={(val) => {
                if (val) setSandboxEnv(val);
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SANDBOX_PROFILES.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer active:scale-[0.99]"
          >
            <SparklesIcon className="h-4 w-4 text-emerald-400" />
            <span>Initialize Workflow Studio</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
