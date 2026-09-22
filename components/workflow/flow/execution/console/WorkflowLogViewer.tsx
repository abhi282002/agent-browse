'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Copy,
  Check,
  Trash2,
  ArrowDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Terminal,
} from 'lucide-react';

export interface ExecutionLogEntry {
  id: string;
  timestamp: string;
  stepNumber?: number;
  stepTitle?: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

interface WorkflowLogViewerProps {
  logs: ExecutionLogEntry[];
  isRunning: boolean;
  activeStepNumber?: number;
  onClear?: () => void;
  workflowName?: string;
}

export function WorkflowLogViewer({
  logs,
  isRunning,
  activeStepNumber,
  onClear,
  workflowName,
}: WorkflowLogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'success' | 'warn' | 'error'>('all');
  const [selectedStep, setSelectedStep] = useState<number | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Available steps list from logs
  const availableSteps = useMemo(() => {
    const stepMap = new Map<number, string>();
    for (const log of logs) {
      if (typeof log.stepNumber === 'number') {
        stepMap.set(log.stepNumber, log.stepTitle || `Step ${log.stepNumber}`);
      }
    }
    return Array.from(stepMap.entries()).sort(([a], [b]) => a - b);
  }, [logs]);

  // Filter logs by search, level, and step
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) {
        return false;
      }
      if (selectedStep !== 'all' && log.stepNumber !== selectedStep) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const msgMatch = log.message.toLowerCase().includes(q);
        const titleMatch = log.stepTitle?.toLowerCase().includes(q) ?? false;
        return msgMatch || titleMatch;
      }
      return true;
    });
  }, [logs, levelFilter, selectedStep, searchQuery]);

  // Handle auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}]${l.stepTitle ? ` [${l.stepTitle}]` : ''} ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getLevelIcon = (level: ExecutionLogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'warn':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />;
    }
  };

  const getLevelClass = (level: ExecutionLogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-emerald-300';
      case 'warn':
        return 'text-amber-300';
      case 'error':
        return 'text-rose-300';
      default:
        return 'text-zinc-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 select-text overflow-hidden font-mono text-xs">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 text-[11px] shrink-0 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[140px] max-w-[240px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 text-xs"
          />
        </div>

        {/* Step selector */}
        {availableSteps.length > 0 && (
          <div className="flex items-center gap-1">
            <select
              value={selectedStep}
              onChange={(e) => setSelectedStep(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-800 rounded-md text-[11px] text-zinc-300 px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="all">All Steps ({logs.length})</option>
              {availableSteps.map(([num, title]) => (
                <option key={num} value={num}>
                  Step {num}: {title.length > 20 ? `${title.slice(0, 20)}...` : title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Level Filters */}
        <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
          {(['all', 'info', 'success', 'warn', 'error'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={`px-2 py-0.5 rounded capitalize text-[10px] font-medium transition-colors cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Auto-scroll toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border transition-colors cursor-pointer ${
              autoScroll
                ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-400'
                : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
            }`}
            title={autoScroll ? 'Auto-scroll is ON' : 'Auto-scroll is PAUSED'}
          >
            <ArrowDown className={`h-3 w-3 ${autoScroll ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span className="hidden sm:inline">Follow</span>
          </button>

          {/* Copy logs */}
          <button
            type="button"
            onClick={handleCopyLogs}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] border border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40"
            title="Copy filtered logs to clipboard"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Clear logs */}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={logs.length === 0}
              className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40"
              title="Clear logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Log Feed List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-12 text-center">
            <Terminal className="h-8 w-8 mb-2 text-zinc-700" />
            <p className="text-xs font-medium text-zinc-400">
              {logs.length === 0
                ? 'No execution logs recorded yet.'
                : 'No logs match your filter criteria.'}
            </p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              {logs.length === 0
                ? isRunning
                  ? 'Workflow is starting — awaiting telemetry...'
                  : 'Click "Run Workflow" to trigger pipeline execution and stream live logs.'
                : 'Try adjusting the search query or step/level filter.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((entry, index) => (
            <div
              key={entry.id || `${entry.timestamp}-${index}`}
              className="flex items-start gap-2 hover:bg-zinc-900/60 p-1 rounded transition-colors group"
            >
              {/* Log Level Icon */}
              {getLevelIcon(entry.level)}

              {/* Timestamp */}
              <span className="text-zinc-600 text-[10px] shrink-0 select-none pt-0.5">
                {entry.timestamp.split('T')[1]?.slice(0, 8) || entry.timestamp}
              </span>

              {/* Step Badge */}
              {entry.stepNumber !== undefined && (
                <span className="rounded bg-zinc-800 text-zinc-400 px-1.5 py-0.2 text-[10px] shrink-0 font-bold">
                  #{entry.stepNumber}
                </span>
              )}

              {/* Message */}
              <div className={`flex-1 break-all leading-relaxed ${getLevelClass(entry.level)}`}>
                {entry.message}
              </div>
            </div>
          ))
        )}

        {/* Live Running Indicator at the bottom */}
        {isRunning && (
          <div className="flex items-center gap-2 py-2 px-1 text-emerald-400 text-xs animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Agent executing step {activeStepNumber ? `#${activeStepNumber}` : '...' } (listening for CDP events)</span>
          </div>
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-zinc-900/70 border-t border-zinc-800 text-[10px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-2">
          <span>{filteredLogs.length} / {logs.length} lines</span>
          {workflowName && <span className="text-zinc-600">• {workflowName}</span>}
        </div>
        <div>
          {isRunning ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Streaming Live
            </span>
          ) : (
            <span>Console Ready</span>
          )}
        </div>
      </div>
    </div>
  );
}
