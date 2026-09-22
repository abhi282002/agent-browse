"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Building2, Sparkles, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (org: any) => void;
}

export function CreateOrganizationModal({
  isOpen,
  onClose,
  onCreated,
}: CreateOrganizationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [aiInstructions, setAiInstructions] = useState("");
  const [defaultAiModel, setDefaultAiModel] = useState("Gemini 2.5 Pro Vision");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const utils = trpc.useContext();
  const createMutation = trpc.organization.create.useMutation({
    onSuccess: (newOrg) => {
      utils.organization.list.invalidate();
      utils.organization.getActive.invalidate();
      utils.auth.me.invalidate();
      onCreated?.(newOrg);
      onClose();
      // Reset form
      setName("");
      setDescription("");
      setAiInstructions("");
      setErrorMessage(null);
    },
    onError: (err) => {
      setErrorMessage(err.message || "Failed to create organization");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Organization name is required");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      aiInstructions: aiInstructions.trim() || undefined,
      defaultAiModel,
    });
  };

  return (
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-zinc-900">
                Create Organization
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500">
                Collaborate on autonomous workflows with your team members.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs font-bold text-zinc-800">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Research Labs"
                required
                className="h-10 bg-zinc-50/50 text-xs focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-desc" className="text-xs font-bold text-zinc-800">
                Description (Optional)
              </Label>
              <Input
                id="org-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of your team's objective"
                className="h-10 bg-zinc-50/50 text-xs focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="org-ai-instr" className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>AI Directives & Persona (Optional)</span>
                </Label>
              </div>
              <Textarea
                id="org-ai-instr"
                rows={3}
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="E.g. Focus on e-commerce price monitoring and inventory alerts."
                className="bg-zinc-50/50 text-xs focus:bg-white resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-800">
                Preferred AI Engine
              </Label>
              <Select
                value={defaultAiModel}
                onValueChange={(val) => {
                  if (val) setDefaultAiModel(val);
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs font-medium text-zinc-800 focus:border-zinc-900 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gemini 2.5 Pro Vision">
                    Gemini 2.5 Pro Vision (DeepMind)
                  </SelectItem>
                  <SelectItem value="Grok 2 Vision">
                    Grok 2 Vision (xAI)
                  </SelectItem>
                  <SelectItem value="Gemini 2.5 Flash">
                    Gemini 2.5 Flash (Low Latency)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-100 bg-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 h-10 px-5 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 shadow-xs"
            >
              {createMutation.isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Organization</span>
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
