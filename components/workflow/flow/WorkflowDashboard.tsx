'use client';

import { useState } from 'react';
import { useWorkflowManager } from './hooks/useWorkflowManager';
import { WorkflowCanvas } from './WorkflowCanvas';
import {
  LiveblocksWorkflowProvider,
  CollaborativeCanvas,
} from './liveblocks';
import { WorkflowSidebar } from './WorkflowSidebar';
import { NodePaletteSidebar } from './nodes/NodePaletteSidebar';
import { NodeCatalogModal } from './nodes/NodeCatalogModal';
import { NodeConfigDrawer } from './nodes/NodeConfigDrawer';
import { AdminNodeManagerModal } from './admin/AdminNodeManagerModal';
import { EditWorkflowModal } from './modals/EditWorkflowModal';
import { CreateWorkflowView } from './views/CreateWorkflowView';
import { EmptyWorkflowState } from './views/EmptyWorkflowState';
import { WorkflowConsoleToggleButton } from './execution/WorkflowConsoleToggleButton';
import { WorkflowRunButton } from './execution/WorkflowRunButton';
import { WorkflowExecutionErrorAlert } from './execution/WorkflowExecutionErrorAlert';
import { WorkflowScheduleSheet } from './execution/WorkflowScheduleSheet';
import { Button } from '@/components/ui/button';
import { BotIcon, SparklesIcon } from '@/components/ui/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { WorkflowConsoleLog } from './execution/console';
import type { NodeTemplate, WorkflowNodeType, StepNodeStatus } from './types';

interface WorkflowDashboardProps {
  initialCreateMode?: boolean;
}

