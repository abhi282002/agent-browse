"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SocialAuth } from "./SocialAuth";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { AuthenticatedCard } from "./AuthenticatedCard";
import { ChromeIcon, BotIcon, LockIcon } from "@/components/ui/icons";
import { trpc } from "@/lib/trpc/client";

export function AuthCard() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  // If user is authenticated, replace the sign in/up card with the AuthenticatedCard
  if (user) {
    return <AuthenticatedCard user={user} />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top Brand Pill */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
          <BotIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-zinc-900 flex items-center gap-1.5">
            AgentBrowse
            <span className="rounded-full bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600">
              v1.0
            </span>
          </span>
          <span className="text-[11px] text-zinc-500">Autonomous Web Agent Cloud</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-7 shadow-xs relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-20 flex items-center justify-center rounded-2xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          </div>
        )}

        {/* Segmented Switcher */}
        <div className="relative mb-6 grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("signin")}
            className={`relative z-10 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "signin" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`relative z-10 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "signup" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Create Account
          </button>

          {/* Animated Tab Background Indicator */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-lg bg-white shadow-xs"
            layoutId="auth-tab-pill"
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
            style={{
              width: "calc(50% - 4px)",
              left: activeTab === "signin" ? "4px" : "calc(50%)",
            }}
          />
        </div>

        {/* Heading */}
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            {activeTab === "signin" ? "Welcome back" : "Start with AgentBrowse"}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {activeTab === "signin"
              ? "Access your browser agent sandboxes and autonomous workflows."
              : "Spin up headless agent instances with Chrome DevTools Protocol."}
          </p>
        </div>

        {/* Social SSO */}
        <SocialAuth />

        {/* Dynamic Form Transition */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === "signin" ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <SignInForm />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <SignUpForm />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Security & Sandbox Footer info */}
      <div className="mt-4 flex items-center justify-between px-2 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1">
          <ChromeIcon className="h-3 w-3" />
          <span>Chromium Isolated VM</span>
        </span>
        <span className="flex items-center gap-1">
          <LockIcon className="h-3 w-3" />
          <span>SOC-2 Type II Certified</span>
        </span>
      </div>
    </div>
  );
}
