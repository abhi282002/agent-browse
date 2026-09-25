"use client";

import React, { useState, useEffect } from "react";
import type { WorkflowBlueprint } from "../types";
import { BotIcon, SparklesIcon, ChromeIcon, CheckIcon } from "@/components/ui/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface EditWorkflowModalProps {
  isOpen: boolean;
  workflow: WorkflowBlueprint | null;
  onClose: () => void;
  onSave: (details: {
    id: string;
    name: string;
    description: string;
    category: string;
    aiModel?: string;
    sandboxEnv?: string;
  }) => Promise<void> | void;
}

const CATEGORIES = [
  "E-Commerce",
  "News & Briefing",
  "Developer Tools",
  "Lead Intelligence",
  "Price Tracker",
  "Autonomous Agent",
  "Custom Automation",
];

const AI_MODELS = [
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro Vision", latency: "Fast, Multimodal" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", latency: "Ultra-fast" },
  { id: "grok-2-vision", name: "Grok 2 Vision", latency: "Advanced Heuristics" },
];

const SANDBOX_PROFILES = [
  { id: "chromium-headless", name: "Headless Chromium", detail: "Fast & lightweight" },
  { id: "chromium-stealth", name: "Stealth Chromium", detail: "Cloudflare & Captcha bypass" },
  { id: "cdp-isolated", name: "Dedicated CDP Pod", detail: "Persistent auth state" },
];

export function EditWorkflowModal({
  isOpen,
  workflow,
  onClose,
  onSave,
}: EditWorkflowModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Autonomous Agent");
  const [aiModel, setAiModel] = useState("Gemini 2.5 Pro Vision");
  const [sandboxEnv, setSandboxEnv] = useState("Headless Chromium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name || "");
      setDescription(workflow.description || "");
      setCategory(workflow.category || "Autonomous Agent");
      setAiModel(workflow.aiModel || "Gemini 2.5 Pro Vision");
      setSandboxEnv(workflow.sandboxEnv || "Headless Chromium");
      setError(null);
    }
  }, [workflow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow) return;

    if (!name.trim()) {
      setError("Workflow name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: workflow.id,
        name: name.trim(),
        description: description.trim(),
        category,
        aiModel,
        sandboxEnv,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update workflow configurations.");
    } finally {
      setIsSubmitting(false);
    }
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
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base font-bold text-zinc-900">
                  Edit Workflow Settings
                </SheetTitle>
                {workflow && (
                  <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-mono text-zinc-600">
                    {workflow.nodes.length} Steps
                  </span>
                )}
              </div>
              <SheetDescription className="text-xs text-zinc-500">
                Update workflow model, category, and pipeline configurations.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Workflow Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-wf-name" className="text-xs font-bold text-zinc-700 block">
                  Workflow Name
                </Label>
                <Input
                  id="edit-wf-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., HackerNews Trending Monitor"
                  className="h-9 bg-zinc-50/50 text-xs focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-700 block">
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => {
                    if (val) setCategory(val);
                  }}
                >
                  <SelectTrigger className="w-full h-9 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="edit-wf-desc" className="text-xs font-bold text-zinc-700 block">
                Workflow Description
              </Label>
              <Textarea
                id="edit-wf-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the purpose, triggers, or goal of this automation..."
                className="bg-zinc-50/50 text-xs focus:bg-white resize-none"
              />
            </div>

            {/* AI Model Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <SparklesIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span>AI Vision &amp; Reasoning Model</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AI_MODELS.map((m) => (
                  <Button
                    key={m.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setAiModel(m.name)}
                    className={`flex h-auto flex-col text-left items-start p-2.5 rounded-xl border transition-all ${
                      aiModel === m.name
                        ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 hover:bg-emerald-50/50"
                        : "border-zinc-200 bg-zinc-50/40 hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-zinc-900">{m.name}</span>
                      {aiModel === m.name && <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-0.5 font-normal">{m.latency}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Sandbox Environment Profile */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <ChromeIcon className="h-3.5 w-3.5 text-zinc-600" />
                <span>Browser Sandbox Environment</span>
              </Label>
              <Select
                value={sandboxEnv}
                onValueChange={(val) => {
                  if (val) setSandboxEnv(val);
                }}
              >
                <SelectTrigger className="w-full h-9 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SANDBOX_PROFILES.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name} — {p.detail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 text-xs font-semibold text-white hover:bg-zinc-800 shadow-sm disabled:opacity-60"
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
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