export function WorkflowDashboard({
  initialCreateMode = false,
}: WorkflowDashboardProps) {
  // Real-time synchronization state for external drawer/palette actions & live execution
  const [externalNodeUpdate, setExternalNodeUpdate] = useState<{
    id: string;
    data: Partial<WorkflowNodeType['data']>;
  } | null>(null);
  const [externalNodeAdd, setExternalNodeAdd] = useState<{
    template: NodeTemplate;
    customData?: Partial<WorkflowNodeType['data']>;
  } | null>(null);
  const [externalNodeDeleteId, setExternalNodeDeleteId] = useState<string | null>(null);

  const [externalNodesUpdates, setExternalNodesUpdates] = useState<Array<{
    id: string;
    data: Partial<WorkflowNodeType['data']>;
  }> | null>(null);

  // Synchronize canvas node status (running / completed / failed) in real time
  const handleStepStatusChange = useCallback(
    (nodeId: string, status: StepNodeStatus, logs?: string[]) => {
      setExternalNodeUpdate({
        id: nodeId,
        data: {
          status,
          ...(logs ? { logLines: logs } : {}),
        },
      });
    },
    [],
  );

  const handleNodesBatchUpdate = useCallback(
    (updates: Array<{ id: string; data: Partial<WorkflowNodeType['data']> }>) => {
      setExternalNodesUpdates(updates);
    },
    [],
  );

  const {
    workflows,
    activeWorkflow,
    selectedNode,
    isRunning,
    executionResult,
    selectWorkflow,
    createWorkflow,
    addNode,
    updateNode,
    deleteNode,
    updateWorkflowDetails,
    setSelectedNode,
    runPipeline,
    stopPipeline,
    isSyncing,
    saveWorkflow,
    updateGraph,
    saveStatus,
    lastSavedAt,
    isSaving,
    executionError,
    clearExecutionError,
    isAdmin,
  } = useWorkflowManager({
    onStepStatusChange: handleStepStatusChange,
    onNodesBatchUpdate: handleNodesBatchUpdate,
  });

  const [isCreateView, setIsCreateView] = useState(initialCreateMode);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  // Automatically open the console when a workflow starts running
  useEffect(() => {
    if (isRunning) {
      setIsConsoleOpen(true);
    }
  }, [isRunning]);

  // Adapter: NodePaletteSidebar passes overrides (url, actionSummary, title)
  const handleAddNodeWithOverrides = (
    template: NodeTemplate,
    overrides?: { url?: string; actionSummary?: string; title?: string },
  ) => {
    const customData = {
      url: overrides?.url || undefined,
      actionSummary: overrides?.actionSummary || undefined,
      title: overrides?.title || undefined,
    };
    addNode(template, customData);
    setExternalNodeAdd({ template, customData });
  };

  // If create workflow view is open
  if (isCreateView) {
    return (
      <CreateWorkflowView
        onCancel={() => setIsCreateView(false)}
        onCreate={(params) => {
          createWorkflow(params);
          setIsCreateView(false);
        }}
      />
    );
  }

  // If no workflow exists in DB yet
  if (!activeWorkflow) {
    return <EmptyWorkflowState onCreateWorkflow={() => setIsCreateView(true)} />;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 2-Column Layout: NodePaletteSidebar (3 cols) | Canvas Studio (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* Left: Node Palette Sidebar (3 cols) */}
        <div className="lg:col-span-3 xl:col-span-3 lg:sticky lg:top-[68px] lg:h-[calc(100vh-140px)] min-h-[620px] overflow-hidden overscroll-contain">
          <NodePaletteSidebar
            onAddNode={handleAddNodeWithOverrides}
            onOpenCatalog={() => setIsCatalogOpen(true)}
          />
        </div>

        {/* Center & Right: React Flow Canvas Studio (9 cols) */}
        <div className="lg:col-span-9 xl:col-span-9 flex flex-col gap-2.5">
          {/* Studio Top Bar with Left Controls & Top-Right Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-white/80 backdrop-blur-xs p-2.5 rounded-2xl border border-zinc-200/90 shadow-2xs">
            {/* Left: Save + Admin Studio + Target URL pill + Sync status + Node count */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
              <button
                type="button"
                onClick={() => saveWorkflow()}
                disabled={isSaving}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  saveStatus === 'saved'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : saveStatus === 'error'
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : 'border-zinc-300/80 bg-white text-zinc-700 hover:bg-zinc-50'
                } disabled:opacity-50`}
                title="Save current workflow and nodes to PostgreSQL"
              >
                {isSaving ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-ping" />
                    <span>Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <span className="text-emerald-600">✓</span>
                    <span className="text-emerald-800">Saved</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save</span>
                  </>
                )}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Admin studio to create, edit, or customize Free/PRO nodes"
                >
                  <span>⚙️ Admin Node Studio</span>
                </button>
              )}

              {/* Workflow Settings Button */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
                title="Edit Workflow Settings & Configuration"
              >
                <span>⚙️ Settings</span>
              </button>

              <span className="hidden md:inline text-zinc-300">•</span>

              <span className="hidden md:flex items-center gap-1">
                {isSyncing ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-amber-700">Syncing...</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700 font-medium">DB Synced</span>
                  </>
                )}
              </span>

              <span className="hidden lg:inline text-zinc-300">•</span>
              <span className="hidden lg:inline text-zinc-500">
                Nodes: {activeWorkflow.nodes.length}
              </span>
            </div>

            {/* Right: Switch Workflow + Edit Settings + + New + Run Workflow */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Switch Workflow dropdown */}
              <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 shadow-2xs hover:border-zinc-300 transition-colors">
                <span className="text-xs">🗂️</span>
                <select
                  value={activeWorkflow.id}
                  onChange={(e) => selectWorkflow(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
                  title="Switch Active Workflow"
                >
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name} ({wf.nodes.length} steps)
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Workflow */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors cursor-pointer shadow-2xs"
                title="Edit Workflow Settings & Target URL"
              >
                <span>✏️</span>
                <span className="hidden sm:inline">Edit</span>
              </button>

              {/* Schedule Workflow */}
              <button
                type="button"
                onClick={() => setIsScheduleSheetOpen(true)}
                className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors cursor-pointer shadow-2xs"
                title="Set up automated schedule for this workflow"
              >
                <span>⏰</span>
                <span className="hidden sm:inline">Schedule</span>
              </button>

              {/* + New Workflow */}
              <button
                type="button"
                onClick={() => setIsCreateView(true)}
                className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors cursor-pointer shadow-2xs"
                title="Create a new workflow blueprint"
              >
                <SparklesIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span className="hidden sm:inline">New</span>
              </button>

              {/* Toggle Execution Console */}
              <WorkflowConsoleToggleButton
                isOpen={isConsoleOpen}
                onToggle={() => setIsConsoleOpen((prev) => !prev)}
                isRunning={isRunning}
              />

              {/* Run/Stop Workflow Button */}
              <WorkflowRunButton
                isRunning={isRunning}
                onRun={() => {
                  setIsConsoleOpen(true);
                  runPipeline();
                }}
                onStop={stopPipeline}
              />
            </div>
          </div>

          {/* Execution Error Notice */}
          <WorkflowExecutionErrorAlert
            error={executionError}
            onDismiss={clearExecutionError}
          />

          {/* Collaborative Liveblocks React Flow Canvas */}
          <LiveblocksWorkflowProvider
            key={activeWorkflow.id}
            workflowId={activeWorkflow.id}
            fallback={
              <WorkflowCanvas
                workflowId={activeWorkflow.id}
                initialNodes={activeWorkflow.nodes}
                initialEdges={activeWorkflow.edges}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  if (node) setIsConfigDrawerOpen(true);
                }}
                onSaveWorkflow={saveWorkflow}
                onGraphChange={updateGraph}
                isSaving={isSaving}
                saveStatus={saveStatus}
                lastSavedAt={lastSavedAt}
                externalNodeUpdate={externalNodeUpdate}
                externalNodesUpdates={externalNodesUpdates}
              />
            }
          >
            <CollaborativeCanvas
              workflowId={activeWorkflow.id}
              initialNodes={activeWorkflow.nodes}
              initialEdges={activeWorkflow.edges}
              onSelectNode={(node) => {
                setSelectedNode(node);
                if (node) setIsConfigDrawerOpen(true);
              }}
              onSaveWorkflow={saveWorkflow}
              onGraphChange={updateGraph}
              isSaving={isSaving}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              externalNodeUpdate={externalNodeUpdate}
              externalNodesUpdates={externalNodesUpdates}
              externalNodeAdd={externalNodeAdd}
              externalNodeDeleteId={externalNodeDeleteId}
            />
          </LiveblocksWorkflowProvider>

          {/* Real-time Execution Console & Browserbase Session Relay */}
          {isConsoleOpen && (
            <WorkflowConsoleLog
              workflow={activeWorkflow}
              isRunning={isRunning}
              executionResult={executionResult}
              isOpen={isConsoleOpen}
              onClose={() => setIsConsoleOpen(false)}
              onRunWorkflow={() => runPipeline()}
            />
          )}
        </div>
      </div>

      {/* Edit Workflow Settings & Target URL Modal */}
      <EditWorkflowModal
        isOpen={isEditModalOpen}
        workflow={activeWorkflow}
        onClose={() => setIsEditModalOpen(false)}
        onSave={updateWorkflowDetails}
      />

      {/* Schedule Sheet */}
      <WorkflowScheduleSheet
        isOpen={isScheduleSheetOpen}
        onOpenChange={setIsScheduleSheetOpen}
        workflowId={activeWorkflow.id}
        workflowName={activeWorkflow.name}
      />

      {/* Node Catalog Modal for Customers */}
      <NodeCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectTemplate={(template) => {
          addNode(template);
          setExternalNodeAdd({ template });
        }}
        onOpenAdmin={isAdmin ? () => setIsAdminModalOpen(true) : undefined}
        isAdmin={isAdmin}
      />

      {/* Admin Node Studio Modal */}
      {isAdmin && (
        <AdminNodeManagerModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
        />
      )}

      {/* Node Configuration Drawer */}
      <NodeConfigDrawer
        node={selectedNode}
        isOpen={isConfigDrawerOpen}
        onClose={() => setIsConfigDrawerOpen(false)}
        onSave={(nodeId, updatedData) => {
          updateNode(nodeId, updatedData);
          setExternalNodeUpdate({ id: nodeId, data: updatedData });
        }}
        onDelete={(nodeId) => {
          deleteNode(nodeId);
          setExternalNodeDeleteId(nodeId);
        }}
      />

      {/* Shadcn Alert Dialog for Execution / Validation Notices */}
      <AlertDialog
        open={Boolean(executionError)}
        onOpenChange={(open) => {
          if (!open) clearExecutionError();
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="text-base font-bold text-zinc-900">
                Workflow Notice
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-zinc-600 leading-relaxed">
              {executionError}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={clearExecutionError}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer"
            >
              Acknowledge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
