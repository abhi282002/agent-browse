"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Building2,
  Users,
  Sparkles,
  Settings,
  Mail,
  Trash2,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
} from "lucide-react";
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

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
}

export function OrganizationModal({
  isOpen,
  onClose,
  organizationId,
}: OrganizationModalProps) {
  const [activeTab, setActiveTab] = useState<"team" | "ai" | "settings">("team");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; email: string } | null>(null);

  const utils = trpc.useContext();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: activeOrg } = trpc.organization.getActive.useQuery(undefined, {
    enabled: isOpen && !organizationId,
  });

  const targetOrgId = organizationId || activeOrg?.id;

  const { data: org, isLoading } = trpc.organization.getById.useQuery(
    { id: targetOrgId! },
    {
      enabled: isOpen && Boolean(targetOrgId),
    }
  );

  // Form states for settings and AI
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [aiInstructions, setAiInstructions] = useState("");
  const [defaultAiModel, setDefaultAiModel] = useState("Gemini 2.5 Pro Vision");

  // Sync state with loaded org
  React.useEffect(() => {
    if (org) {
      setOrgName(org.name || "");
      setOrgDesc(org.description || "");
      setAiInstructions(org.aiInstructions || "");
      setDefaultAiModel(org.defaultAiModel || "Gemini 2.5 Pro Vision");
    }
  }, [org]);

  // Mutations
  const inviteMutation = trpc.organization.addOrInviteMember.useMutation({
    onSuccess: async (data) => {
      setFeedback({ type: "success", message: data.message });
      setInviteEmail("");
      await utils.organization.getById.invalidate({ id: targetOrgId! });
      await utils.organization.getActive.invalidate();
    },
    onError: (err) => {
      setFeedback({ type: "error", message: err.message || "Failed to add member" });
    },
  });

  const removeMemberMutation = trpc.organization.removeMember.useMutation({
    onSuccess: async () => {
      setFeedback({ type: "success", message: "Member removed from organization." });
      await utils.organization.getById.invalidate({ id: targetOrgId! });
      await utils.organization.getActive.invalidate();
    },
    onError: (err) => {
      setFeedback({ type: "error", message: err.message || "Failed to remove member" });
    },
  });

  const updateRoleMutation = trpc.organization.updateMemberRole.useMutation({
    onSuccess: async () => {
      setFeedback({ type: "success", message: "Member role updated." });
      await utils.organization.getById.invalidate({ id: targetOrgId! });
    },
    onError: (err) => {
      setFeedback({ type: "error", message: err.message || "Failed to update role" });
    },
  });

  const updateSettingsMutation = trpc.organization.updateSettings.useMutation({
    onSuccess: async () => {
      setFeedback({ type: "success", message: "Organization settings updated successfully." });
      await utils.organization.getById.invalidate({ id: targetOrgId! });
      await utils.organization.getActive.invalidate();
      await utils.organization.list.invalidate();
    },
    onError: (err) => {
      setFeedback({ type: "error", message: err.message || "Failed to update settings" });
    },
  });

  const isOwner = org?.userRole === "owner";
  const isAdmin = isOwner || org?.userRole === "admin";

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!inviteEmail.trim() || !targetOrgId) return;
    inviteMutation.mutate({
      organizationId: targetOrgId,
      email: inviteEmail.trim(),
      role: inviteRole,
    });
  };

  const handleSaveSettings = () => {
    setFeedback(null);
    if (!targetOrgId) return;
    updateSettingsMutation.mutate({
      organizationId: targetOrgId,
      name: orgName,
      description: orgDesc,
      aiInstructions,
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
        <SheetHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base font-bold text-zinc-900">
                  {org?.name || "Organization Management"}
                </SheetTitle>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  {org?.userRole || "member"}
                </span>
              </div>
              <SheetDescription className="text-xs text-zinc-500">
                Manage members, roles, permissions, and organization-level AI agent directives.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 border-b border-zinc-200 bg-white gap-2 text-xs font-semibold">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setActiveTab("team");
              setFeedback(null);
            }}
            className={`flex items-center gap-1.5 py-3 px-2 h-auto rounded-none border-b-2 transition-colors ${
              activeTab === "team"
                ? "border-zinc-900 text-zinc-900 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Team & Members ({org?.members?.length || 0})</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setActiveTab("ai");
              setFeedback(null);
            }}
            className={`flex items-center gap-1.5 py-3 px-2 h-auto rounded-none border-b-2 transition-colors ${
              activeTab === "ai"
                ? "border-zinc-900 text-zinc-900 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>AI Directives & Heuristics</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setActiveTab("settings");
              setFeedback(null);
            }}
            className={`flex items-center gap-1.5 py-3 px-2 h-auto rounded-none border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-zinc-900 text-zinc-900 font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
              <span>Loading organization details...</span>
            </div>
          ) : activeTab === "team" ? (
            <div className="space-y-6">
              {/* Add / Invite Member Section */}
              {isAdmin && (
                <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <UserPlus className="h-3.5 w-3.5 text-zinc-600" />
                      <span>Add People to Organization</span>
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Existing users are added instantly; new users receive an invite
                    </span>
                  </div>

                  <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 z-10" />
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        required
                        className="h-9 pl-9 pr-3 text-xs bg-white"
                      />
                    </div>

                    <Select
                      value={inviteRole}
                      onValueChange={(val) => {
                        if (val) setInviteRole(val as "member" | "admin");
                      }}
                    >
                      <SelectTrigger className="h-9 w-28 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 focus:border-zinc-900 cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={inviteMutation.isPending}
                      className="h-9 px-4 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 shrink-0"
                    >
                      {inviteMutation.isPending ? "Adding..." : "Add to Team"}
                    </Button>
                  </form>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-800">
                  Active Team Members ({org?.members?.length || 0})
                </span>

                <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xs">
                  {org?.members?.map((member: any) => {
                    const isSelf = member.user.id === user?.id;
                    const canModify =
                      isAdmin &&
                      !isSelf &&
                      (isOwner || member.role !== "owner");

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3.5 hover:bg-zinc-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
                            {member.user.name?.[0]?.toUpperCase() ||
                              member.user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-zinc-900">
                                {member.user.name || "User"}
                              </span>
                              {isSelf && (
                                <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[9px] font-bold text-zinc-600">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {member.user.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {canModify ? (
                            <Select
                              value={member.role}
                              onValueChange={(val) => {
                                if (val) {
                                  updateRoleMutation.mutate({
                                    organizationId: targetOrgId!,
                                    targetUserId: member.user.id,
                                    role: val as any,
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 w-24 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-xs font-semibold text-zinc-800 cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                                member.role === "owner"
                                  ? "bg-purple-50 text-purple-800 border-purple-200"
                                  : member.role === "admin"
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : "bg-zinc-100 text-zinc-700 border-zinc-200"
                              }`}
                            >
                              {member.role}
                            </span>
                          )}

                          {canModify && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() =>
                                setMemberToRemove({ id: member.user.id, email: member.user.email })
                              }
                              className="rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600"
                              title="Remove member"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Remove member</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remove Member Confirmation Dialog */}
              <AlertDialog
                open={Boolean(memberToRemove)}
                onOpenChange={(open) => { if (!open) setMemberToRemove(null); }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Remove <span className="font-semibold text-zinc-900">{memberToRemove?.email}</span> from this organization? They will lose access immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setMemberToRemove(null)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => {
                        if (memberToRemove) {
                          removeMemberMutation.mutate({
                            organizationId: targetOrgId!,
                            targetUserId: memberToRemove.id,
                          });
                          setMemberToRemove(null);
                        }
                      }}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Pending Invites List */}
              {org?.invitations && org.invitations.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Pending Invitations ({org.invitations.length})</span>
                  </span>

                  <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xs">
                    {org.invitations.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3.5"
                      >
                        <div>
                          <span className="text-xs font-medium text-zinc-900">
                            {inv.email}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-zinc-400">
                              Role: {inv.role}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              • Expires in 7 days
                            </span>
                          </div>
                        </div>

                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "ai" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Autonomous Agent Directives &amp; Heuristics</span>
                </div>
                <p className="text-xs text-emerald-800/90 leading-relaxed">
                  These custom instructions are automatically fed to Google Gemini 2.5 Pro Vision
                  and Grok 2 Vision when any team member designs or generates a browser automation workflow.
                </p>
              </div>

              {/* AI Instructions Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="org-system-ai" className="text-xs font-bold text-zinc-800">
                    System-Level AI Guidelines &amp; Organization Rules
                  </Label>
                  <span className="text-[11px] text-zinc-400">
                    Supports domain guardrails, format guidelines, and privacy policies
                  </span>
                </div>

                <Textarea
                  id="org-system-ai"
                  rows={6}
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="E.g., We are a financial intelligence firm. Always format pricing in USD, calculate YoY discounts, extract SKU identifiers, and flag any inventory shortages prominently."
                  className="bg-zinc-50/50 text-xs focus:bg-white resize-none"
                />
                <span className="text-[11px] text-zinc-400">
                  Injected dynamically during agent runs: Gemini 2.5 Pro Vision &amp; Grok 2
                </span>
              </div>

              {/* Default AI Model Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-800">
                  Default Organization AI Engine
                </Label>
                <Select
                  value={defaultAiModel}
                  onValueChange={(val) => {
                    if (val) setDefaultAiModel(val);
                  }}
                  disabled={!isAdmin}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs font-medium text-zinc-800 focus:border-zinc-900 cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gemini 2.5 Pro Vision">
                      Gemini 2.5 Pro Vision (Google DeepMind • Multimodal DOM Perception)
                    </SelectItem>
                    <SelectItem value="Grok 2 Vision">
                      Grok 2 Vision (xAI • Deep Web Reasoning &amp; Realtime Heuristics)
                    </SelectItem>
                    <SelectItem value="Gemini 2.5 Flash">
                      Gemini 2.5 Flash (Google • High Speed Sub-Second Execution)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-zinc-100 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveSettings}
                    disabled={updateSettingsMutation.isPending}
                    className="flex items-center gap-1.5 h-9 px-5 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 shadow-xs"
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save AI Heuristics"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name-setting" className="text-xs font-bold text-zinc-800">
                  Organization Name
                </Label>
                <Input
                  id="org-name-setting"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={!isAdmin}
                  className="h-9 bg-zinc-50/50 text-xs focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-desc-setting" className="text-xs font-bold text-zinc-800">
                  Description
                </Label>
                <Input
                  id="org-desc-setting"
                  type="text"
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Primary workspace for web agent workflows"
                  className="h-9 bg-zinc-50/50 text-xs focus:bg-white"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-zinc-800">Organization Slug</span>
                <div className="text-xs font-mono text-zinc-500 bg-zinc-100 p-2.5 rounded-xl border border-zinc-200">
                  {org?.slug}
                </div>
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-zinc-100">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveSettings}
                    disabled={updateSettingsMutation.isPending}
                    className="h-9 px-5 rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
