"use client";

import React, { useState, useEffect } from "react";
import type { WorkflowBlueprint } from "../types";
import { BotIcon, SparklesIcon, ChromeIcon, CheckIcon } from "@/components/ui/icons";

interface EditWorkflowModalProps {
  isOpen: boolean;
  workflow: WorkflowBlueprint | null;
  onClose: () => void;
  onSave: (details: {
    name?: string;
    description?: string;
    category?: string;
    targetUrl?: string;
    aiModel?: string;
    sandboxEnv?: string;
    updateNodeUrls?: boolean;
  }) => Promise<void> | void;
}

const CATEGORIES = [
  "Data Extraction",
  "Web Automation",
  "Price Intelligence",
  "Lead Gen",
  "Auth & Form",
  "Custom Automation",
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

export function EditWorkflowModal({
  isOpen,
  workflow,
  onClose,
  onSave,
}: EditWorkflowModalProps) {
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [category, setCategory] = useState("Web Automation");
  const [description, setDescription] = useState("");
  const [aiModel, setAiModel] = useState("Gemini 2.5 Pro Vision");
  const [sandboxEnv, setSandboxEnv] = useState("Chromium 128 (CDP Protocol)");
  const [updateNodeUrls, setUpdateNodeUrls] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when active workflow changes or modal opens
  useEffect(() => {
    if (workflow) {
      setName(workflow.name || "");
      setTargetUrl(workflow.targetUrl || "https://");
      setCategory(workflow.category || "Web Automation");
      setDescription(workflow.description || "");
      setAiModel(workflow.aiModel || "Gemini 2.5 Pro Vision");
      setSandboxEnv(workflow.sandboxEnv || "Chromium 128 (CDP Protocol)");
      setUpdateNodeUrls(true);
      setError(null);
    }
  }, [workflow, isOpen]);

  if (!isOpen || !workflow) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Workflow name is required.");
      return;
    }

    if (!targetUrl.trim() || targetUrl === "https://" || !targetUrl.startsWith("http")) {
      setError("Please provide a valid starting Target URL starting with http:// or https://");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        targetUrl: targetUrl.trim(),
        category: category.trim(),
        description: description.trim(),
        aiModel,
        sandboxEnv,
        updateNodeUrls,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workflow settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
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
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  Edit Workflow Settings
                </h3>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-mono text-zinc-600">
                  {workflow.nodes.length} Steps
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Update workflow target URL, autonomous model, and pipeline configurations.
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

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Web URL - Priority Field */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <ChromeIcon className="h-3.5 w-3.5 text-emerald-700" />
                <span>Target Web URL</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-700">Required</span>
            </div>
            <p className="text-[11px] text-emerald-800/80">
              The primary webpage or web application where Chromium and AI agents begin navigation.
            </p>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://news.ycombinator.com"
              className="w-full rounded-xl border border-emerald-300/80 bg-white px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none shadow-2xs"
            />

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={updateNodeUrls}
                onChange={(e) => setUpdateNodeUrls(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-zinc-600">
                Update existing step nodes matching the previous URL to this new Target URL
              </span>
            </label>
          </div>

          {/* Workflow Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 block">
                Workflow Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., HackerNews Trending Monitor"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 block">
              Workflow Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the purpose, triggers, or goal of this automation..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none resize-none"
            />
          </div>

          {/* AI Model Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <SparklesIcon className="h-3.5 w-3.5 text-emerald-600" />
              <span>AI Vision &amp; Reasoning Model</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AI_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiModel(m.name)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    aiModel === m.name
                      ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                      : "border-zinc-200 bg-zinc-50/40 hover:bg-zinc-50 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-zinc-900">{m.name}</span>
                    {aiModel === m.name && <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{m.latency}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sandbox Environment Profile */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <ChromeIcon className="h-3.5 w-3.5 text-zinc-600" />
              <span>Browser Sandbox Environment</span>
            </label>
            <select
              value={sandboxEnv}
              onChange={(e) => setSandboxEnv(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none cursor-pointer"
            >
              {SANDBOX_PROFILES.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} — {p.detail}
                </option>
              ))}
            </select>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
