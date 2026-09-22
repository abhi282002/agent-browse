'use client';

import React from 'react';
import { Database } from 'lucide-react';
import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';

interface StepTelemetryTabProps {
  executionResult?: WorkflowExecutionResult | null;
}

export function StepTelemetryTab({
  executionResult,
}: StepTelemetryTabProps) {
  return (
    <div className="h-full w-full p-4 overflow-y-auto font-mono text-xs text-zinc-300 space-y-3">
      {executionResult ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
            <div>
              <span className="text-zinc-400">Total Steps: </span>
              <span className="font-bold text-white">
                {executionResult.totalSteps}
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Successful: </span>
              <span className="font-bold text-emerald-400">
                {executionResult.successfulSteps}
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Execution Status: </span>
              <span
                className={`font-bold ${executionResult.status === 'completed' ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {executionResult.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Step outputs list */}
          {executionResult.steps.map((step) => (
            <div
              key={step.stepId}
              className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-200">
                  #{step.stepNumber}: {step.title}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${step.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400'}`}
                >
                  {step.durationMs}ms • {step.status}
                </span>
              </div>

              {step.output && (
                <pre className="bg-zinc-950 p-2 rounded text-[11px] text-zinc-300 overflow-x-auto border border-zinc-800 max-h-40">
                  {JSON.stringify(step.output, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-12 text-center">
          <Database className="h-8 w-8 mb-2 text-zinc-700" />
          <p>No telemetry outputs available.</p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Execute the workflow to see structured step outputs.
          </p>
        </div>
      )}
    </div>
  );
}
