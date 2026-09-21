"use client";

import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import type { NodeTemplate } from "../types";
import { NodeAddForm } from "./NodeAddForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SparklesIcon, BotIcon } from "@/components/ui/icons";

const ARCHETYPE_ICONS: Record<string, string> = {
  open_url: "🔗",
  navigation: "🌐",
  grounding: "👁",
  action: "🖱",
  form: "📝",
  extraction: "⛏",
  webhook: "🪝",
  summarization: "🤖",
  news_gather: "📰",
  news_extraction: "📰",
  news_summary: "📋",
  email: "✉️",
};

// Pill colors for the archetype badge (unselected state)
const ARCHETYPE_PILL: Record<string, string> = {
  open_url: "bg-sky-50 border-sky-200 text-sky-700",
  navigation: "bg-blue-50 border-blue-200 text-blue-700",
  grounding: "bg-violet-50 border-violet-200 text-violet-700",
  action: "bg-emerald-50 border-emerald-200 text-emerald-700",
  form: "bg-amber-50 border-amber-200 text-amber-700",
  extraction: "bg-cyan-50 border-cyan-200 text-cyan-700",
  webhook: "bg-orange-50 border-orange-200 text-orange-700",
  summarization: "bg-indigo-50 border-indigo-200 text-indigo-700",
  news_gather: "bg-rose-50 border-rose-200 text-rose-700",
  news_extraction: "bg-rose-50 border-rose-200 text-rose-700",
  news_summary: "bg-pink-50 border-pink-200 text-pink-700",
  email: "bg-teal-50 border-teal-200 text-teal-700",
};

// Left accent bar color per archetype
const ARCHETYPE_ACCENT: Record<string, string> = {
  open_url: "border-l-sky-400",
  navigation: "border-l-blue-400",
  grounding: "border-l-violet-400",
  action: "border-l-emerald-400",
  form: "border-l-amber-400",
  extraction: "border-l-cyan-400",
  webhook: "border-l-orange-400",
  summarization: "border-l-indigo-400",
  news_gather: "border-l-rose-400",
  news_extraction: "border-l-rose-400",
  news_summary: "border-l-pink-400",
  email: "border-l-teal-400",
};

interface NodePaletteSidebarProps {
  onAddNode: (
    template: NodeTemplate,
    overrides?: { url?: string; actionSummary?: string; title?: string },
  ) => void;
  onOpenCatalog: () => void;
}

