'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScheduleCard } from './ScheduleCard';

export interface WorkflowScheduleSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  workflowName: string;
}

export function WorkflowScheduleSheet({
  isOpen,
  onOpenChange,
  workflowId,
  workflowName,
}: WorkflowScheduleSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-zinc-100">
          <SheetTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <span>⏰</span>
            <span>Workflow Schedule</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500">
            Automate <span className="font-medium text-zinc-700">{workflowName}</span> to run on a recurring schedule via Trigger.dev.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ScheduleCard workflowId={workflowId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
