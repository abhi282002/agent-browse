'use client';

import { useState } from 'react';
import type {
  WorkflowNodeType,
  WorkflowNodeData,
  NodeArchetype,
  EmailProviderType,
} from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TerminalIcon, CheckIcon, SparklesIcon } from '@/components/ui/icons';
import { motion, AnimatePresence } from 'motion/react';

interface NodeConfigDrawerProps {
  node: WorkflowNodeType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updatedData: Partial<WorkflowNodeData>) => void;
  onDelete: (nodeId: string) => void;
}

interface NodeFormData {
  title: string;
  category: string;
  badge: string;
  archetype: NodeArchetype;
  emailProvider?: EmailProviderType;
  aiModel?: string;
  authEmail?: string;
  authPassword?: string;
  url: string;
  selector: string;
  actionSummary: string;
  description: string;
  timeoutMs: number;
}

function NodeConfigDrawerContent({
  node,
  onClose,
  onSave,
  onDelete,
}: {
  node: WorkflowNodeType;
  onClose: () => void;
  onSave: (nodeId: string, updatedData: Partial<WorkflowNodeData>) => void;
  onDelete: (nodeId: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<NodeFormData>(() => {
    const rawProvider =
      node.data.emailProvider ||
      node.data.metrics?.find((m) => m.label.toLowerCase() === 'provider')?.value;
    const initialEmailProvider: EmailProviderType =
      rawProvider?.toLowerCase().includes('nodemailer') ||
      rawProvider?.toLowerCase().includes('smtp')
        ? 'nodemailer'
        : 'resend';

    const rawModel =
      (node.data.aiModel as string | undefined) ||
      node.data.metrics?.find((m) => m.label.toLowerCase() === 'model')?.value;
    const initialAiModel =
      rawModel ||
      (node.data.archetype === 'news_summary'
        ? 'Gemini 2.5 Flash'
        : 'Gemini 2.5 Pro Vision');

    return {
      title: node.data.title || '',
      category: node.data.category || '',
      badge: node.data.badge || '',
      archetype: node.data.archetype || 'action',
      emailProvider:
        node.data.archetype === 'email' ? initialEmailProvider : undefined,
      aiModel:
        node.data.archetype === 'news_summary' ||
        node.data.archetype === 'summarization'
          ? initialAiModel
          : undefined,
      authEmail: (node.data.authEmail as string | undefined) || '',
      authPassword: (node.data.authPassword as string | undefined) || '',
      url: node.data.url || '',
      selector: node.data.selector || '',
      actionSummary: node.data.actionSummary || '',
      description: node.data.description || '',
      timeoutMs: node.data.timeoutMs || 5000,
    };
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const updateField = <K extends keyof NodeFormData>(
    field: K,
    value: NodeFormData[K],
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'archetype' && value === 'email' && !updated.emailProvider) {
        updated.emailProvider = 'resend';
      }
      if (
        field === 'archetype' &&
        (value === 'news_summary' || value === 'summarization') &&
        !updated.aiModel
      ) {
        updated.aiModel =
          value === 'news_summary' ? 'Gemini 2.5 Flash' : 'Gemini 2.5 Pro Vision';
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metrics = node.data.metrics ? [...node.data.metrics] : [];

    if (formData.archetype === 'email' && formData.emailProvider) {
      const providerLabel =
        formData.emailProvider === 'nodemailer'
          ? 'Nodemailer (SMTP)'
          : 'Resend API';
      const providerIdx = metrics.findIndex(
        (m) => m.label.toLowerCase() === 'provider',
      );
      if (providerIdx >= 0) {
        metrics[providerIdx] = { ...metrics[providerIdx], value: providerLabel };
      } else {
        metrics.unshift({ label: 'Provider', value: providerLabel });
      }
    }

    if (
      (formData.archetype === 'news_summary' ||
        formData.archetype === 'summarization') &&
      formData.aiModel
    ) {
      const modelIdx = metrics.findIndex(
        (m) => m.label.toLowerCase() === 'model',
      );
      if (modelIdx >= 0) {
        metrics[modelIdx] = { ...metrics[modelIdx], value: formData.aiModel };
      } else {
        metrics.unshift({ label: 'Model', value: formData.aiModel });
      }
    }

    if (
      (formData.archetype === 'authentication' ||
        formData.archetype === 'auth') &&
      formData.authEmail
    ) {
      const emailIdx = metrics.findIndex(
        (m) =>
          m.label.toLowerCase() === 'account' ||
          m.label.toLowerCase() === 'email',
      );
      if (emailIdx >= 0) {
        metrics[emailIdx] = { ...metrics[emailIdx], value: formData.authEmail };
      } else {
        metrics.unshift({ label: 'Account', value: formData.authEmail });
      }
    }

    onSave(node.id, {
      ...formData,
      metrics,
      actionSummary:
        formData.actionSummary || `Executed ${formData.title} heuristic`,
    });
    setSavedSuccess(true);
    onClose();
  };

  return (
    <motion.div
      initial={{ x: '-105%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-105%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
      className="fixed inset-y-0 left-0 top-[max(0px,calc(100%-42rem))] z-50 w-full rounded-2xl sm:w-[420px] border-r border-zinc-200 bg-white flex flex-col shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 font-mono text-xs font-bold text-white">
            0{node.data.stepNumber}
          </span>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Configure Step Node
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono truncate max-w-50">
              {node.id}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close drawer"
          className="cursor-pointer"
        >
          ✕
        </Button>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {savedSuccess && (
          <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Node configuration saved successfully!</span>
          </div>
        )}

        {/* Archetype badge */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] font-mono">
            {formData.archetype}
          </Badge>
          {node.data.isPremium && (
            <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
              ★ PRO
            </Badge>
          )}
        </div>

        {/* Configuration Form */}
        <form
          id="node-config-form"
          onSubmit={handleSubmit}
          className="space-y-3.5 text-xs"
        >
          {/* Step Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wide">
              Step Title
            </label>
            <Input
              type="text"
              required
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Category + Badge */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wide">
                Category
              </label>
              <Input
                type="text"
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wide">
                Badge
              </label>
              <Input
                type="text"
                value={formData.badge}
                onChange={(e) => updateField('badge', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Archetype */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wide">
              Archetype Protocol
            </label>
            <select
              value={formData.archetype}
              onChange={(e) =>
                updateField('archetype', e.target.value as NodeArchetype)
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer transition-colors"
            >
              <option value="open_url">
                Open URL (Dedicated Browser Navigate)
              </option>
              <option value="navigation">Navigation (URL &amp; Network)</option>
              <option value="grounding">
                Grounding (Vision &amp; Accessibility)
              </option>
              <option value="action">Action (Clicks &amp; Keystrokes)</option>
              <option value="form">Form (Auth &amp; Roadblocks)</option>
              <option value="extraction">
                Extraction (Data &amp; JSON Scraper)
              </option>
              <option value="webhook">Webhook (Artifacts &amp; Export)</option>
              <option value="summarization">
                AI Summarization (Gemini &amp; Grok)
              </option>
              <option value="news_gather">
                Browser News Collector (Autonomous Tabs &amp; Headlines)
              </option>
              <option value="news_summary">
                News Summary (Categorized Briefing)
              </option>
              <option value="email">Email Notification (Resend / Nodemailer)</option>
              <option value="authentication">
                Authentication (Sign In via Credentials)
              </option>
            </select>
          </div>

          {/* Email Provider Selector when Archetype is Email */}
          {formData.archetype === 'email' && (
            <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-blue-950 text-[11px] uppercase tracking-wide">
                  Email Provider
                </label>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                  {formData.emailProvider === 'nodemailer' ? 'SMTP' : 'Resend API'}
                </span>
              </div>
              <select
                value={formData.emailProvider || 'resend'}
                onChange={(e) =>
                  updateField('emailProvider', e.target.value as EmailProviderType)
                }
                className="h-8 w-full rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
              >
                <option value="resend">Resend API (Cloud Transactional Email)</option>
                <option value="nodemailer">Nodemailer (SMTP Server Transport)</option>
              </select>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                {formData.emailProvider === 'nodemailer'
                  ? 'Dispatches using SMTP credentials (SMTP_HOST, SMTP_PORT, etc.). Falls back to safe simulation if unconfigured.'
                  : 'Dispatches using Resend cloud API (RESEND_API_KEY). Falls back to safe simulation if unconfigured.'}
              </p>
            </div>
          )}

          {/* AI Model Selector when Archetype is news_summary or summarization */}
          {(formData.archetype === 'news_summary' ||
            formData.archetype === 'summarization') && (
            <div className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-indigo-950 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                  <SparklesIcon className="h-3.5 w-3.5 text-indigo-600" />
                  AI Model &amp; Engine
                </label>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                  {formData.aiModel?.toLowerCase().includes('grok')
                    ? 'xAI / Groq'
                    : 'Google Gemini'}
                </span>
              </div>
              <select
                value={
                  formData.aiModel ||
                  (formData.archetype === 'news_summary'
                    ? 'Gemini 2.5 Flash'
                    : 'Gemini 2.5 Pro Vision')
                }
                onChange={(e) => updateField('aiModel', e.target.value)}
                className="h-8 w-full rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value="Gemini 2.5 Flash">
                  Gemini 2.5 Flash (Google • Realtime Speed)
                </option>
                <option value="Gemini 2.5 Pro Vision">
                  Gemini 2.5 Pro Vision (Google DeepMind • Multimodal)
                </option>
                <option value="Grok 2 (xAI)">
                  Grok 2 (xAI • Fast Reasoning Engine)
                </option>
                <option value="Grok 2 Vision (xAI)">
                  Grok 2 Vision (xAI • Deep Web Reasoning)
                </option>
              </select>
              <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                {formData.aiModel?.toLowerCase().includes('grok')
                  ? 'Uses xAI Grok / Groq reasoning engine with structured JSON synthesis (requires GROK_API_KEY in .env).'
                  : 'Uses Google Gemini multimodal engine with structured JSON synthesis (requires GEMINI_API_KEY in .env).'}
              </p>
            </div>
          )}

          {/* Authentication & Credentials when Archetype is authentication or auth */}
          {(formData.archetype === 'authentication' ||
            formData.archetype === 'auth') && (
            <div className="flex flex-col gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-amber-950 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                  <span className="text-sm">🔐</span>
                  Account Credentials
                </label>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Stagehand Act
                </span>
              </div>

              {/* Email / Gmail / Username */}
              <div className="flex flex-col gap-1">
                <label className="font-medium text-amber-900 text-[11px]">
                  Email / Gmail / Username
                </label>
                <Input
                  type="text"
                  placeholder="e.g. user@gmail.com"
                  value={formData.authEmail || ''}
                  onChange={(e) => updateField('authEmail', e.target.value)}
                  className="h-8 bg-white border-amber-200 text-xs font-mono"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-amber-900 text-[11px]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter account password..."
                  value={formData.authPassword || ''}
                  onChange={(e) => updateField('authPassword', e.target.value)}
                  className="h-8 bg-white border-amber-200 text-xs font-mono"
                />
              </div>

              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                Stagehand will fill the email and password fields, then click the Log In or Sign In button (excluding OTP options). Passwords are encrypted in flight and masked in logs.
              </p>
            </div>
          )}

          {/* Target URL */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wide">
              Target URL / Scope
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-colors">
              <TerminalIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={formData.url}
                onChange={(e) => updateField('url', e.target.value)}
                className="w-full bg-transparent font-mono text-[11px] text-zinc-900 focus:outline-none"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* CSS Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wide">
              CSS Selector / XPath (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. button[data-testid='submit']"
              value={formData.selector}
              onChange={(e) => updateField('selector', e.target.value)}
              className="h-8 font-mono text-[11px]"
            />
          </div>

          {/* Action Summary */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wide">
              Action Summary / Instruction
            </label>
            <Textarea
              rows={2}
              value={formData.actionSummary}
              onChange={(e) => updateField('actionSummary', e.target.value)}
              placeholder="Heuristic action description..."
              className="text-xs min-h-[56px] resize-none"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wide">
              Step Description &amp; Objective
            </label>
            <Textarea
              rows={2}
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Detailed instructions for the autonomous agent..."
              className="text-xs min-h-[56px] resize-none"
            />
          </div>

          {/* Timeout */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wide">
              Timeout (ms)
            </label>
            <Input
              type="number"
              value={formData.timeoutMs}
              step={500}
              onChange={(e) => updateField('timeoutMs', Number(e.target.value))}
              className="h-8 font-mono text-[11px]"
            />
          </div>
        </form>
      </div>

      {/* Sticky Action Footer */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 bg-white">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm('Are you sure you want to remove this node?')) {
              onDelete(node.id);
              onClose();
            }
          }}
        >
          Delete Node
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className={'cursor-pointer'}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="node-config-form"
            size="sm"
            className="cursor-pointer"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function NodeConfigDrawer({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: NodeConfigDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && node && (
        <NodeConfigDrawerContent
          key={node.id}
          node={node}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </AnimatePresence>
  );
}
