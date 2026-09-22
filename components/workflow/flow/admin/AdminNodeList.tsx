"use client";

import React from "react";
import type { NodeTemplate } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface AdminNodeListProps {
  templates?: NodeTemplate[];
  isLoading: boolean;
  onTogglePremium: (tpl: NodeTemplate) => void;
  onDelete: (id: string, title: string) => void;
}

export function AdminNodeList({
  templates,
  isLoading,
  onTogglePremium,
  onDelete,
}: AdminNodeListProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-zinc-400">
        Loading templates from database...
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-zinc-400">
        No node templates found. Click "+ Create Custom Node" above to add one.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
      {templates.map((tpl) => (
        <div
          key={tpl.id || tpl.title}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 hover:bg-white hover:border-zinc-300 transition-all shadow-2xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-zinc-900">
                {tpl.title}
              </span>
              <Badge variant="secondary" className="text-[10px] font-mono font-medium text-zinc-600 bg-zinc-100">
                {tpl.category}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono text-zinc-700 bg-zinc-200/50 border-zinc-200">
                {tpl.archetype}
              </Badge>
              {tpl.archetype === "email" && (
                <Badge variant="outline" className="text-[10px] font-bold text-sky-800 bg-sky-50 border-sky-200">
                  {tpl.emailProvider === "nodemailer" ? "SMTP" : "Resend"}
                </Badge>
              )}
              {tpl.isPremium ? (
                <Badge className="text-[10px] font-bold text-amber-800 bg-amber-100 border-amber-200 hover:bg-amber-100">
                  ★ PRO
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                  FREE
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 line-clamp-1">
              {tpl.actionSummary}
            </p>
          </div>

          {/* Admin Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onTogglePremium(tpl)}
              className={`rounded-xl text-xs font-medium transition-colors ${
                tpl.isPremium
                  ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
              }`}
              title="Click to toggle Free vs PRO tier for customers"
            >
              {tpl.isPremium ? "Demote to Free" : "Promote to PRO"}
            </Button>

            {tpl.id && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(tpl.id!, tpl.title)}
                className="rounded-xl text-zinc-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete template"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
