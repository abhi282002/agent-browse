"use client";

import React from "react";
import { GoogleIcon, GitHubIcon } from "@/components/ui/icons";

interface SocialAuthProps {
  onSelect?: (provider: "google" | "github") => void;
  disabled?: boolean;
}

export function SocialAuth({ onSelect, disabled = false }: SocialAuthProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect?.("google")}
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-xs transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50"
        >
          <GoogleIcon className="h-4 w-4" />
          <span>Google</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect?.("github")}
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-xs transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50"
        >
          <GitHubIcon className="h-4 w-4" />
          <span>GitHub</span>
        </button>
      </div>

      <div className="relative my-2 flex items-center justify-center">
        <div className="w-full border-t border-zinc-200" />
        <span className="absolute bg-white px-2.5 text-[11px] font-medium tracking-wider uppercase text-zinc-400">
          or continue with email
        </span>
      </div>
    </div>
  );
}
