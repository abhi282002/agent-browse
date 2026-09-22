'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface WorkflowExecutionErrorAlertProps {
  error: string | null;
  onDismiss: () => void;
  className?: string;
}

export function WorkflowExecutionErrorAlert({
  error,
  onDismiss,
  className = '',
}: WorkflowExecutionErrorAlertProps) {
  if (!error) return null;

  return (
    <div className={`px-6 py-2.5 bg-rose-50/50 border-b border-rose-200/60 ${className}`}>
      <Alert
        variant="destructive"
        className="flex items-center justify-between border-rose-200 bg-white shadow-2xs py-2 px-3"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <div>
            <AlertTitle className="text-xs font-bold text-rose-900">Execution Notice</AlertTitle>
            <AlertDescription className="text-xs text-rose-700">{error}</AlertDescription>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onDismiss}
          className="p-1 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 cursor-pointer transition-colors h-auto w-auto"
          title="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </Alert>
    </div>
  );
}
