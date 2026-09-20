'use client';

import { useState } from 'react';
import { useWorkflowManager } from './hooks/useWorkflowManager';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowSidebar } from './WorkflowSidebar';
import { NodePalette } from './nodes/NodePalette';
import { NodeCatalogModal } from './nodes/NodeCatalogModal';
import { NodeConfigDrawer } from './nodes/NodeConfigDrawer';
import { AdminNodeManagerModal } from './admin/AdminNodeManagerModal';
import { EditWorkflowModal } from './modals/EditWorkflowModal';
import { CreateWorkflowView } from './views/CreateWorkflowView';
import { BotIcon, SparklesIcon } from '@/components/ui/icons';

interface WorkflowDashboardProps {
  initialCreateMode?: boolean;
}

export function WorkflowDashboard({
  initialCreateMode = false,
}: WorkflowDashboardProps) {
  const {
    workflows,
    activeWorkflow,
    selectedNode,
    isRunning,
    selectWorkflow,
    createWorkflow,
    addNode,
    updateNode,
    deleteNode,
    updateWorkflowDetails,
    setSelectedNode,
    runPipeline,
    isSyncing,
    saveWorkflow,
    updateGraph,
    saveStatus,
    lastSavedAt,
    isSaving,
  } = useWorkflowManager();

  const [isCreateView, setIsCreateView] = useState(initialCreateMode);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
    return (
      <div className="w-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xs mb-4">
          <BotIcon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">
          No Workflows in Database
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-md">
          Create your first autonomous browser agent workflow to start
          automating tasks with Chromium and AI vision.
        </p>
        <button
          type="button"
          onClick={() => setIsCreateView(true)}
          className="mt-5 flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 shadow-sm transition-all cursor-pointer"
        >
          <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>+ Create New Workflow</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 2-Column Responsive Layout: Grid Canvas on Left, Workflow Details Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: React Flow Grid Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Top Canvas Bar with Node Palette & Admin Studio Trigger */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <NodePalette
              onAddNode={addNode}
              onOpenCatalog={() => setIsCatalogOpen(true)}
            />

            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
              <button
                type="button"
                onClick={() => saveWorkflow()}
                disabled={isSaving}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
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

              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-amber-300/80 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                title="Admin studio to create, edit, or customize Free/PRO nodes"
              >
                <span>⚙️ Admin Node Studio</span>
              </button>

              <span className="hidden sm:inline">•</span>

              <span className="hidden sm:flex items-center gap-1">
                {isSyncing ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-amber-700">Syncing...</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700 font-medium">
                      DB Synced
                    </span>
                  </>
                )}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                Nodes: {activeWorkflow.nodes.length}
              </span>
            </div>
          </div>

          {/* React Flow Interactive Grid Canvas */}
          <WorkflowCanvas
            key={activeWorkflow.id}
            workflowId={activeWorkflow.id}
            initialNodes={activeWorkflow.nodes}
            initialEdges={activeWorkflow.edges}
            onSelectNode={setSelectedNode}
            onSaveWorkflow={saveWorkflow}
            onGraphChange={updateGraph}
            isSaving={isSaving}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
          />
        </div>

        {/* Right: Sidebar with Workflow Name, Execution Trigger & Node Details (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <WorkflowSidebar
            workflow={activeWorkflow}
            allWorkflows={workflows}
            onSelectWorkflow={selectWorkflow}
            selectedNode={selectedNode}
            onOpenCreateModal={() => setIsCreateView(true)}
            onOpenEditWorkflow={() => setIsEditModalOpen(true)}
            onOpenNodeCatalog={() => setIsCatalogOpen(true)}
            onOpenNodeConfig={() => setIsConfigDrawerOpen(true)}
            onRunWorkflow={runPipeline}
            isRunning={isRunning}
            onSaveWorkflow={() => saveWorkflow()}
            isSaving={isSaving}
            saveStatus={saveStatus}
          />
        </div>
      </div>

      {/* Edit Workflow Settings & Target URL Modal */}
      <EditWorkflowModal
        isOpen={isEditModalOpen}
        workflow={activeWorkflow}
        onClose={() => setIsEditModalOpen(false)}
        onSave={updateWorkflowDetails}
      />

      {/* Node Catalog Modal for Customers */}
      <NodeCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectTemplate={(template) => {
          addNode(template);
        }}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Admin Node Studio Modal */}
      <AdminNodeManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Node Configuration Drawer */}
      <NodeConfigDrawer
        node={selectedNode}
        isOpen={isConfigDrawerOpen}
        onClose={() => setIsConfigDrawerOpen(false)}
        onSave={updateNode}
        onDelete={deleteNode}
      />
    </div>
  );
}
