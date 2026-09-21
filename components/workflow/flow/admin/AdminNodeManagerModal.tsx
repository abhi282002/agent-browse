"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { NodeTemplate, EmailProviderType } from "../types";
import { BotIcon, SparklesIcon } from "@/components/ui/icons";

interface AdminNodeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminNodeManagerModal({ isOpen, onClose }: AdminNodeManagerModalProps) {
  const utils = trpc.useContext();
  const { data: templates, isLoading } = trpc.nodeTemplate.getAll.useQuery();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Custom Engine");
  const [badge, setBadge] = useState("Custom");
  const [archetype, setArchetype] = useState("open_url");
  const [emailProvider, setEmailProvider] = useState<EmailProviderType>("resend");
  const [description, setDescription] = useState("");
  const [actionSummary, setActionSummary] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyEmailDefaults = (provider: EmailProviderType) => {
    setEmailProvider(provider);
    if (provider === "nodemailer") {
      setTitle("Email Notification (Nodemailer SMTP)");
      setCategory("Notification & Alert");
      setBadge("SMTP Mail");
      setActionSummary("Dispatches email briefing via Nodemailer SMTP transport");
      setDescription("Sends curated news briefs or workflow execution notifications to the recipient using a custom Nodemailer SMTP transport.");
    } else {
      setTitle("Email Notification (Resend)");
      setCategory("Notification & Alert");
      setBadge("Resend API");
      setActionSummary("Dispatches email briefing via Resend Transactional Email API");
      setDescription("Sends curated news briefs or workflow execution notifications to the recipient using the Resend cloud transactional email engine.");
    }
  };

  const handleArchetypeChange = (val: string) => {
    setArchetype(val);
    if (val === "open_url" && (!title || title === "Turnstile & Cloudflare Solver" || title.includes("Email"))) {
      setTitle("Open URL");
      setCategory("Browser Navigation");
      setBadge("Launch");
      setActionSummary("Navigate browser session to target URL and wait for page load");
      setDescription("Dedicated browser navigation node that initializes the CDP session and loads the target web address.");
    } else if (val === "email") {
      applyEmailDefaults(emailProvider);
    }
  };

  const createMutation = trpc.nodeTemplate.create.useMutation({
    onSuccess: () => {
      utils.nodeTemplate.getAll.invalidate();
      setIsCreating(false);
      resetForm();
    },
    onError: (err) => setError(err.message),
  });

  const updateMutation = trpc.nodeTemplate.update.useMutation({
    onSuccess: () => {
      utils.nodeTemplate.getAll.invalidate();
    },
  });

