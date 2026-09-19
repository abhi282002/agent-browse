"use client";

import React from "react";
import { trpc } from "@/lib/trpc/client";
import type { NodeTemplate } from "../types";
import { SparklesIcon } from "@/components/ui/icons";

interface NodePaletteProps {
  onAddNode: (template: NodeTemplate) => void;
  onOpenCatalog: () => void;
}

export function NodePalette({ onAddNode, onOpenCatalog }: NodePaletteProps) {
  const { data: serverTemplates } = trpc.nodeTemplate.getAll.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  const templates: NodeTemplate[] = (serverTemplates as NodeTemplate[]) ?? [];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Catalog Button */}
      <button
        type="button"
        onClick={onOpenCatalog}
        className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 transition-all cursor-pointer"
      >
        <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
        <span>+ Add Step Node</span>
      </button>

      {/* Quick Add Chips */}
      <div className="flex items-center gap-1 rounded-xl border border-zinc-200/80 bg-white p-1 shadow-2xs">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 select-none">
          Quick (Click / Drag):
        </span>
        {templates.length === 0 ? (
          <span className="px-2 py-1 text-[11px] text-zinc-400 italic">
            No templates in DB
          </span>
        ) : (
          templates.slice(0, 5).map((tpl) => (
            <button
              key={tpl.id || tpl.badge}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/agentbrowse-node", JSON.stringify(tpl));
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onAddNode(tpl)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-grab active:cursor-grabbing"
              title={`${tpl.title} (${tpl.isPremium ? "PRO" : "Free"}) — Click to add or drag onto canvas`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  tpl.isPremium ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span>{tpl.badge}</span>
              {tpl.isPremium && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                  PRO
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
