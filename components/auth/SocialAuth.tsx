'use client';

import { GoogleIcon, GitHubIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

interface SocialAuthProps {
  onSelect?: (provider: 'google' | 'github') => void;
  disabled?: boolean;
}

export function SocialAuth({ onSelect, disabled = false }: SocialAuthProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onSelect?.('google')}
          className="h-10 w-full gap-2.5 rounded-lg border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300"
        >
          <GoogleIcon className="h-4 w-4" />
          <span>Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onSelect?.('github')}
          className="h-10 w-full gap-2.5 rounded-lg border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300"
        >
          <GitHubIcon className="h-4 w-4" />
          <span>GitHub</span>
        </Button>
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
