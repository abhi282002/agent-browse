'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
  LockIcon,
  RefreshCwIcon,
  CursorIcon,
  TerminalIcon,
} from '@/components/ui/icons';
import { WorkflowStep } from './workflowData';

interface BrowserLiveMockProps {
  currentStep: WorkflowStep;
}

export function BrowserLiveMock({ currentStep }: BrowserLiveMockProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden">
      {/* Chrome Window Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          {/* Mac / Window Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          </div>

          <div className="ml-2 flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-2xs border border-zinc-200/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Isolated Sandbox #1</span>
          </div>
        </div>

        {/* URL Bar */}
        <div className="mx-2 flex flex-1 max-w-sm items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 shadow-2xs">
          <LockIcon className="h-3 w-3 text-emerald-600 shrink-0" />
          <span className="truncate font-mono text-[11px]">
            {currentStep.url}
          </span>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <RefreshCwIcon className="h-3.5 w-3.5 hover:text-zinc-700 cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Simulated Viewport Canvas */}
      <div className="relative h-60 w-full bg-zinc-50/70 p-4 overflow-hidden border-b border-zinc-100 flex flex-col justify-between">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#000 1px, transparent 1px), radial-gradient(#000 1px, #f4f4f5 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Mock Page Content based on current step */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 tracking-tight">
                AgentBrowse
              </span>
              <span className="text-[10px] text-zinc-400">
                Live Workflow Execution
              </span>
            </div>
            <span className="rounded bg-zinc-200/60 px-2 py-0.5 text-[10px] font-mono text-zinc-600">
              CDP port: 9222
            </span>
          </div>

          {/* Search bar mock element */}
          <div className="relative rounded-lg border border-zinc-200 bg-white p-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-zinc-800">
                {currentStep.stepNumber >= 3
                  ? 'Nike Air Max 270 — Price Drop Alert'
                  : 'Search products...'}
              </span>
              <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] text-white">
                Scan
              </span>
            </div>

            {/* Visual element bounding box when in grounding or execution */}
            {(currentStep.stepNumber === 2 || currentStep.stepNumber === 3) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 rounded-lg border-2 border-emerald-500 bg-emerald-500/10 pointer-events-none"
              >
                <span className="absolute -top-2.5 right-2 rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-white">
                  DOM:target[interactable]
                </span>
              </motion.div>
            )}
          </div>

          {/* Product listings mock */}
          <div className="space-y-1.5 pt-1">
            <div className="rounded-lg border border-zinc-200/70 bg-white p-2 text-left shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-800">
                  Nike Air Max 270 — $89.99 → $67.49 (-25%)
                </span>
                <span className="text-[9px] rounded bg-emerald-50 text-emerald-700 px-1 border border-emerald-200">
                  Price Drop
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-zinc-500">
                Extracted via AgentBrowse · nike.com · 18 ms DOM parse
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200/70 bg-white/70 p-2 text-left shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-800">
                  Adidas Ultra Boost 22 — $120.00 (In Stock)
                </span>
                <span className="text-[9px] rounded bg-zinc-100 text-zinc-600 px-1">
                  Indexed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Agent Mouse Cursor */}
        {currentStep.cursorTarget && (
          <motion.div
            className="absolute z-30 pointer-events-none"
            animate={{
              left: `${currentStep.cursorTarget.x}%`,
              top: `${currentStep.cursorTarget.y}%`,
            }}
            transition={{
              type: 'spring',
              stiffness: 140,
              damping: 18,
            }}
          >
            <div className="relative">
              <CursorIcon className="h-5 w-5 text-zinc-900 drop-shadow-sm -rotate-12" />
              {/* Ripple ping on click */}
              <motion.span
                key={currentStep.id}
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute -top-1 -left-1 h-6 w-6 rounded-full bg-emerald-500 pointer-events-none"
              />
              <span className="ml-4 -mt-2 inline-block rounded bg-zinc-900/90 backdrop-blur-xs px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white whitespace-nowrap shadow-xs">
                {currentStep.cursorTarget.label}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Real-time Agent Log Stream Terminal */}
      <div className="bg-zinc-950 p-3 text-zinc-300 font-mono text-[11px]">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-zinc-500 text-[10px]">
          <span className="flex items-center gap-1.5">
            <TerminalIcon className="h-3 w-3 text-zinc-400" />
            <span>agent-telemetry-stream</span>
          </span>
          <span className="text-emerald-400">● LIVE</span>
        </div>

        <div className="space-y-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-0.5"
            >
              {currentStep.logLines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-1.5 leading-relaxed"
                >
                  <span className="text-zinc-600 select-none">&gt;</span>
                  <span
                    className={
                      idx === 0
                        ? 'text-zinc-200'
                        : idx === currentStep.logLines.length - 1
                          ? 'text-emerald-400'
                          : 'text-zinc-400'
                    }
                  >
                    {line}
                  </span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
