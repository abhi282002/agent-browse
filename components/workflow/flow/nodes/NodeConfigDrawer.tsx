"use client";

import React, { useState, useEffect } from "react";
import type { WorkflowNodeType, WorkflowNodeData } from "../types";
import { BotIcon, TerminalIcon, CheckIcon } from "@/components/ui/icons";

interface NodeConfigDrawerProps {
  node: WorkflowNodeType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updatedData: Partial<WorkflowNodeData>) => void;
  onDelete: (nodeId: string) => void;
}

export function NodeConfigDrawer({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: NodeConfigDrawerProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [badge, setBadge] = useState("");
  const [url, setUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [actionSummary, setActionSummary] = useState("");
  const [description, setDescription] = useState("");
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (node) {
      setTitle(node.data.title || "");
      setCategory(node.data.category || "");
      setBadge(node.data.badge || "");
      setUrl(node.data.url || "");
      setSelector(node.data.selector || "");
      setActionSummary(node.data.actionSummary || "");
      setDescription(node.data.description || "");
      setTimeoutMs(node.data.timeoutMs || 5000);
      setSavedSuccess(false);
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(node.id, {
      title,
      category,
      badge,
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] border-l border-zinc-200 bg-white p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
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
