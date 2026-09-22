"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { EmailProviderType } from "../types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface AdminCreateNodeFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function AdminCreateNodeForm({
  onCancel,
  onSuccess,
}: AdminCreateNodeFormProps) {
  const utils = trpc.useContext();

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
      setDescription(
        "Sends curated news briefs or workflow execution notifications to the recipient using a custom Nodemailer SMTP transport."
      );
    } else {
      setTitle("Email Notification (Resend)");
      setCategory("Notification & Alert");
      setBadge("Resend API");
      setActionSummary("Dispatches email briefing via Resend Transactional Email API");
      setDescription(
        "Sends curated news briefs or workflow execution notifications to the recipient using the Resend cloud transactional email engine."
      );
    }
  };

  const handleArchetypeChange = (val: string) => {
    setArchetype(val);
    if (
      val === "open_url" &&
      (!title || title === "Turnstile & Cloudflare Solver" || title.includes("Email"))
    ) {
      setTitle("Open URL");
      setCategory("Browser Navigation");
      setBadge("Launch");
      setActionSummary("Navigate browser session to target URL and wait for page load");
      setDescription(
        "Dedicated browser navigation node that initializes the CDP session and loads the target web address."
      );
    } else if (val === "email") {
      applyEmailDefaults(emailProvider);
    }
  };

  const createMutation = trpc.nodeTemplate.create.useMutation({
    onSuccess: () => {
      utils.nodeTemplate.getAll.invalidate();
      onSuccess();
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
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
            `Initialized ${
              emailProvider === "nodemailer" ? "Nodemailer SMTP" : "Resend API"
            } dispatcher`,
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 text-xs overflow-y-auto flex-1 pr-1"
    >
      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-destructive border border-destructive/20 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Title & Badge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="node-title" className="text-xs font-semibold text-zinc-700">
            Node Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="node-title"
            required
            placeholder="e.g. Turnstile & Cloudflare Solver"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 bg-zinc-50/50 focus:bg-white text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="badge-label" className="text-xs font-semibold text-zinc-700">
            Badge Label <span className="text-destructive">*</span>
          </Label>
          <Input
            id="badge-label"
            required
            placeholder="e.g. Solver"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="h-9 bg-zinc-50/50 focus:bg-white text-xs"
          />
        </div>
      </div>

      {/* Category & Archetype */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-semibold text-zinc-700">
            Category <span className="text-destructive">*</span>
          </Label>
          <Input
            id="category"
            required
            placeholder="e.g. Security & Captcha"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 bg-zinc-50/50 focus:bg-white text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-700">
            Archetype Protocol
          </Label>
          <Select
            value={archetype}
            onValueChange={(val) => {
              if (val) handleArchetypeChange(val);
            }}
          >
            <SelectTrigger className="w-full h-9 bg-zinc-50/50 focus:bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open_url">
                Open URL (Browser Navigation / Launch URL)
              </SelectItem>
              <SelectItem value="navigation">Navigation (URL &amp; Network)</SelectItem>
              <SelectItem value="grounding">Grounding (Vision &amp; Accessibility)</SelectItem>
              <SelectItem value="action">Action (Clicks &amp; Keystrokes)</SelectItem>
              <SelectItem value="form">Form (Auth &amp; Roadblocks)</SelectItem>
              <SelectItem value="extraction">Extraction (Data &amp; JSON Scraper)</SelectItem>
              <SelectItem value="webhook">Webhook (Artifacts &amp; Export)</SelectItem>
              <SelectItem value="summarization">AI Summarization (Gemini &amp; Grok)</SelectItem>
              <SelectItem value="news_gather">
                Browser News Collector (Autonomous Tabs &amp; Headlines)
              </SelectItem>
              <SelectItem value="news_summary">News Intelligence (Categorized Briefing)</SelectItem>
              <SelectItem value="email">Email Notification (Resend / Nodemailer)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Email Provider Selector when Archetype is Email */}
      {archetype === "email" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-blue-950">
              Email Provider Service
            </Label>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-mono">
              {emailProvider === "nodemailer" ? "SMTP Transport" : "Cloud REST API"}
            </Badge>
          </div>
          <Select
            value={emailProvider}
            onValueChange={(val) => {
              if (val) applyEmailDefaults(val as EmailProviderType);
            }}
          >
            <SelectTrigger className="w-full h-9 bg-white text-zinc-900 border-blue-200 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resend">Resend API (Cloud Transactional Email)</SelectItem>
              <SelectItem value="nodemailer">Nodemailer (SMTP Server / Custom Gateway)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            {emailProvider === "nodemailer"
              ? "Sends emails via standard SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). Gracefully simulates dispatch if credentials are unset."
              : "Sends emails via Resend official transactional REST API (RESEND_API_KEY, RESEND_FROM_EMAIL). Gracefully simulates dispatch if credentials are unset."}
          </p>
        </div>
      )}

      {/* Action Summary */}
      <div className="space-y-1.5">
        <Label htmlFor="action-summary" className="text-xs font-semibold text-zinc-700">
          Action Summary (Heuristics) <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="action-summary"
          rows={2}
          required
          placeholder="What action this step executes in headless browser..."
          value={actionSummary}
          onChange={(e) => setActionSummary(e.target.value)}
          className="bg-zinc-50/50 focus:bg-white text-xs resize-none"
        />
      </div>

      {/* Full Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-semibold text-zinc-700">
          Full Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          rows={2}
          required
          placeholder="Technical description of what this node accomplishes for the agent..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-zinc-50/50 focus:bg-white text-xs resize-none"
        />
      </div>

      {/* Pricing Tier: Free vs Premium Toggle */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 text-xs">Node Access Tier</span>
            <Badge
              variant={isPremium ? "default" : "secondary"}
              className={`text-[10px] ${
                isPremium
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {isPremium ? "★ PRO Tier" : "Free Tier"}
            </Badge>
          </div>
          <p className="text-[11px] text-zinc-500">
            {isPremium
              ? "Requires a Pro customer workspace subscription to deploy in workflows."
              : "Available to all free and trial users without restrictions."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Label htmlFor="premium-switch" className="text-xs text-zinc-600 cursor-pointer">
            {isPremium ? "Pro" : "Free"}
          </Label>
          <Switch
            id="premium-switch"
            checked={isPremium}
            onCheckedChange={(checked) => setIsPremium(checked)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="rounded-xl text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={createMutation.isPending}
          className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs shadow-xs"
        >
          {createMutation.isPending ? "Publishing..." : "Publish to Customer Catalog"}
        </Button>
      </div>
    </form>
  );
}
