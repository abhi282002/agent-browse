"use client";

import React, { useState } from "react";
import { useWorkflowManager } from "./hooks/useWorkflowManager";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { WorkflowSidebar } from "./WorkflowSidebar";
import { NodePalette } from "./nodes/NodePalette";
import { NodeCatalogModal } from "./nodes/NodeCatalogModal";
import { NodeConfigDrawer } from "./nodes/NodeConfigDrawer";
import { AdminNodeManagerModal } from "./admin/AdminNodeManagerModal";
import { CreateWorkflowView } from "./views/CreateWorkflowView";

interface WorkflowDashboardProps {
  initialCreateMode?: boolean;
}

export function WorkflowDashboard({ initialCreateMode = false }: WorkflowDashboardProps) {
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
    setSelectedNode,
    runPipeline,
    isSyncing,
  } = useWorkflowManager();

  const [isCreateView, setIsCreateView] = useState(initialCreateMode);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

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
                    <span className="text-emerald-700 font-medium">DB Synced</span>
                  </>
                )}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Nodes: {activeWorkflow.nodes.length}</span>
            </div>
          </div>

          {/* React Flow Interactive Grid Canvas */}
          <WorkflowCanvas
            key={activeWorkflow.id}
            workflowId={activeWorkflow.id}
            initialNodes={activeWorkflow.nodes}
            initialEdges={activeWorkflow.edges}
            onSelectNode={setSelectedNode}
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
            onOpenNodeCatalog={() => setIsCatalogOpen(true)}
            onOpenNodeConfig={() => setIsConfigDrawerOpen(true)}
            onRunWorkflow={runPipeline}
            isRunning={isRunning}
          />
        </div>
      </div>

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
