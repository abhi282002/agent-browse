'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useOrgStore } from '@/stores/useOrgStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Building2,
  Globe,
  Bot,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mic,
  MicOff,
  Loader2,
} from 'lucide-react';
import type { WorkflowBlueprint } from '../types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useWhisperSpeechToText } from '../hooks/useWhisperSpeechToText';

export interface AiGenerateWorkflowSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowGenerated: (workflow: WorkflowBlueprint) => void;
  activeOrganization?: {
    id: string;
    name: string;
    aiInstructions?: string | null;
    defaultAiModel?: string | null;
  } | null;
}

const PRESET_GOALS = [
  {
    title: 'ArXiv AI Paper Digest',
    goal: 'Navigate to arXiv cs.AI list, extract the top 5 latest computer vision and LLM papers, synthesize their contributions, and dispatch an executive email digest.',
    url: 'https://arxiv.org/list/cs.AI/recent',
  },
  {
    title: 'E-Commerce Price & Stock Watcher',
    goal: 'Inspect product cards on BestBuy for graphics cards, extract price and in-stock badges, flag items under $1,000, and output structured JSON telemetry.',
    url: 'https://www.bestbuy.com',
  },
  {
    title: 'HackerNews Frontpage Intelligence',
    goal: 'Extract top trending stories on Hacker News with score, discussion count, and external domains, then synthesize key tech trends with an AI summary node.',
    url: 'https://news.ycombinator.com',
  },
];

