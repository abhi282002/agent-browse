"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { trpc } from "@/lib/trpc/client";
import { BotIcon, ChromeIcon, ShieldCheckIcon, PlayIcon, SparklesIcon } from "@/components/ui/icons";

interface AuthenticatedCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    workspaceName: string;
    role?: string;
    plan?: string;
  };
  onSignOut?: () => void;
}

export function AuthenticatedCard({ user, onSignOut }: AuthenticatedCardProps) {
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);
  const [liveViewUrl, setLiveViewUrl] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const utils = trpc.useContext();
  const signOutMutation = trpc.auth.signOut.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      onSignOut?.();
    },
  });

  const launchSandboxMutation = trpc.execution.launchSandbox.useMutation({
    onSuccess: (data) => {
      setLaunchMessage(
        `Browserbase VM active! Session: ${data.sessionId.slice(0, 14)}...`
      );
      if (data.liveViewUrl) {
        setLiveViewUrl(data.liveViewUrl);
      }
      setLaunchError(null);
    },
    onError: (err) => {
      setLaunchError(err.message || "Failed to initialize cloud browser");
      setLaunchMessage(null);
    },
  });

  const handleLaunchSandbox = () => {
    setLiveViewUrl(null);
    setLaunchError(null);
    setLaunchMessage("Allocating Browserbase cloud Chromium session...");
    launchSandboxMutation.mutate();
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top Brand & Status Pill */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
            <BotIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-900">
            AgentBrowse Workspace
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Authenticated
        </span>
      </div>

      {/* Main Authenticated Control Card */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs">
        {/* User Info Header */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white font-bold text-sm shadow-xs">
              {initials}
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-zinc-900 leading-tight">
                  {user.name}
                </span>
                {user.role === "admin" && (
                  <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500 font-mono truncate max-w-[190px]">
                {user.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={signOutMutation.isPending}
            onClick={() => signOutMutation.mutate()}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            {signOutMutation.isPending ? "Signing out..." : "Sign Out"}
          </button>
        </div>

        {/* Active Workspace Details */}
        <div className="my-5 rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-700">Workspace</span>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-800 border border-zinc-200/70">
                {user.workspaceName}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  user.plan === "pro"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                }`}
              >
                {user.plan ?? "free"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Execution Quota</span>
            <span className="font-mono text-zinc-800 font-semibold">1,000 / 1,000 mins</span>
          </div>

          <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[100%] rounded-full" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
            <span className="flex items-center gap-1">
              <ChromeIcon className="h-3 w-3 text-zinc-500" />
              <span>Chromium 128 (CDP)</span>
            </span>
            <span className="text-emerald-700 font-medium">Ready to deploy</span>
          </div>
        </div>

        {/* Launch Status Feedback */}
        {launchMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="font-medium">{launchMessage}</span>
            </div>
            {liveViewUrl && (
              <a
                href={liveViewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 underline hover:text-emerald-700"
              >
                <span>Open Browserbase Live Stream ↗</span>
              </a>
            )}
          </motion.div>
        )}

        {launchError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800"
          >
            {launchError}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={launchSandboxMutation.isPending}
            onClick={handleLaunchSandbox}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 font-medium text-sm text-white shadow-sm hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
          >
            {launchSandboxMutation.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Spinning up Browserbase Sandbox...</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                <span>Launch Cloud Agent Sandbox</span>
              </>
            )}
          </button>

          <Link
            href="/workflow"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white font-medium text-xs text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer"
          >
            <SparklesIcon className="h-3.5 w-3.5 text-emerald-600" />
            <span>Open Interactive Workflow Studio</span>
          </Link>
        </div>
      </div>

      {/* Security & Sandbox Footer info */}
      <div className="mt-4 flex items-center justify-between px-2 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1">
          <ShieldCheckIcon className="h-3 w-3 text-emerald-600" />
          <span>Active Session Token</span>
        </span>
        <span className="font-mono text-zinc-400">TLS 1.3 / mTLS</span>
      </div>
    </div>
  );
}
