"use client";

import React, { useState } from "react";
import { EyeIcon, EyeOffIcon, ArrowRightIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface SignUpFormProps {
  onSuccess?: (details: { name: string; email: string; workspace: string }) => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const utils = trpc.useContext();

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: async (user) => {
      setErrorMessage(null);
      setSuccessMessage("Workspace created! Provisioning isolated browser sandbox...");
      await utils.auth.me.invalidate();
      onSuccess?.({
        name: user.name,
        email: user.email,
        workspace: user.workspaceName,
      });
    },
    onError: (error) => {
      setSuccessMessage(null);
      setErrorMessage(error.message || "Failed to create account. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!agreeTerms) {
      setErrorMessage("Please accept the Terms of Service & Privacy Policy.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    signUpMutation.mutate({
      name,
      email,
      password,
      workspaceName: workspace || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-name" className="text-xs font-semibold text-zinc-700">
            Full Name
          </Label>
          <Input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            required
            autoComplete="name"
            className="h-10 bg-zinc-50/50 text-sm focus:bg-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-workspace" className="text-xs font-semibold text-zinc-700">
            Workspace Name
          </Label>
          <Input
            id="signup-workspace"
            type="text"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
            placeholder="e.g. Acme Research"
            className="h-10 bg-zinc-50/50 text-sm focus:bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email" className="text-xs font-semibold text-zinc-700">
          Work Email
        </Label>
        <Input
          id="signup-email"
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
        <Label htmlFor="signup-password" className="text-xs font-semibold text-zinc-700">
          Password
        </Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            autoComplete="new-password"
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

      <div className="pt-1">
        <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-zinc-600 leading-relaxed">
          <Checkbox
            checked={agreeTerms}
            onCheckedChange={(checked) => setAgreeTerms(!!checked)}
            className="mt-0.5"
          />
          <span>
            I agree to the{" "}
            <a href="#terms" className="underline hover:text-zinc-900">Terms of Service</a>{" "}
            and{" "}
            <a href="#privacy" className="underline hover:text-zinc-900">Privacy Policy</a>, including isolated sandboxed browser execution.
          </span>
        </label>
      </div>

      <Button
        type="submit"
        disabled={signUpMutation.isPending}
        className="mt-2 h-10 w-full gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
      >
        {signUpMutation.isPending ? (
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>Creating workspace...</span>
          </div>
        ) : (
          <>
            <span>Create Workspace & Start</span>
            <ArrowRightIcon className="h-4 w-4" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-zinc-500">
        <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
        <span>Includes 1,000 free agent execution minutes</span>
      </div>
    </form>
  );
}