export function AiGenerateWorkflowSheet({
  isOpen,
  onClose,
  onWorkflowGenerated,
  activeOrganization,
}: AiGenerateWorkflowSheetProps) {
  const storeOrg = useOrgStore((state) => state.activeOrganization);
  const currentOrg = activeOrganization ?? storeOrg;

  const [goal, setGoal] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [aiModel, setAiModel] = useState('Gemini 2.5 Pro Vision');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    recordingState,
    errorMessage: sttError,
    toggleRecording,
    isRecording,
    isTranscribing,
  } = useWhisperSpeechToText({
    onTranscript: (transcript) => {
      setGoal((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
  });

  const utils = trpc.useContext();
  const generateMutation = trpc.workflow.generateWithAi.useMutation({
    onSuccess: async (result) => {
      await utils.workflow.getAll.invalidate();
      onWorkflowGenerated(result.workflow as unknown as WorkflowBlueprint);
      setGoal('');
      setTargetUrl('');
      setErrorMessage(null);
      onClose();
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to generate workflow via AI.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      setErrorMessage('Please describe your workflow goal.');
      return;
    }
    setErrorMessage(null);

    generateMutation.mutate({
      goal: goal.trim(),
      targetUrl: targetUrl.trim() || undefined,
      aiModel,
      organizationId: currentOrg?.id,
      organizationName: currentOrg?.name,
      organizationAiInstructions: currentOrg?.aiInstructions || undefined,
    });
  };

  const handleApplyPreset = (preset: (typeof PRESET_GOALS)[0]) => {
    setGoal(preset.goal);
    setTargetUrl(preset.url);
    setErrorMessage(null);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="left"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-white border-r border-zinc-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="p-5 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-base font-bold text-zinc-900">
                  Generate Workflow with AI
                </SheetTitle>
                {currentOrg && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.2 text-[10px] font-semibold text-zinc-700">
                    <Building2 className="h-2.5 w-2.5 text-zinc-500" />
                    <span className="truncate max-w-[120px]">
                      {currentOrg.name}
                    </span>
                  </span>
                )}
              </div>
              <SheetDescription className="text-xs text-zinc-500">
                Synthesize a multi-node browser automation graph using Gemini
                reasoning.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Suggested Blueprints
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Click to populate
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {PRESET_GOALS.map((preset, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="ghost"
                    onClick={() => handleApplyPreset(preset)}
                    className="flex h-auto items-start justify-start gap-2 text-left rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-2.5 hover:bg-zinc-100/80 hover:border-zinc-300 transition-all group whitespace-normal"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-700 mt-0.5 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                      <Bot className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-800 group-hover:text-zinc-900">
                        {preset.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 font-normal">
                        {preset.goal}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Goal Input */}
            <div className="space-y-1.5">
              <Label
                htmlFor="ai-goal"
                className="text-xs font-bold text-zinc-800 flex items-center justify-between"
              >
                <span>
                  Workflow Goal &amp; Instructions{' '}
                  <span className="text-red-500">*</span>
                </span>
                <div className="flex items-center gap-2">
                  {/* Whisper speech-to-text mic button */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={isTranscribing}
                    title={
                      isRecording
                        ? 'Stop recording'
                        : isTranscribing
                          ? 'Transcribing…'
                          : 'Dictate with local Whisper'
                    }
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all ${
                      isRecording
                        ? 'border-red-300 bg-red-50 text-red-600 animate-pulse'
                        : isTranscribing
                          ? 'border-amber-200 bg-amber-50 text-amber-600'
                          : recordingState === 'error'
                            ? 'border-rose-200 bg-rose-50 text-rose-600'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-3 w-3" />
                    ) : (
                      <Mic className="h-3 w-3" />
                    )}
                    <span>
                      {isTranscribing
                        ? 'Transcribing…'
                        : isRecording
                          ? 'Stop'
                          : 'Dictate'}
                    </span>
                  </button>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    Natural Language
                  </span>
                </div>
              </Label>

              {sttError && (
                <p className="text-[10px] text-rose-500 font-medium">{sttError}</p>
              )}

              <div className="relative">
                <Textarea
                  id="ai-goal"
                  rows={4}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Describe your browser automation: e.g. Open product list, extract table of items with prices, synthesize top 3 bargains, and dispatch email notification…"
                  required
                  className={`bg-zinc-50/50 text-xs focus:bg-white resize-none transition-all ${
                    isRecording ? 'ring-2 ring-red-300 border-red-300' : ''
                  }`}
                />
                {isRecording && (
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Recording…
                  </span>
                )}
              </div>
            </div>

            {/* Target URL */}
            <div className="space-y-1.5">
              <Label
                htmlFor="ai-url"
                className="text-xs font-bold text-zinc-800 flex items-center gap-1"
              >
                <Globe className="h-3 w-3 text-zinc-500" />
                <span>Target Starting URL</span>
              </Label>
              <Input
                id="ai-url"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://news.ycombinator.com"
                className="h-10 bg-zinc-50/50 text-xs focus:bg-white"
              />
            </div>

            {/* AI Model Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-800 flex items-center gap-1">
                <Zap className="h-3 w-3 text-zinc-500" />
                <span>Reasoning Model</span>
              </Label>
              <Select
                value={aiModel}
                onValueChange={(val) => {
                  if (val) setAiModel(val);
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs font-medium text-zinc-800 focus:border-zinc-900 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gemini 2.5 Pro Vision">
                    Gemini 2.5 Pro Vision (Multimodal Reasoning)
                  </SelectItem>
                  <SelectItem value="Grok 2 Vision">
                    Grok 2 Vision (xAI Frontier)
                  </SelectItem>
                  <SelectItem value="Gemini 2.5 Flash">
                    Gemini 2.5 Flash (High Throughput)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organization Context Badge */}
            {currentOrg && currentOrg.aiInstructions && (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Infusing Organization Directives</span>
                </div>
                <p className="text-[11px] text-emerald-700/90 line-clamp-2">
                  &ldquo;{currentOrg.aiInstructions}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="p-4 border-t border-zinc-100 bg-zinc-50/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={generateMutation.isPending}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 shadow-xs"
            >
              {generateMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span className="truncate max-w-[200px]">
                    Synthesizing Graph for {currentOrg?.name || 'Organization'}
                    ...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Generate Blueprint</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
