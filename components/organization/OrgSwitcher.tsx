"use client";

import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useOrgStore } from "@/stores/useOrgStore";

import { Building2, Check, ChevronDown, Plus, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrgSwitcherProps {
  onOpenCreateOrg?: () => void;
  onOpenManageOrg?: () => void;
  switchOnly?: boolean;
}

export function OrgSwitcher({
  onOpenCreateOrg,
  onOpenManageOrg,
  switchOnly = false,
}: OrgSwitcherProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storeActiveOrgId = useOrgStore((state) => state.activeOrgId);
  const storeActiveOrg = useOrgStore((state) => state.activeOrganization);
  const setActiveOrganization = useOrgStore((state) => state.setActiveOrganization);
  const setActiveOrgId = useOrgStore((state) => state.setActiveOrgId);
  const openOrgModal = useOrgStore((state) => state.openOrgModal);
  const openCreateOrgModal = useOrgStore((state) => state.openCreateOrgModal);

  const utils = trpc.useContext();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: organizations, isLoading } = trpc.organization.list.useQuery(
    undefined,
    {
      enabled: Boolean(user),
      staleTime: 10 * 1000,
    }
  );
  const { data: activeOrg } = trpc.organization.getActive.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 10 * 1000,
  });

  // Sync server active organization to Zustand store
  useEffect(() => {
    if (activeOrg && (!storeActiveOrgId || storeActiveOrgId !== activeOrg.id)) {
      setActiveOrganization(activeOrg);
    }
  }, [activeOrg, storeActiveOrgId, setActiveOrganization]);

  const switchMutation = trpc.organization.switchActive.useMutation({
    onSuccess: async (data) => {
      setActiveOrgId(data.id);
      setActiveOrganization(data);
      await utils.organization.getActive.invalidate();
      await utils.workflow.getAll.invalidate();
      setIsOpen(false);
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const currentOrg = storeActiveOrg || activeOrg;
  const currentOrgName =
    currentOrg?.name || user.workspaceName || "Personal Workspace";
  const userRole = currentOrg?.userRole || "owner";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-auto items-center gap-2 rounded-xl border-zinc-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300"
        title={switchOnly ? "Switch Organization" : "Switch Organization or Manage Team"}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900 text-white text-[10px] font-bold">
          <Building2 className="h-3 w-3" />
        </div>
        <div className="flex items-center gap-1.5 max-w-[140px] sm:max-w-[190px] truncate">
          <span className="truncate">{currentOrgName}</span>
          <span className="rounded bg-zinc-100 px-1 py-0.2 text-[9px] font-semibold text-zinc-500 uppercase tracking-wider border border-zinc-200">
            {userRole}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2.5 py-1.5 border-b border-zinc-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Organizations
            </div>
          </div>

          <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
            {isLoading ? (
              <div className="px-3 py-2 text-xs text-zinc-400 flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                <span>Loading organizations...</span>
              </div>
            ) : organizations && organizations.length > 0 ? (
              organizations.map((org) => {
                const isActive = (storeActiveOrgId || activeOrg?.id) === org.id;
                return (
                  <Button
                    key={org.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!isActive) {
                        switchMutation.mutate({ organizationId: org.id });
                      }
                    }}
                    className={`flex h-auto w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs ${
                      isActive
                        ? "bg-zinc-100 font-bold text-zinc-900 hover:bg-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                          isActive
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        }`}
                      >
                        {org.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="truncate">{org.name}</span>
                        <span className="text-[10px] text-zinc-400 font-normal">
                          {org.memberCount} {org.memberCount === 1 ? "member" : "members"} • {org.workflowCount} workflows
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                  </Button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-xs text-zinc-500">
                No organizations found
              </div>
            )}
          </div>

          {!switchOnly && (
            <div className="pt-1 mt-1 border-t border-zinc-100 space-y-0.5">
              {/* Manage Active Organization */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenManageOrg) {
                    onOpenManageOrg();
                  } else {
                    openOrgModal();
                  }
                }}
                className="flex h-auto w-full items-center justify-start gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              >
                <Users className="h-3.5 w-3.5 text-zinc-500" />
                <span>Manage Team & Directives</span>
              </Button>

              {/* Create Organization */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenCreateOrg) {
                    onOpenCreateOrg();
                  } else {
                    openCreateOrgModal();
                  }
                }}
                className="flex h-auto w-full items-center justify-start gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                <span>Create New Organization</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
