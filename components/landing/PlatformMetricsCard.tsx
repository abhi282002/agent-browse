import React from 'react';
import { ShieldCheckIcon, ExternalLinkIcon } from '@/components/ui/icons';

export const PlatformMetricsCard: React.FC = () => {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-800">
        <span>Infrastructure Telemetry</span>
        <span className="text-emerald-600 text-[11px] font-mono">Live Sync</span>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-100">
          <div className="text-[10px] uppercase font-medium text-zinc-400">Actions Today</div>
          <div className="text-lg font-bold text-zinc-900 mt-0.5">4,819,204</div>
          <div className="text-[10px] text-emerald-600 font-medium">↑ 14% vs yesterday</div>
        </div>
        <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-100">
          <div className="text-[10px] uppercase font-medium text-zinc-400">Avg. Step Latency</div>
          <div className="text-lg font-bold text-zinc-900 mt-0.5">48ms</div>
          <div className="text-[10px] text-zinc-500">Sub-second DOM parsing</div>
        </div>
      </div>
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
          <span>Encrypted CDP Proxy</span>
        </span>
        <a href="#security" className="text-zinc-700 hover:text-zinc-900 font-medium flex items-center gap-1 text-[11px]">
          <span>Security Whitepaper</span>
          <ExternalLinkIcon className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
