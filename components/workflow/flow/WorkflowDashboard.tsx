"use client";

import React, { useState, useCallback } from "react";
import type { WorkflowBlueprint, WorkflowNodeType } from "./types";
import { DEFAULT_WORKFLOWS } from "./defaultFlows";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { WorkflowSidebar } from "./WorkflowSidebar";
import { CreateWorkflowModal } from "./CreateWorkflowModal";

export function WorkflowDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowBlueprint[]>(DEFAULT_WORKFLOWS);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(DEFAULT_WORKFLOWS[0].id);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const activeWorkflow =
    workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  const handleSelectWorkflow = useCallback((id: string) => {
    setActiveWorkflowId(id);
    setSelectedNode(null);
  }, []);

  const handleCreateWorkflow = useCallback((newWf: WorkflowBlueprint) => {
    setWorkflows((prev) => [newWf, ...prev]);
    setActiveWorkflowId(newWf.id);
    setSelectedNode(null);
  }, []);

  const handleRunWorkflow = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);

    const totalNodes = activeWorkflow.nodes.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= totalNodes) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }

      setWorkflows((prev) =>
        prev.map((wf) => {
          if (wf.id !== activeWorkflow.id) return wf;

          const updatedNodes = wf.nodes.map((node, i) => {
            if (i === currentIdx) {
              return {
                ...node,
                data: { ...node.data, status: "running" as const },
              };
            }
            if (i < currentIdx) {
              return {
                ...node,
                data: { ...node.data, status: "completed" as const },
              };
            }
            return {
              ...node,
              data: { ...node.data, status: "idle" as const },
            };
          });

          return { ...wf, nodes: updatedNodes };
        })
      );

      setSelectedNode(activeWorkflow.nodes[currentIdx] || null);
      currentIdx++;
    }, 1200);
  }, [isRunning, activeWorkflow]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 2-Column Responsive Layout: Grid Canvas on Left, Workflow Details Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: React Flow Grid Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <WorkflowCanvas
            initialNodes={activeWorkflow.nodes}
            initialEdges={activeWorkflow.edges}
            onSelectNode={setSelectedNode}
            selectedNodeId={selectedNode?.id}
          />
        </div>

        {/* Right: Sidebar with Workflow Name & Inspector (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <WorkflowSidebar
            workflow={activeWorkflow}
            allWorkflows={workflows}
            onSelectWorkflow={handleSelectWorkflow}
            selectedNode={selectedNode}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onRunWorkflow={handleRunWorkflow}
            isRunning={isRunning}
          />
        </div>
      </div>

      {/* Screen / Modal to Create New Workflow */}
      <CreateWorkflowModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateWorkflow}
      />
    </div>
  );
}