export function NodePaletteSidebar({
  onAddNode,
  onOpenCatalog,
}: NodePaletteSidebarProps) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data: serverTemplates, isLoading } = trpc.nodeTemplate.getAll.useQuery(
    undefined,
    { staleTime: 60 * 1000 },
  );

  const templates: NodeTemplate[] = (serverTemplates as NodeTemplate[]) ?? [];

  // Group all templates by category
  const grouped = useMemo(() => {
    const filtered = templates.filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.archetype.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });

    return filtered.reduce<Record<string, NodeTemplate[]>>((acc, t) => {
      const cat = t.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    }, {});
  }, [templates, search]);

  const categoryKeys = Object.keys(grouped);

  // Accordion: default open all categories
  const defaultOpenValues = useMemo(
    () => categoryKeys,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryKeys.join(",")],
  );

  const getTemplateKey = (tpl: NodeTemplate) =>
    `${tpl.id ?? tpl.title}::${tpl.archetype}`;

  const handleTemplateClick = (tpl: NodeTemplate) => {
    const key = getTemplateKey(tpl);
    setSelectedKey((prev) => (prev === key ? null : key));
  };

  const handleAddFromForm = (
    tpl: NodeTemplate,
    overrides: { url: string; actionSummary: string; title: string },
  ) => {
    onAddNode(tpl, overrides);
    setSelectedKey(null);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden overscroll-contain">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white shadow-2xs">
            <BotIcon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Node Palette
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-xs"
                onClick={onOpenCatalog}
                aria-label="Open full node catalog"
              >
                <SparklesIcon className="h-3 w-3 text-emerald-500" />
              </Button>
            }
          />
          <TooltipContent side="right">
            <p>Open Full Catalog</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ── Search ── */}
      <div className="px-3 pt-2.5 pb-2 border-b border-zinc-100">
        <Input
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* ── Accordion Node List ── */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden overscroll-contain">
        <div className="px-2 py-2">
          {/* Loading skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-2 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && categoryKeys.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <p className="text-xs font-semibold text-zinc-500">
                {search ? "No nodes match your search" : "No node templates found"}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[160px]">
                {search
                  ? "Try a different search term"
                  : "No templates currently available"}
              </p>
              <Button
                variant="outline"
                size="xs"
                onClick={onOpenCatalog}
                className="mt-3 text-[11px]"
              >
                Browse Catalog
              </Button>
            </div>
          )}

          {/* Accordion grouped by category */}
          {!isLoading && categoryKeys.length > 0 && (
            <Accordion
              multiple
              defaultValue={defaultOpenValues}
              className="gap-1"
            >
              {categoryKeys.map((category) => (
                <AccordionItem
                  key={category}
                  value={category}
                  className="border-none mb-1"
                >
                  <AccordionTrigger className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 hover:no-underline rounded-lg hover:bg-zinc-50 transition-colors">
                    <span>{category}</span>
                    <span className="ml-auto mr-1 text-[9px] font-medium text-zinc-300">
                      {grouped[category].length}
                    </span>
                  </AccordionTrigger>

                  <AccordionContent className="pb-0">
                    <div className="flex flex-col gap-1 pt-0.5">
                      {grouped[category].map((tpl) => {
                        const key = getTemplateKey(tpl);
                        const isSelected = selectedKey === key;
                        const icon = ARCHETYPE_ICONS[tpl.archetype] ?? "⚡";
                        const pillColor =
                          ARCHETYPE_PILL[tpl.archetype] ??
                          "bg-zinc-100 border-zinc-200 text-zinc-600";
                        const accentColor =
                          ARCHETYPE_ACCENT[tpl.archetype] ?? "border-l-zinc-300";

                        return (
                          <div
                            key={key}
                            className="flex flex-col gap-1.5"
                          >
                            {/* ── Node Card ── */}
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData(
                                  "application/agentbrowse-node",
                                  JSON.stringify(tpl),
                                );
                                e.dataTransfer.effectAllowed = "copy";
                              }}
                              onClick={() => handleTemplateClick(tpl)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleTemplateClick(tpl)
                              }
                              className={[
                                "group flex cursor-pointer flex-col gap-1 rounded-lg border-l-2 border border-zinc-200/80 bg-white p-2 transition-all select-none",
                                accentColor,
                                isSelected
                                  ? "border-zinc-200 bg-gradient-to-r from-indigo-50 to-white shadow-sm ring-1 ring-indigo-200"
                                  : tpl.isPremium
                                    ? "hover:border-amber-200 hover:bg-amber-50/30 hover:shadow-xs"
                                    : "hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-xs",
                              ].join(" ")}
                            >
                              {/* Row 1: icon + title + tier */}
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <span className="text-sm leading-none shrink-0">
                                    {icon}
                                  </span>
                                  <span
                                    title={tpl.title}
                                    className={`text-xs font-semibold truncate ${
                                      isSelected ? "text-indigo-900" : "text-zinc-800"
                                    }`}
                                  >
                                    {tpl.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {tpl.isPremium ? (
                                    <span className="rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                      PRO
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                                      FREE
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Row 2: archetype pill + description snippet */}
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold ${pillColor}`}
                                >
                                  {tpl.archetype}
                                </span>
                                <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-1">
                                  {tpl.description}
                                </p>
                              </div>

                              {/* Row 3: hint (hover only) */}
                              <div
                                className={`text-[9px] font-medium transition-all ${
                                  isSelected
                                    ? "text-indigo-400"
                                    : "text-zinc-300 opacity-0 group-hover:opacity-100"
                                }`}
                              >
                                {isSelected
                                  ? "▾ fill in details below"
                                  : "click to configure · drag to canvas"}
                              </div>
                            </div>

                            {/* ── Inline Config Form ── */}
                            {isSelected && (
                              <NodeAddForm
                                template={tpl}
                                onAdd={handleAddFromForm}
                                onCancel={() => setSelectedKey(null)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>

      {/* ── Footer ── */}
      <div className="border-t border-zinc-100 px-3 py-2">
        <p className="text-[10px] text-zinc-400 text-center">
          {templates.length} node{templates.length !== 1 ? "s" : ""} available ·
          drag or click to add
        </p>
      </div>
    </div>
  );
}
