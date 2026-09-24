import React from 'react';
import { BotIcon } from '@/components/ui/icons';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-zinc-200/80 bg-white/70 py-6 text-xs text-zinc-500">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <BotIcon className="h-4 w-4 text-zinc-800" />
          <span className="font-semibold text-zinc-800">AgentBrowse Inc.</span>
          <span>— The open runtime for web agents.</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span>SOC-2 Type II</span>
          <span>•</span>
          <span>GDPR Compliant</span>
          <span>•</span>
          <span>Zero Data Retention Sandbox</span>
        </div>
      </div>
    </footer>
  );
};
