'use client';

import React, { useState } from 'react';
import { Clock, Search, Film, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RecentSessionsPickerProps {
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
}

export function RecentSessionsPicker({
  selectedSessionId,
  onSelectSession,
}: RecentSessionsPickerProps) {
  const [manualInput, setManualInput] = useState('');
  const recentSessionsQuery = trpc.execution.listRecentSessions.useQuery({
    limit: 8,
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualInput.trim();
    if (cleanId) {
      onSelectSession(cleanId);
      setManualInput('');
    }
  };

  const sessions = recentSessionsQuery.data || [];

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-emerald-400" />
          <span>Recent Sessions</span>
        </span>
        <Button
          type="button"
          variant="link"
          size="xs"
          onClick={() => recentSessionsQuery.refetch()}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono transition-colors cursor-pointer p-0 h-auto"
        >
          Refresh list
        </Button>
      </div>

      {/* Manual Input form */}
      <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste Browserbase session ID..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 h-8 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 font-mono"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!manualInput.trim()}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors cursor-pointer h-8"
        >
          Load
        </Button>
      </form>

      {/* Recent sessions list */}
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
        {recentSessionsQuery.isLoading ? (
          <div className="text-xs text-zinc-500 py-3 text-center">
            Loading recent sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-xs text-zinc-500 py-3 text-center">
            No recent sessions found.
          </div>
        ) : (
          sessions.map((s) => {
            const isSelected = selectedSessionId === s.id;
            const isCompleted = s.status === 'COMPLETED';

            return (
              <Button
                key={s.id}
                type="button"
                variant="ghost"
                onClick={() => onSelectSession(s.id)}
                className={`flex h-auto w-full items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 shadow-xs hover:bg-emerald-950'
                    : 'bg-zinc-950/60 hover:bg-zinc-800 border-zinc-800/80 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Film
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isSelected ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  />
                  <span className="font-mono text-xs truncate max-w-[170px] sm:max-w-[220px]">
                    {s.id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isCompleted
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {s.status}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}
