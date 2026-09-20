"use client";

import React, { useState } from "react";
import type { WorkflowNodeType, WorkflowNodeData, NodeArchetype } from "../types";
import { TerminalIcon, CheckIcon } from "@/components/ui/icons";

interface NodeConfigDrawerProps {
  node: WorkflowNodeType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updatedData: Partial<WorkflowNodeData>) => void;
  onDelete: (nodeId: string) => void;
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
  const [title, setTitle] = useState(node.data.title || "");
  const [category, setCategory] = useState(node.data.category || "");
  const [badge, setBadge] = useState(node.data.badge || "");
  const [archetype, setArchetype] = useState<NodeArchetype>(node.data.archetype || "action");
  const [url, setUrl] = useState(node.data.url || "");
  const [selector, setSelector] = useState(node.data.selector || "");
  const [actionSummary, setActionSummary] = useState(node.data.actionSummary || "");
  const [description, setDescription] = useState(node.data.description || "");
  const [timeoutMs, setTimeoutMs] = useState(node.data.timeoutMs || 5000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(node.id, {
      title,
      category,
      badge,
      archetype,
      url,
      selector,
      actionSummary,
      description,
      timeoutMs,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] border-l border-zinc-200 bg-white p-5 shadow-2xl flex flex-col justify-between">
      <div className="space-y-4 overflow-y-auto pr-1">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 font-mono text-xs font-bold text-white">
              0{node.data.stepNumber}
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Configure Step Node
              </h3>
              <p className="text-[11px] text-zinc-500">
                Node ID: <code className="font-mono">{node.id}</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {savedSuccess && (
          <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-emerald-600" />
            <span>Node configuration saved successfully!</span>
          </div>
        )}

        {/* Configuration Form */}
        <form id="node-config-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              Step Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Badge
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              Archetype Protocol
            </label>
            <select
              value={archetype}
              onChange={(e) => setArchetype(e.target.value as NodeArchetype)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="navigation">Navigation (URL &amp; Network)</option>
              <option value="grounding">Grounding (Vision &amp; Accessibility)</option>
              <option value="action">Action (Clicks &amp; Keystrokes)</option>
              <option value="form">Form (Auth &amp; Roadblocks)</option>
              <option value="extraction">Extraction (Data &amp; JSON Scraper)</option>
              <option value="webhook">Webhook (Artifacts &amp; Export)</option>
              <option value="summarization">AI Summarization (Gemini &amp; Grok)</option>
              <option value="email">Email Notification (Resend)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              Target URL / Scope
            </label>
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 focus-within:bg-white focus-within:border-zinc-900">
              <TerminalIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-transparent font-mono text-[11px] text-zinc-900 focus:outline-none"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              CSS Selector / XPath (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. button[data-testid='submit']"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 font-mono text-[11px] text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              Action Summary
            </label>
            <textarea
              rows={2}
              value={actionSummary}
              onChange={(e) => setActionSummary(e.target.value)}
              placeholder="Heuristic action description..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              Step Description &amp; Objective
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions for the autonomous agent..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-zinc-700 block mb-1">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={timeoutMs}
              step={500}
              onChange={(e) => setTimeoutMs(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 font-mono text-[11px] text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (confirm("Are you sure you want to remove this node?")) {
              onDelete(node.id);
              onClose();
            }
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          Delete Node
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="node-config-form"
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export function NodeConfigDrawer({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: NodeConfigDrawerProps) {
  if (!isOpen || !node) return null;

  return (
    <NodeConfigDrawerContent
      key={node.id}
      node={node}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}