  const deleteMutation = trpc.nodeTemplate.delete.useMutation({
    onSuccess: () => {
      utils.nodeTemplate.getAll.invalidate();
    },
  });

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setCategory("Custom Engine");
    setBadge("Custom");
    setArchetype("open_url");
    setEmailProvider("resend");
    setDescription("");
    setActionSummary("");
    setIsPremium(false);
    setError(null);
  };

  const handleTogglePremium = (tpl: NodeTemplate) => {
    if (!tpl.id) return;
    updateMutation.mutate({
      id: tpl.id,
      isPremium: !tpl.isPremium,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !actionSummary.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    const defaultMetrics =
      archetype === "email"
        ? [
            {
              label: "Provider",
              value: emailProvider === "nodemailer" ? "Nodemailer (SMTP)" : "Resend API",
            },
            {
              label: "Protocol",
              value: emailProvider === "nodemailer" ? "SMTP" : "HTTPS API",
            },
          ]
        : undefined;

    const defaultLogs =
      archetype === "email"
        ? [
            `Initialized ${emailProvider === "nodemailer" ? "Nodemailer SMTP" : "Resend API"} dispatcher`,
            "Compiled executive email briefing",
          ]
        : undefined;

    createMutation.mutate({
      title: title.trim(),
      category: category.trim(),
      badge: badge.trim(),
      archetype,
      emailProvider: archetype === "email" ? emailProvider : undefined,
      description: description.trim(),
      actionSummary: actionSummary.trim(),
      isPremium,
      defaultMetrics,
      defaultLogs,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-2xs">
              <BotIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  Admin Node Studio
                </h3>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Create and customize node templates. Customers can only use nodes enabled here.
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

        {/* Toolbar: View Nodes vs Create Node */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-semibold text-zinc-700">
            System Node Templates ({templates?.length ?? 0})
          </span>
          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
          >
            <SparklesIcon className="h-3 w-3 text-emerald-400" />
            <span>{isCreating ? "View Catalog Table" : "+ Create Custom Node"}</span>
          </button>
        </div>

        {/* Create Node Form (when isCreating) */}
        {isCreating ? (
          <form
            onSubmit={handleCreateSubmit}
            className="space-y-3.5 text-xs overflow-y-auto pr-1"
          >
            {error && (
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-semibold text-zinc-700 block mb-1">
                  Node Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Turnstile & Cloudflare Solver"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">
                  Badge Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solver"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Security & Captcha"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">
                  Archetype Protocol
                </label>
                <select
                  value={archetype}
                  onChange={(e) => handleArchetypeChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none cursor-pointer"
                >
                  <option value="open_url">Open URL (Browser Navigation / Launch URL)</option>
                  <option value="navigation">Navigation (URL &amp; Network)</option>
                  <option value="grounding">Grounding (Vision &amp; Accessibility)</option>
                  <option value="action">Action (Clicks &amp; Keystrokes)</option>
                  <option value="form">Form (Auth &amp; Roadblocks)</option>
                  <option value="extraction">Extraction (Data &amp; JSON Scraper)</option>
                  <option value="webhook">Webhook (Artifacts &amp; Export)</option>
                  <option value="summarization">AI Summarization (Gemini &amp; Grok)</option>
                  <option value="news_gather">Browser News Collector (Autonomous Tabs &amp; Headlines)</option>
                  <option value="news_summary">News Intelligence (Categorized Briefing)</option>
                  <option value="email">Email Notification (Resend / Nodemailer)</option>
                </select>
              </div>
            </div>

            {/* Email Provider Selector when Archetype is Email */}
            {archetype === "email" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-blue-950 block">
                    Email Provider Service
                  </label>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                    {emailProvider === "nodemailer" ? "SMTP Transport" : "Cloud REST API"}
                  </span>
                </div>
                <select
                  value={emailProvider}
                  onChange={(e) => applyEmailDefaults(e.target.value as EmailProviderType)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-zinc-900 focus:border-blue-500 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="resend">Resend API (Cloud Transactional Email)</option>
                  <option value="nodemailer">Nodemailer (SMTP Server / Custom Gateway)</option>
                </select>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {emailProvider === "nodemailer"
                    ? "Sends emails via standard SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). Gracefully simulates dispatch if credentials are unset."
                    : "Sends emails via Resend official transactional REST API (RESEND_API_KEY, RESEND_FROM_EMAIL). Gracefully simulates dispatch if credentials are unset."}
                </p>
              </div>
            )}

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Action Summary (Heuristics)
              </label>
              <textarea
                rows={2}
                required
                placeholder="What action this step executes in headless browser..."
                value={actionSummary}
                onChange={(e) => setActionSummary(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Full Description
              </label>
              <textarea
                rows={2}
                required
                placeholder="Technical description of what this node accomplishes for the agent..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
              />
            </div>

            {/* Pricing Tier: Free vs Premium Toggle */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-900 block">
                  Node Tier: {isPremium ? "Premium (PRO)" : "Free Tier"}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {isPremium
                    ? "Requires a Pro customer workspace subscription to deploy."
                    : "Available to all free and trial users without restrictions."}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPremium(!isPremium)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                  isPremium
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-zinc-200 text-zinc-700 border-zinc-300"
                }`}
              >
                {isPremium ? "★ PRO Tier" : "Free Tier"}
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {createMutation.isPending ? "Publishing..." : "Publish to Customer Catalog"}
              </button>
            </div>
          </form>
        ) : (
          /* Node List Table */
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Loading templates from database...
              </div>
            ) : (
              templates?.map((tpl) => (
                <div
                  key={tpl.id || tpl.title}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 hover:bg-white hover:border-zinc-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">
                        {tpl.title}
                      </span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-600">
                        {tpl.category}
                      </span>
                      <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-mono text-zinc-700">
                        {tpl.archetype}
                      </span>
                      {tpl.archetype === "email" && (
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
                          {tpl.emailProvider === "nodemailer" ? "SMTP" : "Resend"}
                        </span>
                      )}
                      {tpl.isPremium ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          ★ PRO
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          FREE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-1">
                      {tpl.actionSummary}
                    </p>
                  </div>

                  {/* Admin Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePremium(tpl)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                        tpl.isPremium
                          ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                      }`}
                      title="Click to toggle Free vs PRO tier for customers"
                    >
                      {tpl.isPremium ? "Demote to Free" : "Promote to PRO"}
                    </button>

                    {tpl.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete node template "${tpl.title}"?`)) {
                            deleteMutation.mutate({ id: tpl.id! });
                          }
                        }}
                        className="rounded-lg p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete template"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
