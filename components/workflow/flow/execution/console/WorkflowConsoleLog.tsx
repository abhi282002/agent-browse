'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Terminal,
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
  Play,
  Clock,
  Layers,
  Sparkles,
  Radio,
} from 'lucide-react';
import type { WorkflowBlueprint } from '../../types';
import type { WorkflowExecutionResult } from '@/server/services/browserbaseService';
import { WorkflowLogViewer, type ExecutionLogEntry } from './WorkflowLogViewer';
import { BrowserbaseSessionRelay } from './BrowserbaseSessionRelay';
import { Button } from '@/components/ui/button';

interface WorkflowConsoleLogProps {
  workflow: WorkflowBlueprint;
  isRunning: boolean;
  executionResult?: WorkflowExecutionResult | null;
  isOpen: boolean;
  onClose: () => void;
  onRunWorkflow?: () => void;
  className?: string;
}

export function WorkflowConsoleLog({
  workflow,
  isRunning,
  executionResult,
  isOpen,
  onClose,
  onRunWorkflow,
  className = '',
}: WorkflowConsoleLogProps) {
  // Height management state
  const [consoleHeight, setConsoleHeight] = useState<number>(440);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);

  // Execution timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Local logs state to allow clearing
  const [clearedAt, setClearedAt] = useState<number | null>(null);

  // Drag-to-resize height handling
  const startDragY = useRef(0);
  const startHeight = useRef(440);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingHeight(true);
    startDragY.current = e.clientY;
    startHeight.current = consoleHeight;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingHeight) return;
      // Moving up increases height; moving down decreases height
      const delta = startDragY.current - e.clientY;
      const newHeight = Math.min(Math.max(startHeight.current + delta, 240), 850);
      setConsoleHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDraggingHeight) {
        setIsDraggingHeight(false);
      }
    };

    if (isDraggingHeight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHeight]);

  // Execution duration timer
  useEffect(() => {
    if (isRunning) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Automatically unminimize if workflow starts running
  useEffect(() => {
    if (isRunning) {
      setIsMinimized(false);
    }
  }, [isRunning]);

  // Compile real-time logs from workflow nodes and executionResult
  const compiledLogs: ExecutionLogEntry[] = useMemo(() => {
    const list: ExecutionLogEntry[] = [];

    // 1. Logs from executionResult steps
    if (executionResult?.steps) {
      for (const step of executionResult.steps) {
        if (step.logs && step.logs.length > 0) {
          step.logs.forEach((line, idx) => {
            const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail');
            const isSuccess = line.includes('✓') || line.toLowerCase().includes('success') || line.toLowerCase().includes('completed');
            const isWarn = line.includes('⚠') || line.toLowerCase().includes('warn');

            list.push({
              id: `res-${step.stepId}-${idx}`,
              timestamp: executionResult.startedAt || new Date().toISOString(),
              stepNumber: step.stepNumber,
              stepTitle: step.title,
              level: isError ? 'error' : isSuccess ? 'success' : isWarn ? 'warn' : 'info',
              message: line,
            });
          });
        }
      }
    }

    // 2. Logs currently accumulated on node data
    for (const node of workflow.nodes) {
      if (node.data.logLines && node.data.logLines.length > 0) {
        node.data.logLines.forEach((line, idx) => {
          const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail');
          const isSuccess = line.includes('✓') || line.toLowerCase().includes('success') || line.toLowerCase().includes('ready');
          const isWarn = line.includes('⚠') || line.toLowerCase().includes('warn');

          const exists = list.some((l) => l.stepNumber === node.data.stepNumber && l.message === line);
          if (!exists) {
            list.push({
              id: `node-${node.id}-${idx}`,
              timestamp: new Date().toISOString(),
              stepNumber: node.data.stepNumber,
              stepTitle: node.data.title,
              level: isError ? 'error' : isSuccess ? 'success' : isWarn ? 'warn' : 'info',
              message: line,
            });
          }
        });
      }
    }

    // Filter by clearedAt if user clicked clear
    if (clearedAt) {
      return list.filter((l) => new Date(l.timestamp).getTime() > clearedAt);
    }

    return list;
  }, [workflow.nodes, executionResult, clearedAt]);

  // Identify currently active node
  const activeNode = useMemo(() => {
    return workflow.nodes.find((n) => n.data.status === 'running') || workflow.nodes[0];
  }, [workflow.nodes]);

  const activeUrl = activeNode?.data?.url || workflow.targetUrl;

  const completedStepsCount = useMemo(() => {
    return workflow.nodes.filter((n) => n.data.status === 'completed').length;
  }, [workflow.nodes]);

  if (!isOpen) return null;

  return (
    <div
      className={`w-full rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col transition-all duration-150 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl border-zinc-700' : ''
      } ${className}`}
      style={{
        height: isFullscreen ? 'calc(100vh - 32px)' : isMinimized ? '44px' : `${consoleHeight}px`,
      }}
    >
      {/* Top Drag Handle for Height Adjustment (only when not minimized and not fullscreen) */}
      {!isMinimized && !isFullscreen && (
        <div
          onMouseDown={handleMouseDownResize}
          className="h-2 w-full bg-zinc-900/60 hover:bg-emerald-500/20 active:bg-emerald-500/30 cursor-ns-resize flex items-center justify-center transition-colors border-b border-zinc-800/40 select-none group"
          title="Drag up/down to adjust console height"
        >
          <GripHorizontal className="h-3 w-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
        </div>
      )}

      {/* Main Console Header Bar */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0 select-none">
        {/* Left Title & Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-zinc-200">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span>Execution Console</span>
          </div>

          <span className="text-zinc-600 font-mono">•</span>

          {/* Workflow Status Badge */}
          {isRunning ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-800/80 animate-pulse">
              <Radio className="h-3 w-3 animate-ping text-emerald-400" />
              <span>Running ({completedStepsCount}/{workflow.nodes.length} Steps)</span>
            </span>
          ) : executionResult ? (
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                executionResult.status === 'completed'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950/60 text-rose-400 border-rose-800'
              }`}
            >
              <span>{executionResult.status === 'completed' ? '✓ Completed' : '✕ Failed'}</span>
            </span>
          ) : (
            <span className="rounded-full bg-zinc-800 text-zinc-400 px-2 py-0.5 text-[11px] font-medium">
              Ready
            </span>
          )}

          {/* Live Timer */}
          {isRunning && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <Clock className="h-3 w-3 text-zinc-500" />
              <span>{elapsedSeconds}s</span>
            </div>
          )}
        </div>

        {/* Right Controls: Height Presets, Minimize, Maximize, Close */}
        <div className="flex items-center gap-1.5">
          {/* Run button if idle */}
          {!isRunning && onRunWorkflow && (
            <Button
              type="button"
              size="sm"
              onClick={onRunWorkflow}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 transition-colors cursor-pointer mr-1 h-auto"
              title="Execute this workflow"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Run</span>
            </Button>
          )}

          {/* Height Presets (only shown when expanded) */}
          {!isMinimized && !isFullscreen && (
            <div className="hidden md:flex items-center gap-1 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800 text-[10px] text-zinc-400 font-mono">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setConsoleHeight(320)}
                className={`px-1.5 py-0.5 rounded hover:text-white cursor-pointer h-auto ${consoleHeight === 320 ? 'bg-zinc-800 text-white font-bold' : ''}`}
                title="Compact Height (320px)"
              >
                SM
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setConsoleHeight(460)}
                className={`px-1.5 py-0.5 rounded hover:text-white cursor-pointer h-auto ${consoleHeight === 460 ? 'bg-zinc-800 text-white font-bold' : ''}`}
                title="Medium Height (460px)"
              >
                MD
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setConsoleHeight(640)}
                className={`px-1.5 py-0.5 rounded hover:text-white cursor-pointer h-auto ${consoleHeight === 640 ? 'bg-zinc-800 text-white font-bold' : ''}`}
                title="Large Height (640px)"
              >
                LG
              </Button>
            </div>
          )}

          {/* Minimize / Expand Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer h-auto w-auto"
            title={isMinimized ? 'Expand Console' : 'Minimize Console'}
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setIsMinimized(false);
            }}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer h-auto w-auto"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Console'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Close button */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer h-auto w-auto"
            title="Close Console"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resizable Two-Column Layout: Left (Logs) | Right (Browserbase Session Relay) */}
      {!isMinimized && (
        <div className="flex-1 w-full overflow-hidden">
          <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
            {/* Left Panel: Real-time Workflow Execution Logs */}
            <ResizablePanel defaultSize={50} minSize={25} className="h-full">
              <WorkflowLogViewer
                logs={compiledLogs}
                isRunning={isRunning}
                activeStepNumber={activeNode?.data?.stepNumber}
                workflowName={workflow.name}
                onClear={() => setClearedAt(Date.now())}
              />
            </ResizablePanel>

            {/* Vertical Splitter Handle */}
            <ResizableHandle withHandle className="bg-zinc-800 hover:bg-emerald-500 transition-colors" />

            {/* Right Panel: Browserbase Session Relay Video & Live View */}
            <ResizablePanel defaultSize={50} minSize={25} className="h-full">
              <BrowserbaseSessionRelay
                sessionId={executionResult?.sessionId}
                liveViewUrl={executionResult?.liveViewUrl}
                isRunning={isRunning}
                activeUrl={activeUrl}
                currentStepTitle={activeNode?.data?.title}
                executionResult={executionResult}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
}
