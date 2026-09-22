'use client';

import { Button } from '@/components/ui/button';
import { BotIcon, SparklesIcon } from '@/components/ui/icons';

export interface EmptyWorkflowStateProps {
  onCreateWorkflow: () => void;
  className?: string;
}

export function EmptyWorkflowState({
  onCreateWorkflow,
  className = '',
}: EmptyWorkflowStateProps) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-xs ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xs mb-4">
        <BotIcon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-zinc-900">
        No Workflows in Database
      </h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-md">
        Create your first autonomous browser agent workflow to start automating
        tasks with Chromium and AI vision.
      </p>
      <Button
        onClick={onCreateWorkflow}
        className="mt-5 gap-2 cursor-pointer"
        size="sm"
      >
        <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
        <span>+ Create New Workflow</span>
      </Button>
    </div>
  );
}
