"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { NodeTemplate } from "../types";
import { BotIcon, SparklesIcon } from "@/components/ui/icons";

interface NodeCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NodeTemplate) => void;
  onOpenAdmin?: () => void;
}

export function NodeCatalogModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onOpenAdmin,
}: NodeCatalogModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: serverTemplates } = trpc.nodeTemplate.getAll.useQuery(undefined, {
    enabled: isOpen,
    staleTime: 30 * 1000,
  });

  const availableTemplates: NodeTemplate[] = (serverTemplates as NodeTemplate[]) ?? [];

  if (!isOpen) return null;

  const dynamicCategories = Array.from(
    new Set(availableTemplates.map((t) => t.category).filter(Boolean))
  );
  const categories = ["all", ...dynamicCategories];

  const filteredTemplates = availableTemplates.filter((tpl) => {
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
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  Curated Node Catalog
                </h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  Admin Verified
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Select from admin-managed Free &amp; PRO step node archetypes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                title="Open Admin Node Studio to create or customize nodes"
              >
                <span>⚙️ Admin Studio</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
          <input
            type="text"
            placeholder="Search node templates..."
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
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Node Templates */}
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50">
            <p className="text-xs font-semibold text-zinc-700">No node templates found in database</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
              Admins can publish custom nodes and configure Free vs PRO tiers via Admin Node Studio.
            </p>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                ⚙️ Open Admin Node Studio
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id || tpl.title}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all space-y-2.5 ${
                  tpl.isPremium
                    ? "border-amber-200/90 bg-amber-50/20 hover:border-amber-300 hover:bg-white"
                    : "border-zinc-200/80 bg-zinc-50/40 hover:border-zinc-300 hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {tpl.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {tpl.isPremium ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 shadow-2xs">
                          ★ PRO
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          FREE
                        </span>
                      )}
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600">
                        {tpl.badge}
                      </span>
                      {tpl.archetype && (
                        <span className="rounded bg-zinc-200/60 px-1.5 py-0.5 text-[9px] font-mono font-medium text-zinc-500">
                          {tpl.archetype}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-900">{tpl.title}</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-100/80 flex items-center justify-between">
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {tpl.defaultMetrics?.[0] ? `${tpl.defaultMetrics[0].label}: ${tpl.defaultMetrics[0].value}` : "Ready"}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTemplate(tpl);
                      onClose();
                    }}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer shadow-2xs ${
                      tpl.isPremium
                        ? "bg-amber-600 text-white hover:bg-amber-500"
                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                    }`}
                  >
                    <SparklesIcon className="h-3 w-3 text-white" />
                    <span>{tpl.isPremium ? "Add PRO Node" : "Insert Node"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
