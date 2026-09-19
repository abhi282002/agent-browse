"use client";

import React, { useState } from "react";
import type { NodeTemplate } from "../types";
import { NODE_TEMPLATES } from "./nodeTemplates";
import { BotIcon, SparklesIcon, CheckIcon } from "@/components/ui/icons";

interface NodeCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NodeTemplate) => void;
}

export function NodeCatalogModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: NodeCatalogModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  const categories = ["all", "Navigation", "Vision & CDP", "Action Engine", "Auth & Form", "Data Scraper", "Artifact Engine"];

  const filteredTemplates = NODE_TEMPLATES.filter((tpl) => {
    const matchesSearch =
      tpl.title.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase()) ||
      tpl.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || tpl.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4"
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
              <h3 className="text-base font-bold text-zinc-900">
                Agent Node Catalog
              </h3>
              <p className="text-xs text-zinc-500">
                Choose a pre-configured execution node archetype to append to the pipeline.
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

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
          <input
            type="text"
            placeholder="Search node archetypes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs text-zinc-900 focus:bg-white focus:border-zinc-900 focus:outline-none"
          />

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat === "all" ? "All Archetypes" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Node Templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.archetype}
              className="flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-3.5 hover:border-zinc-300 hover:bg-white transition-all space-y-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {tpl.category}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                    {tpl.badge}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900">{tpl.title}</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100/80 flex items-center justify-between">
                <div className="text-[10px] text-zinc-400 font-mono">
                  {tpl.defaultMetrics[0]?.label}: {tpl.defaultMetrics[0]?.value}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTemplate(tpl);
                    onClose();
                  }}
                  className="flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
                >
                  <SparklesIcon className="h-3 w-3 text-emerald-400" />
                  <span>Insert Node</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
