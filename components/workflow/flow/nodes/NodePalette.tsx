"use client";

import React from "react";
import type { NodeTemplate } from "../types";
import { NODE_TEMPLATES } from "./nodeTemplates";
import { SparklesIcon, BotIcon, TerminalIcon } from "@/components/ui/icons";

interface NodePaletteProps {
  onAddNode: (template: NodeTemplate) => void;
  onOpenCatalog: () => void;
}

export function NodePalette({ onAddNode, onOpenCatalog }: NodePaletteProps) {
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
      <div className="flex items-center gap-1 rounded-xl border border-zinc-200/80 bg-white/90 backdrop-blur-xs p-1 shadow-2xs">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 select-none">
          Quick:
        </span>
        {NODE_TEMPLATES.slice(0, 4).map((tpl) => (
          <button
            key={tpl.archetype}
            type="button"
            onClick={() => onAddNode(tpl)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
            title={`Add ${tpl.title}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{tpl.badge}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
