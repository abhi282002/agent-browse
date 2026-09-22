'use client';

import { useState } from 'react';
import { useWorkflowManager } from './hooks/useWorkflowManager';
import { WorkflowCanvas } from './WorkflowCanvas';
import { LiveblocksWorkflowProvider, CollaborativeCanvas } from './liveblocks';
import { NodePaletteSidebar } from './nodes/NodePaletteSidebar';
import { NodeCatalogModal } from './nodes/NodeCatalogModal';
import { NodeConfigDrawer } from './nodes/NodeConfigDrawer';
import { AdminNodeManagerModal } from './admin/AdminNodeManagerModal';
import { EditWorkflowModal } from './modals/EditWorkflowModal';
import { CreateWorkflowView } from './views/CreateWorkflowView';
import { EmptyWorkflowState } from './views/EmptyWorkflowState';
import { WorkflowExecutionErrorAlert } from './execution/WorkflowExecutionErrorAlert';
import { WorkflowScheduleSheet } from './execution/WorkflowScheduleSheet';
import { WorkflowToolbar } from './WorkflowToolbar';
import { AiGenerateWorkflowSheet } from './modals/AiGenerateWorkflowSheet';
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
  const [externalNodeDeleteId, setExternalNodeDeleteId] = useState<
    string | null
  >(null);

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
    (
      updates: Array<{ id: string; data: Partial<WorkflowNodeType['data']> }>,
    ) => {
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
    activeOrganization,
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
  const [isAiGenerateModalOpen, setIsAiGenerateModalOpen] = useState(false);

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
        organizationName={activeOrganization?.name}
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
    return (
      <EmptyWorkflowState onCreateWorkflow={() => setIsCreateView(true)} />
    );
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
          <WorkflowToolbar
            workflows={workflows}
            activeWorkflow={activeWorkflow}
            selectWorkflow={selectWorkflow}
            saveWorkflow={saveWorkflow}
            isSaving={isSaving}
            saveStatus={saveStatus}
            isSyncing={isSyncing}
            isAdmin={isAdmin}
            isRunning={isRunning}
            isConsoleOpen={isConsoleOpen}
            onOpenAdminModal={() => setIsAdminModalOpen(true)}
            onOpenEditModal={() => setIsEditModalOpen(true)}
            onOpenScheduleSheet={() => setIsScheduleSheetOpen(true)}
            onOpenCreateView={() => setIsCreateView(true)}
            onOpenAiGenerate={() => setIsAiGenerateModalOpen(true)}
            onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
            onRunPipeline={() => {
              setIsConsoleOpen(true);
              runPipeline();
            }}
            onStopPipeline={stopPipeline}
          />

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

      {/* AI Generate Workflow Sheet (Sliding in from Left) */}
      <AiGenerateWorkflowSheet
        isOpen={isAiGenerateModalOpen}
        onClose={() => setIsAiGenerateModalOpen(false)}
        activeOrganization={activeOrganization}
        onWorkflowGenerated={(newWf) => {
          selectWorkflow(newWf.id);
        }}
      />
    </div>
  );
}
