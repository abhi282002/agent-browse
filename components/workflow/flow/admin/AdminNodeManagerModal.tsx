"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { NodeTemplate } from "../types";
import { BotIcon, SparklesIcon } from "@/components/ui/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AdminCreateNodeForm } from "./AdminCreateNodeForm";
import { AdminNodeList } from "./AdminNodeList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminNodeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminNodeManagerModal({ isOpen, onClose }: AdminNodeManagerModalProps) {
  const utils = trpc.useContext();
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: templates, isLoading } = trpc.nodeTemplate.getAll.useQuery();

  const [isCreating, setIsCreating] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; title: string } | null>(null);

  const updateMutation = trpc.nodeTemplate.update.useMutation({
    onSuccess: () => {
      utils.nodeTemplate.getAll.invalidate();
    },
  });

  const deleteMutation = trpc.nodeTemplate.delete.useMutation({
    onSuccess: () => {
      utils.nodeTemplate.getAll.invalidate();
    },
  });

  if (currentUser?.role !== "admin") return null;

  const handleTogglePremium = (tpl: NodeTemplate) => {
    if (!tpl.id) return;
    updateMutation.mutate({
      id: tpl.id,
      isPremium: !tpl.isPremium,
    });
  };

  const handleDelete = (id: string, title: string) => {
    setTemplateToDelete({ id, title });
  };

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 flex flex-col bg-white border-l border-zinc-200 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <SheetHeader className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-2xs">
                <BotIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base font-bold text-zinc-900">
                    Admin Node Studio
                  </SheetTitle>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    ADMIN ONLY
                  </span>
                </div>
                <SheetDescription className="text-xs text-zinc-500">
                  Create and customize node templates. Customers can only use nodes enabled here.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="p-6 flex-1 flex flex-col min-h-0 space-y-4">
            {/* Toolbar: View Nodes vs Create Node */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-semibold text-zinc-700">
                System Node Templates ({templates?.length ?? 0})
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCreating(!isCreating)}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-2xs"
              >
                <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isCreating ? "View Catalog Table" : "+ Create Custom Node"}</span>
              </Button>
            </div>

            {/* Create Node Form vs Node List Table */}
            {isCreating ? (
              <AdminCreateNodeForm
                onCancel={() => setIsCreating(false)}
                onSuccess={() => setIsCreating(false)}
              />
            ) : (
              <AdminNodeList
                templates={templates}
                isLoading={isLoading}
                onTogglePremium={handleTogglePremium}
                onDelete={handleDelete}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Node Template Confirmation Dialog */}
      <AlertDialog
        open={Boolean(templateToDelete)}
        onOpenChange={(open) => { if (!open) setTemplateToDelete(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Node Template</AlertDialogTitle>
            <AlertDialogDescription>
              Delete node template{" "}
              <span className="font-semibold text-zinc-900">&ldquo;{templateToDelete?.title}&rdquo;</span>?{" "}
              This will remove it from the catalog permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (templateToDelete) {
                  deleteMutation.mutate({ id: templateToDelete.id });
                  setTemplateToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
