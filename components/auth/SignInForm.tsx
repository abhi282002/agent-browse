"use client";

import React, { useState } from "react";
import { EyeIcon, EyeOffIcon, ArrowRightIcon, LockIcon } from "@/components/ui/icons";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface SignInFormProps {
  onSuccess?: (email: string) => void;
  onForgotPassword?: () => void;
}

export function SignInForm({ onSuccess, onForgotPassword }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const utils = trpc.useContext();

  const signInMutation = trpc.auth.signIn.useMutation({
    onSuccess: async (user) => {
      setErrorMessage(null);
      setSuccessMessage(`Welcome back, ${user.name}! Connecting dashboard...`);
      await utils.auth.me.invalidate();
      onSuccess?.(user.email);
    },
    onError: (error) => {
      setSuccessMessage(null);
      setErrorMessage(error.message || "Failed to sign in. Please verify your credentials.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    signInMutation.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signin-email" className="text-xs font-semibold text-zinc-700">
          Work Email
        </Label>
        <Input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
          autoComplete="email"
          className="h-10 bg-zinc-50/50 text-sm focus:bg-white"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password" className="text-xs font-semibold text-zinc-700">
            Password
          </Label>
          <Button
            type="button"
            variant="link"
            size="xs"
            onClick={onForgotPassword}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 p-0 h-auto"
          >
            Forgot password?
          </Button>
        </div>
        <div className="relative">
          <Input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            className="h-10 bg-zinc-50/50 pl-3 pr-10 text-sm focus:bg-white"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-600">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(!!checked)}
          />
          <span>Remember this session</span>
        </label>
        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
          <LockIcon className="h-3 w-3" />
          <span>E2E Encrypted</span>
        </span>
      </div>

      <Button
        type="submit"
        disabled={signInMutation.isPending}
        className="mt-2 h-10 w-full gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
      >
        {signInMutation.isPending ? (
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>Connecting agent...</span>
          </div>
        ) : (
          <>
            <span>Sign in to AgentBrowse</span>
            <ArrowRightIcon className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
